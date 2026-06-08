/**
 * GET /api/store/checkout/status?orderId=XXX
 *
 * Store equivalent of /api/payments/status. Same self-healing model:
 * if the row is still 'pending' but the PSP reports terminal state,
 * we invoke markStorePaid / mark-as-failed via the shared store
 * server-side reconciler.
 *
 * Why a dedicated endpoint instead of patching the boost status
 * route: the dispatch table for productType lives in the store
 * feature folder, and the boost status route lives in the legacy
 * /api/payments tree. Keeping the store self-heal here preserves
 * the isolation boundary.
 *
 * Returns a small response shape the /store/payment/return page
 * polls until it sees a terminal status. On success, the response
 * also carries `purchaseId` so the page can deep-link straight to
 * /api/store/download/{purchaseId}.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/api/lib/db';
import { requireUser } from '@/lib/auth/user';
import { Payment } from '@/app/api/models/Payment';
import { StorePurchase } from '@/features/store/models/StorePurchase';
import { getCashfreeClient } from '@/lib/cashfree';
import { getOrder as getPayPalOrder, PayPalError } from '@/lib/paypal';
import { markStorePaid } from '@/features/store/server/markPaid';
import { STORE_PRODUCT_TYPE } from '@/features/store/config';

export const dynamic = 'force-dynamic';

// Stale-pending TTL: if a Payment row has been pending this long and
// the PSP can't or won't confirm a terminal state, we mark it failed
// so the return page can move on instead of spinning forever. 30
// minutes is well past every PSP's normal confirmation window
// (Cashfree confirms in seconds; PayPal in seconds-to-minutes) and
// well under their own order-expiry windows (Cashfree ~1h, PayPal
// ~3h), so we won't auto-fail an order that's still actually live.
const STALE_PENDING_MS = 30 * 60 * 1000;

export async function GET(req: NextRequest) {
  const orderId = new URL(req.url).searchParams.get('orderId');
  if (!orderId) {
    return NextResponse.json(
      { error: 'orderId is required' },
      { status: 400 }
    );
  }

  await connectDB();
  let payment = await Payment.findOne({ orderId });
  if (!payment) {
    return NextResponse.json({ error: 'Order not found' }, { status: 404 });
  }
  if (payment.productType !== STORE_PRODUCT_TYPE) {
    return NextResponse.json(
      { error: 'Not a store order' },
      { status: 400 }
    );
  }

  // Identity gate. Two paths:
  //   - Signed-in buyer: require Clerk session matching payment.userId.
  //   - Guest buyer (payment.userId starts with "guest_"): the orderId
  //     itself is the bearer secret — it's a server-minted, opaque
  //     string we never expose anywhere except the return URL we
  //     constructed for THIS buyer. Allow anon reads in that case.
  //
  // This is the same shape PSP "return URLs" everywhere use:
  // anyone with the order id can read its status. It's safe because
  // the orderId reveals nothing the buyer doesn't already know — and
  // they need to know whether their payment landed.
  const isGuestPayment = payment.userId.startsWith('guest_');
  if (!isGuestPayment) {
    const auth = await requireUser();
    if (auth.kind !== 'ok') {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    if (payment.userId !== auth.userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }
  }

  // Self-heal: if status is still pending, ask the PSP what it knows.
  if (payment.status === 'pending' && payment.provider === 'paypal') {
    try {
      const ppOrder = await getPayPalOrder(orderId);
      if (ppOrder.status === 'COMPLETED') {
        const captureId =
          ppOrder.purchase_units?.[0]?.payments?.captures?.[0]?.id;
        const { applied } = await markStorePaid(orderId, {
          source: 'polling-fallback',
          paypalCaptureId: captureId,
        });
        if (applied && captureId) {
          await Payment.updateOne(
            { orderId },
            { $set: { paypalCaptureId: captureId } }
          );
        }
        payment = (await Payment.findOne({ orderId })) ?? payment;
      } else if (ppOrder.status === 'VOIDED') {
        await Payment.updateOne(
          { orderId, status: 'pending' },
          { $set: { status: 'failed' } }
        );
        payment = (await Payment.findOne({ orderId })) ?? payment;
      }
    } catch (err) {
      if (err instanceof PayPalError) {
        console.warn('[store/status] paypal fetch failed', err.message);
      } else {
        console.warn('[store/status] paypal fetch failed', err);
      }
    }
  } else if (payment.status === 'pending' && payment.provider === 'cashfree') {
    try {
      const cf = getCashfreeClient();
      const resp = await cf.PGFetchOrder(orderId);
      const cfStatus = String(
        (resp.data as { order_status?: string }).order_status || ''
      ).toUpperCase();

      if (cfStatus === 'PAID') {
        await markStorePaid(orderId, { source: 'polling-fallback' });
        payment = (await Payment.findOne({ orderId })) ?? payment;
      } else if (
        cfStatus === 'FAILED' ||
        cfStatus === 'PAYMENT_FAILED' ||
        cfStatus === 'USER_DROPPED' ||
        cfStatus === 'TERMINATION_REQUESTED' ||
        cfStatus === 'EXPIRED'
      ) {
        await Payment.updateOne(
          { orderId, status: 'pending' },
          { $set: { status: 'failed', cashfreeOrderStatus: cfStatus } }
        );
        payment = (await Payment.findOne({ orderId })) ?? payment;
      } else if (payment) {
        payment.cashfreeOrderStatus = (
          resp.data as { order_status?: string }
        ).order_status;
        await payment.save();
      }
    } catch (err) {
      console.warn('[store/status] cashfree fetch failed', err);
    }
  }

  // Time-based auto-fail. If the row is STILL pending after we've
  // asked the PSP, and it was created more than STALE_PENDING_MS ago,
  // the buyer most likely opened the hosted page and walked away. The
  // PSP order may still be technically active (1-3h expiry window) but
  // the buyer is gone; failing it here means the return page can stop
  // spinning, and a future re-check is cheap because the matured PSP
  // status will overwrite this if a webhook eventually does land.
  if (payment.status === 'pending') {
    const ageMs = Date.now() - new Date(payment.createdAt).getTime();
    if (ageMs > STALE_PENDING_MS) {
      await Payment.updateOne(
        { orderId, status: 'pending' },
        {
          $set: {
            status: 'failed',
            paymentVerifiedVia: 'stale-timeout',
          },
        }
      );
      payment = (await Payment.findOne({ orderId })) ?? payment;
    }
  }

  // If the payment is now success, surface the matching StorePurchase
  // id so the return page can link straight to the download.
  let purchaseId: string | undefined;
  let productSlug: string | undefined;
  let productTitle: string | undefined;
  if (payment.status === 'success') {
    const purchase = await StorePurchase.findOne({
      paymentId: String(payment._id),
    })
      .select('_id productSlug productTitle')
      .lean();
    if (purchase) {
      purchaseId = String(purchase._id);
      productSlug = purchase.productSlug;
      productTitle = purchase.productTitle;
    }
  }

  return NextResponse.json({
    orderId: payment.orderId,
    status: payment.status,
    provider: payment.provider,
    amount: payment.amount,
    currency: payment.currency,
    paidAt: payment.paidAt,
    paymentVerifiedVia: payment.paymentVerifiedVia,
    purchaseId,
    productSlug,
    productTitle,
    // Tells the return page to show "check your email — workflow
    // attached" instead of the in-app Download CTA. Guests have no
    // /store/my-downloads access (no Clerk session); delivery is
    // the Resend email with the ZIP attachment.
    isGuest: isGuestPayment,
  });
}
