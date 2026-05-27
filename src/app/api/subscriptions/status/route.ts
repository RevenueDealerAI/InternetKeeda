import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/lib/db";
import { requireAuth, errorResponse } from "@/app/api/lib/auth";
import { Subscription } from "@/app/api/models/Subscription";
import { markSubscriptionActive } from "@/app/api/lib/subscription-state";
import { getCashfreeClient } from "@/lib/cashfree";
import { getSubscription as getPayPalSubscription, PayPalError } from "@/lib/paypal";

/**
 * GET /api/subscriptions/status?subscriptionId=XXX
 *
 * Polled by /subscription/return until the row hits a terminal status.
 * SELF-HEALING: if the row is still 'initialized' but Cashfree's
 * SubsFetchSubscription reports the sub is ACTIVE (or its
 * authorization_status is ACTIVE), apply the same activation
 * transition the webhook would have via the shared
 * markSubscriptionActive helper.
 *
 * Webhook stays the primary path. This is the safety net for when
 * Cashfree's webhook delivery lags or fails — common during
 * sandbox flows where webhook signatures or middleware coverage
 * sometimes mis-fire.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = await requireAuth(req);

    const subId = new URL(req.url).searchParams.get("subscriptionId");
    if (!subId) {
      return NextResponse.json(
        { error: "subscriptionId is required" },
        { status: 400 },
      );
    }

    let sub = await Subscription.findOne({ subscriptionId: subId });
    if (!sub) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }
    if (sub.userId !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (sub.status === "initialized" && sub.provider === "paypal") {
      try {
        const ppSub = await getPayPalSubscription(subId);
        sub.metadata = {
          ...(sub.metadata || {}),
          lastFetch: { at: new Date().toISOString(), data: ppSub as unknown as Record<string, unknown> },
        };
        const isActiveOnPp = ppSub.status === "ACTIVE";
        const isCancelledOnPp =
          ppSub.status === "CANCELLED" || ppSub.status === "EXPIRED";

        if (isActiveOnPp) {
          console.log("[subscription-status] paypal self-heal triggered", {
            subscriptionId: subId,
            ppStatus: ppSub.status,
          });
          const { applied } = await markSubscriptionActive(subId, {
            source: "polling-fallback",
            authorizationStatus: ppSub.status,
            nextChargeDate: ppSub.billing_info?.next_billing_time,
          });
          if (applied) {
            sub = await Subscription.findOne({ subscriptionId: subId });
          }
        } else if (isCancelledOnPp) {
          console.log("[subscription-status] paypal cancellation detected by poll", {
            subscriptionId: subId,
            ppStatus: ppSub.status,
          });
          const cancelled = await Subscription.findOneAndUpdate(
            { subscriptionId: subId, status: { $in: ["initialized", "active", "paused"] } },
            { $set: { status: "cancelled", cancelledAt: new Date() } },
            { new: true },
          );
          if (cancelled) sub = cancelled;
        } else if (sub) {
          sub.authorizationStatus = ppSub.status;
          await sub.save();
        }
      } catch (err) {
        if (err instanceof PayPalError) {
          console.warn("[subscription-status] paypal fetch failed", {
            httpStatus: err.httpStatus,
            paypalCode: err.paypalCode,
            message: err.message,
          });
        } else {
          console.warn("[subscription-status] paypal fetch failed", err);
        }
      }
    } else if (sub.status === "initialized") {
      try {
        const cf = getCashfreeClient();
        const resp = await cf.SubsFetchSubscription(subId);
        const data = resp.data as {
          subscription_status?: string;
          authorization_status?: string;
          next_charge_date?: string;
        };

        // Stash CF's view either way for visibility.
        sub.metadata = {
          ...(sub.metadata || {}),
          lastFetch: { at: new Date().toISOString(), data },
        };

        const subStatus = (data.subscription_status || "").toUpperCase();
        const authStatus = (data.authorization_status || "").toUpperCase();
        const isActiveOnCf = subStatus === "ACTIVE" || authStatus === "ACTIVE";
        const isCancelledOnCf = subStatus === "CANCELLED";

        if (isActiveOnCf) {
          console.log("[subscription-status] self-heal triggered", {
            subscriptionId: subId,
            subscriptionStatus: data.subscription_status,
            authorizationStatus: data.authorization_status,
          });
          const { applied } = await markSubscriptionActive(subId, {
            source: "polling-fallback",
            authorizationStatus: data.authorization_status,
            nextChargeDate: data.next_charge_date,
          });
          if (applied) {
            sub = await Subscription.findOne({ subscriptionId: subId });
          } else if (sub) {
            // Race: another path already flipped it. Re-read.
            sub = await Subscription.findOne({ subscriptionId: subId });
          }
        } else if (isCancelledOnCf) {
          console.log("[subscription-status] cancellation detected by poll", {
            subscriptionId: subId,
          });
          const cancelled = await Subscription.findOneAndUpdate(
            { subscriptionId: subId, status: { $in: ["initialized", "active", "paused"] } },
            { $set: { status: "cancelled", cancelledAt: new Date() } },
            { new: true },
          );
          if (cancelled) sub = cancelled;
        } else if (sub) {
          // Non-terminal CF status — keep polling.
          if (data.authorization_status) {
            sub.authorizationStatus = data.authorization_status;
          }
          await sub.save();
        }
      } catch (err) {
        console.warn("[subscription-status] cf fetch failed", err);
      }
    }

    if (!sub) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    return NextResponse.json({
      subscriptionId: sub.subscriptionId,
      status: sub.status,
      amount: sub.amount,
      currency: sub.currency,
      billingCycle: sub.billingCycle,
      nextBillingDate: sub.nextBillingDate,
      currentPeriodStart: sub.currentPeriodStart,
      currentPeriodEnd: sub.currentPeriodEnd,
      authorizationStatus: sub.authorizationStatus,
      failedRenewalCount: sub.failedRenewalCount,
      activationVerifiedVia: sub.activationVerifiedVia,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("subscriptions/status error:", err);
    return errorResponse("Failed to read subscription status", 500);
  }
}
