/**
 * Single source of truth for boost-payment state transitions.
 *
 * Both the cashfree-pg webhook AND the polling-fallback at
 * /api/payments/status call into these helpers. The `markBoostPaid`
 * and `markBoostFailed` functions use a Mongo findOneAndUpdate
 * with a `status: "pending"` filter for idempotency — whichever
 * path wins the race transitions the row; the other gets back
 * `{ applied: false }` and no-ops.
 *
 * If you find yourself writing payment.status = "success" or
 * applyBoostToTool inline somewhere else, route it through here
 * instead. The webhook used to duplicate this logic; that's why
 * polling-fallback existed as a no-op despite Cashfree confirming
 * PAID — there was no shared idempotent reconciler.
 */

import { Payment, type PaymentDocument } from "@/app/api/models/Payment";
import { Tool } from "@/app/api/models/Tool";
import { User } from "@/app/api/models/User";
import { AffiliateProfile } from "@/app/api/models/AffiliateProfile";
import { Commission } from "@/app/api/models/Commission";
import { boostSlotFor, type BoostProductType } from "@/lib/cashfree";

export type ReconcileSource = "webhook" | "polling-fallback";

interface MarkPaidOpts {
  source: ReconcileSource;
  cashfreePaymentId?: string;
}

interface MarkFailedOpts {
  source: ReconcileSource;
  reason: "failed" | "dropped";
}

interface ReconcileResult {
  applied: boolean;
  payment?: PaymentDocument;
}

/**
 * Idempotent PAID transition. Only one caller per orderId ever
 * gets applied:true (Mongo's findOneAndUpdate with status:"pending"
 * filter is atomic). The boost + affiliate commission side effects
 * only run for the winner.
 */
export async function markBoostPaid(
  orderId: string,
  opts: MarkPaidOpts,
): Promise<ReconcileResult> {
  const setFields: Record<string, unknown> = {
    status: "success",
    paidAt: new Date(),
    cashfreeOrderStatus: "PAID",
    paymentVerifiedVia: opts.source,
  };
  if (opts.cashfreePaymentId) {
    setFields.cashfreePaymentId = opts.cashfreePaymentId;
  }

  const payment = await Payment.findOneAndUpdate(
    { orderId, status: "pending" },
    { $set: setFields },
    { new: true },
  );

  if (!payment) {
    return { applied: false };
  }

  // Side effects only run for the winner. Catching individually so
  // a failure in commission doesn't roll back the boost.
  try {
    await applyBoostToTool(payment);
  } catch (err) {
    console.error("[boost-state] applyBoostToTool failed:", err);
  }
  try {
    await recordAffiliateCommissionForBoost(payment);
  } catch (err) {
    console.error("[boost-state] recordAffiliateCommissionForBoost failed:", err);
  }

  return { applied: true, payment };
}

/**
 * Idempotent failure transition. Same filter as markBoostPaid so
 * the two paths can't fight over a row.
 */
export async function markBoostFailed(
  orderId: string,
  opts: MarkFailedOpts,
): Promise<ReconcileResult> {
  const payment = await Payment.findOneAndUpdate(
    { orderId, status: "pending" },
    {
      $set: {
        status: opts.reason,
        cashfreeOrderStatus: opts.reason === "failed" ? "FAILED" : "USER_DROPPED",
        paymentVerifiedVia: opts.source,
      },
    },
    { new: true },
  );
  return { applied: !!payment, payment: payment ?? undefined };
}

/**
 * Refund handling — called by the webhook when REFUND_SUCCESS lands.
 * Idempotent on status:"success" so we don't double-refund.
 */
export async function markBoostRefunded(orderId: string): Promise<ReconcileResult> {
  const payment = await Payment.findOneAndUpdate(
    { orderId, status: "success" },
    { $set: { status: "refunded", refundedAt: new Date() } },
    { new: true },
  );
  if (!payment) return { applied: false };
  try {
    await removeBoostFromTool(payment);
  } catch (err) {
    console.error("[boost-state] removeBoostFromTool failed:", err);
  }
  return { applied: true, payment };
}

export async function applyBoostToTool(payment: {
  toolId: unknown;
  productType: BoostProductType;
  boostDurationDays: number;
}): Promise<void> {
  const slot = boostSlotFor(payment.productType);
  const expiresAt = new Date(
    Date.now() + payment.boostDurationDays * 24 * 60 * 60 * 1000,
  );
  await Tool.findByIdAndUpdate(payment.toolId, {
    $addToSet: { activeBoosts: slot },
    $set: { [`boostExpiresAt.${slot}`]: expiresAt },
  });
}

export async function removeBoostFromTool(payment: {
  toolId: unknown;
  productType: BoostProductType;
}): Promise<void> {
  const slot = boostSlotFor(payment.productType);
  await Tool.findByIdAndUpdate(payment.toolId, {
    $pull: { activeBoosts: slot },
    $unset: { [`boostExpiresAt.${slot}`]: "" },
  });
}

export async function recordAffiliateCommissionForBoost(payment: {
  userId: string;
  amount: number;
  orderId: string;
}): Promise<void> {
  const user = await User.findOne({ clerkId: payment.userId });
  if (!user?.referredBy) return;

  const affiliate = await AffiliateProfile.findOne({
    uniqueCode: user.referredBy,
  });
  if (
    !affiliate ||
    affiliate.status !== "active" ||
    affiliate.userId === payment.userId
  ) {
    return;
  }

  // Default boost commission: 10%. Hardcoded so an AffiliateSettings
  // change that was meant for subscriptions doesn't accidentally
  // change boost economics.
  const BOOST_COMMISSION_RATE = 0.1;
  const commissionAmount = Math.round(payment.amount * BOOST_COMMISSION_RATE);
  if (commissionAmount <= 0) return;

  await Commission.create({
    affiliateId: affiliate.userId,
    referredUserId: payment.userId,
    amount: commissionAmount,
    status: "pending",
    type: "boost",
    sourceId: payment.orderId,
  });

  affiliate.unpaidBalance += commissionAmount;
  affiliate.totalEarnings += commissionAmount;
  await affiliate.save();
}
