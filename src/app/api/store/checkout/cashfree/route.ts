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

const bodySchema = z.object({
  productId: z.string().min(1, 'productId is required'),
  /** Optional add-on IDs from the checkout UI. Server validates them
   *  against the canonical config (src/features/store/lib/addons.ts);
   *  anything unknown is dropped silently — the order summary the
   *  buyer saw was server-rendered from the same source. */
  addOnIds: z.array(z.string()).optional(),
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
    const auth = await requireUser();
    if (auth.kind !== 'ok') {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }

    const { productId, addOnIds: rawAddOnIds } = bodySchema.parse(await req.json());

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

    // Pre-create the pending Payment so we have a stable id for the
    // PSP order tag. Same shape as the boost rows minus toolId.
    const payment = await Payment.create({
      userId: auth.userId,
      provider: 'cashfree',
      orderId: 'pending',
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
      },
    });

    const orderId = `store_${payment._id.toString()}_${Date.now()}`;
    const orderAmountRupees = Math.round(totalInr) / 100;

    // Cashfree requires customer_phone in customer_details. For
    // subscription mandates the verified phone is mandatory (mandate
    // SMS routing). For one-time PG orders like Keeda Labs purchases
    // it isn't — Cashfree just needs a syntactically valid number to
    // accept the request. Use the Clerk verified phone if we have one;
    // otherwise fall back to a placeholder so the buyer can complete
    // checkout even without a verified phone on their profile.
    const clerkUser = await getAuth();
    const verifiedPhone = clerkUser?.phoneNumbers?.find(
      (p) => p?.verification?.status === 'verified'
    );
    let customerPhone = (verifiedPhone?.phoneNumber || '').trim();
    if (!/^\+\d{8,15}$/.test(customerPhone)) {
      // Placeholder Indian number Cashfree accepts in PROD orders for
      // accounts that haven't surfaced a verified mobile yet. Phone
      // contact for the order travels through email + WhatsApp via
      // the delivery email, not via this field.
      customerPhone = '+919999999999';
    }
    const customerEmail =
      clerkUser?.emailAddresses?.[0]?.emailAddress ||
      `${auth.userId}@no-email.internetkeeda.com`;
    const customerName =
      `${clerkUser?.firstName ?? ''} ${clerkUser?.lastName ?? ''}`.trim() ||
      undefined;

    const origin = siteOrigin(req);

    try {
      const cf = getCashfreeClient();
      const cfResp = await cf.PGCreateOrder({
        order_id: orderId,
        order_amount: orderAmountRupees,
        order_currency: 'INR',
        customer_details: {
          customer_id: auth.userId,
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
