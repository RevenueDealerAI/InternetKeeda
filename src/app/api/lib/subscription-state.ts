/**
 * Single source of truth for subscription state transitions.
 *
 * Both the cashfree-subscriptions webhook AND the polling-fallback
 * at /api/subscriptions/status call into `markSubscriptionActive`.
 * Idempotency is enforced by a status-filtered findOneAndUpdate —
 * whichever path wins transitions the row; the other no-ops.
 *
 * The legacy markActive() inline helper inside the webhook handler
 * is replaced by this shared function so we have one definition.
 */

import { Subscription, type SubscriptionDocument } from "@/app/api/models/Subscription";
import { Tool } from "@/app/api/models/Tool";

export type ReconcileSource = "webhook" | "polling-fallback";

interface MarkActiveOpts {
  source: ReconcileSource;
  authorizationStatus?: string;
  nextChargeDate?: string;
}

interface ReconcileResult {
  applied: boolean;
  sub?: SubscriptionDocument;
}

/**
 * Idempotent "this subscription is now active" transition. Filter
 * accepts initialized / paused / failed → active so out-of-order
 * events or recovery from a transient failure all collapse to the
 * same code path. An already-active sub returns { applied: false }
 * and no side effects re-run.
 *
 * On success: also flips Tool.listingStatus = 'paid-active' so the
 * tool becomes publicly visible.
 */
export async function markSubscriptionActive(
  subscriptionId: string,
  opts: MarkActiveOpts,
): Promise<ReconcileResult> {
  const setFields: Record<string, unknown> = {
    status: "active",
    failedRenewalCount: 0,
    activationVerifiedVia: opts.source,
  };
  if (opts.authorizationStatus) {
    setFields.authorizationStatus = opts.authorizationStatus;
  }
  if (opts.nextChargeDate) {
    const next = new Date(opts.nextChargeDate);
    setFields.nextBillingDate = next;
    setFields.currentPeriodStart = new Date();
    setFields.currentPeriodEnd = next;
  }

  const sub = await Subscription.findOneAndUpdate(
    {
      subscriptionId,
      status: { $in: ["initialized", "paused", "failed"] },
    },
    { $set: setFields },
    { new: true },
  );

  if (!sub) {
    return { applied: false };
  }

  try {
    await Tool.findByIdAndUpdate(sub.toolId, {
      $set: { listingStatus: "paid-active" },
    });
  } catch (err) {
    console.error("[subscription-state] flip tool listingStatus failed:", err);
  }

  return { applied: true, sub };
}
