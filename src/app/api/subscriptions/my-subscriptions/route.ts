import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/lib/db";
import { requireAuth, errorResponse } from "@/app/api/lib/auth";
import { Subscription } from "@/app/api/models/Subscription";

/**
 * GET /api/subscriptions/my-subscriptions
 *
 * Lists the signed-in user's subscriptions for the dashboard. Tools
 * are populated so the UI can show the listing name + slug.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = await requireAuth(req);

    const subs = await Subscription.find({ userId: auth.userId })
      .sort({ createdAt: -1 })
      .populate("toolId", "name slug logo")
      .lean();

    return NextResponse.json({
      subscriptions: subs.map((s) => ({
        id: String(s._id),
        subscriptionId: s.subscriptionId,
        toolId: s.toolId,
        planId: s.planId,
        amount: s.amount,
        currency: s.currency,
        status: s.status,
        billingCycle: s.billingCycle,
        nextBillingDate: s.nextBillingDate,
        currentPeriodEnd: s.currentPeriodEnd,
        authorizationStatus: s.authorizationStatus,
        failedRenewalCount: s.failedRenewalCount,
        cancelledAt: s.cancelledAt,
        createdAt: s.createdAt,
      })),
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("subscriptions/my-subscriptions error:", err);
    return errorResponse("Failed to fetch subscriptions", 500);
  }
}
