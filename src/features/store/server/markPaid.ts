/**
 * Idempotent reconciler for store-purchase payments.
 *
 * Mirrors the shape of markBoostPaid in src/app/api/lib/boost-state.ts:
 *   - Atomic findOneAndUpdate on { orderId, status: 'pending' } so
 *     concurrent webhook + polling-fallback callers race safely.
 *   - Only the winner runs side effects (mint StorePurchase, bump
 *     salesCount). The loser returns { applied: false } and no-ops.
 *
 * Called from:
 *   - The Cashfree webhook (PAYMENT_SUCCESS_WEBHOOK case) when
 *     payment.productType === 'store-purchase'.
 *   - The PayPal webhook (PAYMENT.CAPTURE.COMPLETED) same condition.
 *   - The /api/payments/status polling-fallback (future) — same.
 */

import { connectDB } from '@/app/api/lib/db';
import { Payment, type PaymentDocument } from '@/app/api/models/Payment';
import { StoreProduct } from '../models/StoreProduct';
import { StorePurchase } from '../models/StorePurchase';
import type { StoreCurrency } from '../config';

interface MarkOpts {
  source: 'webhook' | 'polling-fallback';
  cashfreePaymentId?: string;
  paypalCaptureId?: string;
}

export interface ReconcileResult {
  applied: boolean;
  payment?: PaymentDocument;
  purchaseId?: string;
}

/**
 * Transition a store-purchase Payment row from pending → success and
 * mint the StorePurchase entitlement row. Idempotent: if the row is
 * already settled, returns { applied: false }.
 */
export async function markStorePaid(
  orderId: string,
  opts: MarkOpts
): Promise<ReconcileResult> {
  await connectDB();

  const setFields: Record<string, unknown> = {
    status: 'success',
    paidAt: new Date(),
    paymentVerifiedVia: opts.source,
  };
  if (opts.cashfreePaymentId) setFields.cashfreePaymentId = opts.cashfreePaymentId;
  if (opts.paypalCaptureId) setFields.paypalCaptureId = opts.paypalCaptureId;

  const payment = await Payment.findOneAndUpdate(
    { orderId, status: 'pending' },
    { $set: setFields },
    { new: true }
  );

  if (!payment) return { applied: false };
  if (payment.productType !== 'store-purchase') {
    // Defensive: only happens if the caller routed something here
    // that wasn't a store payment. Roll the row back so the boost
    // path can pick it up.
    await Payment.updateOne({ _id: payment._id }, { $set: { status: 'pending' } });
    return { applied: false };
  }

  const meta = (payment.metadata || {}) as Record<string, unknown>;
  const storeProductId =
    typeof meta.storeProductId === 'string' ? meta.storeProductId : null;

  if (!storeProductId) {
    console.error(
      '[store/markStorePaid] payment lacks storeProductId',
      payment._id
    );
    return { applied: true, payment };
  }

  const product = await StoreProduct.findById(storeProductId);
  if (!product) {
    console.error(
      '[store/markStorePaid] product gone for payment',
      payment._id,
      storeProductId
    );
    return { applied: true, payment };
  }

  // Idempotent StorePurchase creation — unique index on
  // (userId, productId, paymentId) means a second call is a no-op.
  try {
    await StorePurchase.create({
      userId: payment.userId,
      productId: String(product._id),
      productSlug: product.slug,
      productTitle: product.title,
      paymentId: String(payment._id),
      provider: payment.provider,
      amountPaidMinor: payment.amount,
      currency: payment.currency as StoreCurrency,
      status: 'paid',
      purchasedAt: new Date(),
    });
    await StoreProduct.updateOne(
      { _id: product._id },
      { $inc: { salesCount: 1 } }
    );
  } catch (e: unknown) {
    const err = e as { code?: number; message?: string };
    if (err?.code === 11000) {
      // Duplicate key — race lost, nothing to do.
    } else {
      console.error('[store/markStorePaid] mint purchase failed:', e);
    }
  }

  const minted = await StorePurchase.findOne({ paymentId: String(payment._id) })
    .select('_id')
    .lean();

  return {
    applied: true,
    payment,
    purchaseId: minted ? String(minted._id) : undefined,
  };
}

/** Refund-side transition. Flip purchase to 'refunded', clear access. */
export async function markStoreRefunded(orderId: string): Promise<ReconcileResult> {
  await connectDB();
  const payment = await Payment.findOneAndUpdate(
    { orderId, status: 'success' },
    { $set: { status: 'refunded', refundedAt: new Date() } },
    { new: true }
  );
  if (!payment) return { applied: false };

  await StorePurchase.updateOne(
    { paymentId: String(payment._id) },
    { $set: { status: 'refunded', refundedAt: new Date() } }
  );
  return { applied: true, payment };
}
