import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/lib/db";
import { requireAdmin, adminErrorResponse } from "@/app/api/lib/admin";
import { errorResponse } from "@/app/api/lib/auth";
import { Payment } from "@/app/api/models/Payment";
import { Subscription } from "@/app/api/models/Subscription";

/**
 * GET /api/admin/revenue
 *
 * Returns this-month + all-time revenue (paise) and counts of
 * pending/failed/refunded payments. Used by the admin dashboard.
 * Subscription renewal revenue is approximated as the sum of active
 * subscription amounts whose currentPeriodStart falls in this month.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(req);

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const [
      boostThisMonth,
      boostAllTime,
      subThisMonth,
      subActive,
      paymentFailedMonth,
      paymentRefundedMonth,
      paymentPending,
    ] = await Promise.all([
      Payment.aggregate([
        { $match: { status: "success", paidAt: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Payment.aggregate([
        { $match: { status: "success" } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Subscription.aggregate([
        { $match: { status: "active", currentPeriodStart: { $gte: startOfMonth } } },
        { $group: { _id: null, total: { $sum: "$amount" }, count: { $sum: 1 } } },
      ]),
      Subscription.countDocuments({ status: "active" }),
      Payment.countDocuments({ status: "failed", createdAt: { $gte: startOfMonth } }),
      Payment.countDocuments({ status: "refunded", refundedAt: { $gte: startOfMonth } }),
      Payment.countDocuments({
        status: "pending",
        createdAt: { $lt: new Date(Date.now() - 10 * 60 * 1000) },
      }),
    ]);

    const boostMonth = boostThisMonth[0] || { total: 0, count: 0 };
    const boostAll = boostAllTime[0] || { total: 0, count: 0 };
    const subMonth = subThisMonth[0] || { total: 0, count: 0 };

    return NextResponse.json({
      asOf: now.toISOString(),
      thisMonth: {
        boostRevenuePaise: boostMonth.total,
        boostCount: boostMonth.count,
        subscriptionRevenuePaise: subMonth.total,
        subscriptionCount: subMonth.count,
        totalRevenuePaise: boostMonth.total + subMonth.total,
        paymentsFailed: paymentFailedMonth,
        paymentsRefunded: paymentRefundedMonth,
      },
      allTime: {
        boostRevenuePaise: boostAll.total,
        boostCount: boostAll.count,
        activeSubscriptions: subActive,
      },
      stuckPending: paymentPending,
    });
  } catch (err) {
    const adminErr = adminErrorResponse(err);
    if (adminErr) return adminErr;
    console.error("admin/revenue error:", err);
    return errorResponse("Failed to fetch revenue", 500);
  }
}
