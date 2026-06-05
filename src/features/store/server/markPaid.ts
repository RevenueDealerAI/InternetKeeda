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
import { StoreProduct, type StoreProductDocument } from '../models/StoreProduct';
import {
  StorePurchase,
  type StorePurchaseDocument,
} from '../models/StorePurchase';
import type { StoreCurrency } from '../config';
import { sendDeliveryEmail } from '../lib/mailer';
import { pickAddOnsFromIds } from '../lib/addons';

/** Absolute base URL for links inside transactional emails. Emails
 *  open in foreign inboxes — relative URLs don't survive. */
function getSiteBaseUrl(): string {
  const env =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/+$/, '');
  // Sensible last-resort default — prod canonical. Localhost dev
  // sends emails with this URL too, which is fine for the prod
  // delivery path; the wire-up below only fires in prod-like flows.
  return 'https://internetkeeda.com';
}

/** Best-effort buyer-email lookup via Clerk. Returns nulls on any
 *  failure so the calling reconciler never crashes. The import is
 *  deferred so this module is loadable from raw tsx scripts (the
 *  verify-store-roundtrip script and friends) where Next's bundler
 *  isn't resolving '@clerk/nextjs/server' for us — if the import
 *  fails, we degrade to "no email" rather than crash. */
async function lookupBuyerForEmail(
  clerkUserId: string
): Promise<{ email: string | null; name: string | null }> {
  try {
    const mod = await import('@clerk/nextjs/server');
    const client = await mod.clerkClient();
    const user = await client.users.getUser(clerkUserId);
    const email = user.emailAddresses?.[0]?.emailAddress ?? null;
    const name =
      `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim() || null;
    return { email, name };
  } catch (err) {
    console.warn('[store/markPaid] clerk lookup failed for', clerkUserId, err);
    return { email: null, name: null };
  }
}

/**
 * Fire the delivery email. Wrapped in its own try so any
 * misconfiguration (missing RESEND_API_KEY, DNS not verified, etc.)
 * cannot break the purchase or the buyer's download access.
 */
async function fireDeliveryEmail(
  payment: PaymentDocument,
  product: StoreProductDocument,
  purchase: StorePurchaseDocument | null
): Promise<void> {
  try {
    const { email, name } = await lookupBuyerForEmail(payment.userId);
    if (!email) {
      console.warn(
        '[store/markPaid] no buyer email for', payment.userId,
        '— skipping delivery email (buyer can still re-download)'
      );
      return;
    }
    const result = await sendDeliveryEmail({
      buyerEmail: email,
      buyerName: name ?? undefined,
      productTitle: product.title,
      productSlug: product.slug,
      amountPaidMinor: payment.amount,
      currency: payment.currency as StoreCurrency,
      baseUrl: getSiteBaseUrl(),
      purchaseId: purchase ? String(purchase._id) : undefined,
      addOnIds: purchase?.addOnIds ?? [],
    });
    if (!result.ok) {
      console.warn(
        '[store/markPaid] delivery email did not send',
        { skipped: result.skipped, error: result.error }
      );
    }
  } catch (err) {
    // Defence in depth — sendDeliveryEmail already promises no-throw,
    // but the Clerk lookup or anything else could still throw.
    console.warn('[store/markPaid] delivery email side-effect crashed:', err);
  }
}

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

  // Add-ons recorded at checkout time live in payment.metadata. Re-
  // pick them against the canonical config so a deleted/renamed
  // add-on doesn't leak onto the purchase — same trust boundary as
  // the checkout route.
  const metaAddOnIds = Array.isArray(meta.addOnIds) ? meta.addOnIds : [];
  const addOns = pickAddOnsFromIds(metaAddOnIds);
  const addOnAmountMinor =
    typeof meta.addOnAmountMinor === 'number' ? meta.addOnAmountMinor : 0;
  const needsFollowUp =
    addOns.some((a) => !!a.followUpTag) || meta.needsFollowUp === true;

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
      addOnIds: addOns.map((a) => a.id),
      addOnAmountMinor,
      needsFollowUp,
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

  const minted = await StorePurchase.findOne({ paymentId: String(payment._id) });

  // Best-effort delivery email. Never throws — sendDeliveryEmail
  // already promises no-throw, and the outer wrapper double-guards
  // it. The buyer can always re-download from /store/my-downloads,
  // so a missed email does not block the purchase.
  await fireDeliveryEmail(payment, product, minted);

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
