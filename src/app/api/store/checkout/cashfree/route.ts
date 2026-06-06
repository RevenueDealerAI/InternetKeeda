/**
 * POST /api/store/checkout/cashfree
 *
 * Cashfree INR checkout for Keeda Labs digital downloads. Mirrors the
 * boost-create route's create-then-call pattern so the Payment row
 * always exists before the upstream call — no orphan PSP orders.
 *
 * On success returns { paymentSessionId, orderId, paymentDbId } —
 * the client hands paymentSessionId to the Cashfree JS SDK exactly
 * the same way the boost flow does.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'node:crypto';
import mongoose from 'mongoose';
import { z } from 'zod';
import { connectDB } from '@/app/api/lib/db';
import { errorResponse, getAuth } from '@/app/api/lib/auth';
import { requireUser } from '@/lib/auth/user';
import { Payment } from '@/app/api/models/Payment';
import { getCashfreeClient, getCashfreeMode } from '@/lib/cashfree';
import { StoreProduct } from '@/features/store/models/StoreProduct';
import { STORE_PRODUCT_TYPE } from '@/features/store/config';
import {
  pickAddOnsFromIds,
  sumAddOnInrMinor,
} from '@/features/store/lib/addons';

/** Guest checkout payload. When the buyer chooses "Continue as guest"
 *  instead of signing in, the form collects these and we mint a
 *  guest_<random> userId for the Payment + StorePurchase rows. */
const guestSchema = z.object({
  email: z.string().email('A valid email is required.'),
  name: z.string().min(1).max(120).optional(),
  /** International format, e.g. +919876543210. Cashfree's API needs a
   *  customer_phone — for guests we use what they enter, with the same
   *  +91 placeholder fallback applied to signed-in users without one. */
  phone: z
    .string()
    .regex(/^\+?\d{8,15}$/, 'Phone must be 8-15 digits, optionally with +.')
    .optional(),
});

