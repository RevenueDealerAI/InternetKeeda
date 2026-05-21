import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/lib/db";
import { requireAuth, errorResponse } from "@/app/api/lib/auth";
import { Payment } from "@/app/api/models/Payment";

/**
 * GET /api/payments/my-purchases
 *
 * Returns the authenticated user's boost-purchase history, newest first.
 * Used by the dashboard purchases tab.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = await requireAuth(req);

    const payments = await Payment.find({ userId: auth.userId })
      .sort({ createdAt: -1 })
      .populate("toolId", "name slug logo")
      .lean();

    return NextResponse.json({
      payments: payments.map((p) => ({
        id: String(p._id),
        orderId: p.orderId,
        toolId: p.toolId,
        amount: p.amount,
        currency: p.currency,
        productType: p.productType,
        boostDurationDays: p.boostDurationDays,
        status: p.status,
        paidAt: p.paidAt,
        refundedAt: p.refundedAt,
        createdAt: p.createdAt,
      })),
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("payments/my-purchases error:", err);
    return errorResponse("Failed to fetch purchases", 500);
  }
}
