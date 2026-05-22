import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/lib/db";
import { requireAdmin, adminErrorResponse } from "@/app/api/lib/admin";
import { errorResponse } from "@/app/api/lib/auth";
import { Subscription } from "@/app/api/models/Subscription";

/**
 * GET /api/admin/subscriptions?status=&page=&limit=
 *
 * Admin-only paginated list.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(req);

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const limit = Math.min(200, Math.max(1, Number(url.searchParams.get("limit") || "50")));
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      Subscription.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("toolId", "name slug logo")
        .lean(),
      Subscription.countDocuments(filter),
    ]);

    return NextResponse.json({
      page,
      limit,
      total,
      items: items.map((s) => ({
        id: String(s._id),
        subscriptionId: s.subscriptionId,
        userId: s.userId,
        toolId: s.toolId,
        amount: s.amount,
        currency: s.currency,
        planId: s.planId,
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
    const adminErr = adminErrorResponse(err);
    if (adminErr) return adminErr;
    console.error("admin/subscriptions list error:", err);
    return errorResponse("Failed to list subscriptions", 500);
  }
}