const bodySchema = z.object({
  productId: z.string().min(1, 'productId is required'),
  /** Optional add-on IDs from the checkout UI. Server validates them
   *  against the canonical config (src/features/store/lib/addons.ts);
   *  anything unknown is dropped silently — the order summary the
   *  buyer saw was server-rendered from the same source. */
  addOnIds: z.array(z.string()).optional(),
  /** Optional guest contact block. When present (and the requester is
   *  not signed in), the buyer goes through the guest checkout flow. */
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

    const parsed = bodySchema.parse(await req.json());
    const { productId, addOnIds: rawAddOnIds, guest } = parsed;

    // Identity resolution: either an authenticated Clerk user OR a
    // guest who supplied an email. Signed-in users with a guest block
    // in the body get the Clerk identity (we don't honour the guest
    // block when a session exists — prevents identity laundering).
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

    // Validate add-ons against canonical config + price server-side
    // so the buyer can NEVER inflate or zero out a line item from
    // the request body.
    const addOns = pickAddOnsFromIds(rawAddOnIds);
    const addOnTotalInr = sumAddOnInrMinor(addOns);
    const totalInr = product.priceInrMinor + addOnTotalInr;
    const validAddOnIds = addOns.map((a) => a.id);
    const needsFollowUp = addOns.some((a) => !!a.followUpTag);

    // Build buyer identity. For signed-in: pull from Clerk. For guests:
    // synthesise a stable random id so all downstream rows (Payment,
    // StorePurchase, webhook trail) share a single foreign key.
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
    // Phone: signed-in uses the verified Clerk phone if available,
    // guest uses the form value. Either way we apply the placeholder
    // fallback so PGCreateOrder always gets a valid customer_phone.
    let buyerPhoneRaw = '';
    if (isAuthed) {
      const verifiedPhone = clerkUser?.phoneNumbers?.find(
        (p) => p?.verification?.status === 'verified'
      );
      buyerPhoneRaw = (verifiedPhone?.phoneNumber || '').trim();
    } else if (guest?.phone) {
      buyerPhoneRaw = guest.phone.startsWith('+') ? guest.phone : `+${guest.phone}`;
    }
    if (!/^\+\d{8,15}$/.test(buyerPhoneRaw)) {
      buyerPhoneRaw = '+919999999999';
    }

    // Pre-create the pending Payment so we have a stable id for the
    // PSP order tag. Same shape as the boost rows minus toolId.
    // Use a unique placeholder orderId (Payment.orderId has a unique
    // index) — two concurrent checkouts must not collide on the
    // literal "pending" sentinel. Mirrors the PayPal route's pattern.
    const dbId = new mongoose.Types.ObjectId();
    const placeholder = `cashfree_pending_${dbId.toString()}_${Date.now()}`;
    const payment = await Payment.create({
      _id: dbId,
      userId: buyerUserId,
      provider: 'cashfree',
      orderId: placeholder,
      amount: totalInr,
      currency: 'INR',
      productType: STORE_PRODUCT_TYPE,
      boostDurationDays: 0,
      status: 'pending',
      cashfreeMode: getCashfreeMode(),
      metadata: {
        storeProductId: String(product._id),
        storeProductTitle: product.title,
        addOnIds: validAddOnIds,
        addOnAmountMinor: addOnTotalInr,
        needsFollowUp,
        // Buyer contact details — pulled forward into StorePurchase by
        // markStorePaid. Persisting them here means a delivery email
        // can still be rendered if the Clerk lookup ever fails.
        buyerEmail,
        buyerName,
        buyerPhone: buyerPhoneRaw,
        guest: !isAuthed
          ? {
              isGuest: true,
              email: guest!.email,
              name: guest!.name,
              phone: buyerPhoneRaw,
            }
          : undefined,
      },
    });

    const orderId = `store_${payment._id.toString()}_${Date.now()}`;
    const orderAmountRupees = Math.round(totalInr) / 100;

    const customerPhone = buyerPhoneRaw;
    const customerEmail = buyerEmail;
    const customerName = buyerName;

    const origin = siteOrigin(req);

    try {
      const cf = getCashfreeClient();
      const cfResp = await cf.PGCreateOrder({
        order_id: orderId,
        order_amount: orderAmountRupees,
        order_currency: 'INR',
        customer_details: {
          customer_id: buyerUserId,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          ...(customerName ? { customer_name: customerName } : {}),
        },
        order_meta: {
          return_url: `${origin}/store/payment/return?order_id={order_id}`,
          notify_url: `${origin}/api/webhooks/cashfree-pg`,
        },
        order_note: `Keeda Labs: ${product.title}`,
        order_tags: {
          productType: STORE_PRODUCT_TYPE,
          storeProductId: String(product._id),
          paymentDbId: String(payment._id),
          // Cashfree order_tag VALUES are restricted to alphanumeric +
          // '_'/'-' (parens, spaces, commas all rejected with a 400).
          // Sanitise the IDs and use 'none' (no parens) when empty.
          addOnIds: validAddOnIds.length
            ? validAddOnIds.map((id) => id.replace(/[^A-Za-z0-9_-]/g, '_')).join('_')
            : 'none',
        },
      });

      const paymentSessionId = (cfResp.data as { payment_session_id?: string })
        .payment_session_id;
      const cfOrderStatus = (cfResp.data as { order_status?: string })
        .order_status;

      payment.orderId = orderId;
      payment.paymentSessionId = paymentSessionId;
      payment.cashfreeOrderStatus = cfOrderStatus;
      payment.metadata = {
        ...(payment.metadata || {}),
        createOrderResponse: cfResp.data,
      };
      await payment.save();

      return NextResponse.json({
        paymentSessionId,
        orderId,
        paymentDbId: String(payment._id),
        amount: totalInr,
        baseAmount: product.priceInrMinor,
        addOnAmount: addOnTotalInr,
        addOnIds: validAddOnIds,
        currency: 'INR',
        productType: STORE_PRODUCT_TYPE,
        mode: process.env.CASHFREE_MODE === 'PROD' ? 'production' : 'sandbox',
      });
    } catch (cfErr) {
      payment.status = 'failed';
      payment.metadata = {
        ...(payment.metadata || {}),
        error: cfErr instanceof Error ? cfErr.message : String(cfErr),
      };
      await payment.save();
      console.error('[store/cashfree] PGCreateOrder failed:', cfErr);
      return errorResponse('Failed to create Cashfree order', 502);
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.errors },
        { status: 400 }
      );
    }
    console.error('[store/cashfree] error:', err);
    return errorResponse('Failed to create store checkout', 500);
  }
}
