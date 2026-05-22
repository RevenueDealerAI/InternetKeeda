import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/lib/db";
import { requireAuth, errorResponse } from "@/app/api/lib/auth";
import { Subscription } from "@/app/api/models/Subscription";
import { getCashfreeClient } from "@/lib/cashfree";

/**
 * GET /api/subscriptions/status?subscriptionId=XXX
 *
 * Polled by /subscription/return until the row hits a terminal status.
 * Pokes Cashfree directly if the row is still 'initialized' — webhooks
 * can lag and a user sitting on the return page wants fast feedback.
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

    const sub = await Subscription.findOne({ subscriptionId: subId });
    if (!sub) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }
    if (sub.userId !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (sub.status === "initialized") {
      try {
        const cf = getCashfreeClient();
        const resp = await cf.SubsFetchSubscription(subId);
        const data = resp.data as {
          subscription_status?: string;
          authorization_status?: string;
        };
        if (data.authorization_status) sub.authorizationStatus = data.authorization_status;
        // Stash CF's view, but never flip to 'active' here without the
        // signed webhook — that's the authoritative source.
        sub.metadata = {
          ...(sub.metadata || {}),
          lastFetch: { at: new Date().toISOString(), data },
        };
        await sub.save();
      } catch {
        // ignore — return DB state, client retries
      }
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
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("subscriptions/status error:", err);
    return errorResponse("Failed to read subscription status", 500);
  }
}
