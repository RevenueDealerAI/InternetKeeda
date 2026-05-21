import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/lib/db";
import { requireAdmin, adminErrorResponse } from "@/app/api/lib/admin";
import { Payment } from "@/app/api/models/Payment";
import { errorResponse } from "@/app/api/lib/auth";

/**
 * GET /api/admin/payments?status=&page=&limit=
 *
 * Admin-only paginated list. Filter by status (pending/success/...).
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(req);

    const url = new URL(req.url);
    const status = url.searchParams.get("status");
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const limit = Math.min(
      200,
      Math.max(1, Number(url.searchParams.get("limit") || "50")),
    );
    const skip = (page - 1) * limit;

    const filter: Record<string, unknown> = {};
    if (status) filter.status = status;

    const [items, total] = await Promise.all([
      Payment.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .populate("toolId", "name slug logo")
        .lean(),
      Payment.countDocuments(filter),
    ]);

    return NextResponse.json({
      page,
      limit,
      total,
      items: items.map((p) => ({
        id: String(p._id),
        orderId: p.orderId,
        userId: p.userId,
        toolId: p.toolId,
        amount: p.amount,
        currency: p.currency,
        productType: p.productType,
        boostDurationDays: p.boostDurationDays,
        status: p.status,
        cashfreePaymentId: p.cashfreePaymentId,
        cashfreeOrderStatus: p.cashfreeOrderStatus,
        paidAt: p.paidAt,
        refundedAt: p.refundedAt,
        createdAt: p.createdAt,
      })),
    });
  } catch (err) {
    const adminErr = adminErrorResponse(err);
    if (adminErr) return adminErr;
    console.error("admin/payments error:", err);
    return errorResponse("Failed to list payments", 500);
  }
}
