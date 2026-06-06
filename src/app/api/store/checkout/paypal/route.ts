/**
 * POST /api/store/checkout/paypal
 *
 * PayPal USD checkout for Keeda Labs digital downloads. Same shape
 * as /api/payments/paypal/create-boost-order — pre-create the Payment
 * row, call createOneTimeOrder, return the approveUrl.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { z } from 'zod';
import { connectDB } from '@/app/api/lib/db';
import { errorResponse, getAuth } from '@/app/api/lib/auth';
import { requireUser } from '@/lib/auth/user';
import { Payment } from '@/app/api/models/Payment';
import { createOneTimeOrder, getPaypalMode, PayPalError } from '@/lib/paypal';
import { StoreProduct } from '@/features/store/models/StoreProduct';
import { STORE_PRODUCT_TYPE } from '@/features/store/config';
import { toMajor } from '@/features/store/lib/pricing';
import {
  pickAddOnsFromIds,
  sumAddOnUsdMinor,
} from '@/features/store/lib/addons';

/** Guest checkout payload. Same shape as the Cashfree route's guest
 *  block — phone is optional for USD since PayPal doesn't require it. */
const guestSchema = z.object({
  email: z.string().email('A valid email is required.'),
  name: z.string().min(1).max(120).optional(),
  phone: z
    .string()
    .regex(/^\+?\d{8,15}$/, 'Phone must be 8-15 digits, optionally with +.')
    .optional(),
});

const bodySchema = z.object({
  productId: z.string().min(1, 'productId is required'),
  /** Same validation contract as the Cashfree route. */
  addOnIds: z.array(z.string()).optional(),
  guest: guestSchema.optional(),
});

function siteOrigin(req: NextRequest): string {
  const env =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, '');
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { productId, addOnIds: rawAddOnIds, guest } = bodySchema.parse(
      await req.json()
    );

    const auth = await requireUser();
    const isAuthed = auth.kind === 'ok';
    if (!isAuthed && !guest) {
      return NextResponse.json(
        {
          error: 'unauthenticated',
          message:
            'Sign in, or include a guest { email, name?, phone? } block to check out without an account.',
        },
        { status: 401 }
      );
    }

    const product = await StoreProduct.findById(productId);
    if (!product || product.status !== 'published') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const addOns = pickAddOnsFromIds(rawAddOnIds);
    const addOnTotalUsd = sumAddOnUsdMinor(addOns);
    const totalUsd = product.priceUsdMinor + addOnTotalUsd;
    const validAddOnIds = addOns.map((a) => a.id);
    const needsFollowUp = addOns.some((a) => !!a.followUpTag);

    // Identity resolution — same pattern as the Cashfree route.
    const clerkUser = isAuthed ? await getAuth() : null;
    const buyerUserId = isAuthed
      ? auth.userId
      : `guest_${crypto.randomBytes(8).toString('hex')}`;
    const buyerEmail = isAuthed
      ? clerkUser?.emailAddresses?.[0]?.emailAddress ||
        `${auth.userId}@no-email.internetkeeda.com`
      : guest!.email;
    const buyerName = isAuthed
      ? `${clerkUser?.firstName ?? ''} ${clerkUser?.lastName ?? ''}`.trim() ||
        undefined
      : guest!.name;
    const buyerPhone = isAuthed
      ? clerkUser?.phoneNumbers?.find(
          (p) => p?.verification?.status === 'verified'
        )?.phoneNumber || undefined
      : guest?.phone
        ? guest.phone.startsWith('+')
          ? guest.phone
          : `+${guest.phone}`
        : undefined;

    const dbId = new mongoose.Types.ObjectId();
    const placeholder = `paypal_pending_${dbId.toString()}_${Date.now()}`;

    const payment = await Payment.create({
      _id: dbId,
      userId: buyerUserId,
      provider: 'paypal',
      orderId: placeholder,
      amount: totalUsd,
      currency: 'USD',
      productType: STORE_PRODUCT_TYPE,
      boostDurationDays: 0,
      status: 'pending',
      paypalMode: getPaypalMode(),
      metadata: {
        storeProductId: String(product._id),
        storeProductTitle: product.title,
        addOnIds: validAddOnIds,
        addOnAmountMinor: addOnTotalUsd,
        needsFollowUp,
        buyerEmail,
        buyerName,
        buyerPhone,
        guest: !isAuthed
          ? {
              isGuest: true,
              email: guest!.email,
              name: guest!.name,
              phone: buyerPhone,
            }
          : undefined,
      },
    });

    const origin = siteOrigin(req);
    try {
      const addonSuffix = validAddOnIds.length
        ? ` (+ ${validAddOnIds.length} add-on${validAddOnIds.length > 1 ? 's' : ''})`
        : '';
      const created = await createOneTimeOrder({
        amountUsd: toMajor(totalUsd),
        description: `Keeda Labs: ${product.title}${addonSuffix}`,
        customId: String(payment._id),
        referenceId: STORE_PRODUCT_TYPE,
        returnUrl: `${origin}/store/payment/return?provider=paypal&payment_db_id=${String(payment._id)}`,
        cancelUrl: `${origin}/store/payment/return?provider=paypal&cancelled=1&payment_db_id=${String(payment._id)}`,
      });

      payment.orderId = created.id;
      payment.paypalOrderId = created.id;
      payment.metadata = {
        ...(payment.metadata || {}),
        createResponse: created.raw as unknown as Record<string, unknown>,
      };
      await payment.save();

      return NextResponse.json({
        orderId: created.id,
        paymentDbId: String(payment._id),
        approveUrl: created.approveUrl,
        amount: totalUsd,
        baseAmount: product.priceUsdMinor,
        addOnAmount: addOnTotalUsd,
        addOnIds: validAddOnIds,
        currency: 'USD',
        provider: 'paypal',
      });
    } catch (err) {
      payment.status = 'failed';
      payment.metadata = {
        ...(payment.metadata || {}),
        error: err instanceof Error ? err.message : String(err),
      };
      await payment.save();
      if (err instanceof PayPalError) {
        console.error('[store/paypal] paypal error:', err);
        return errorResponse(`PayPal order create failed: ${err.message}`, 502);
      }
      throw err;
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.errors },
        { status: 400 }
      );
    }
    console.error('[store/paypal] error:', err);
    return errorResponse('Failed to create PayPal store order', 500);
  }
}
