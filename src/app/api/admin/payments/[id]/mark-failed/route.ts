import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/lib/db";
import { requireAdmin, adminErrorResponse } from "@/app/api/lib/admin";
import { errorResponse } from "@/app/api/lib/auth";
import { Payment } from "@/app/api/models/Payment";

/**
 * POST /api/admin/payments/[id]/mark-failed
 *
 * Manual override for pending rows when the provider's own
 * order-status API isn't giving a useful answer (e.g. test orders
 * that never came back, abandoned checkouts the gateway never
 * reported on). Sets status='failed' and stamps the admin's
 * userId + timestamp so the row carries who decided to close it.
 *
 * Refuses anything that's already terminal — call /verify first
 * if you want to re-resolve, not this. Refunds for paid rows go
 * through /refund, not here.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const auth = await requireAdmin(req);
    const { id } = await params;

    const payment = await Payment.findById(id);
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    if (payment.status !== "pending") {
      return NextResponse.json(
        {
          error: `Cannot mark-failed a payment in status "${payment.status}". Only pending payments accept this override.`,
        },
        { status: 409 },
      );
    }

    payment.status = "failed";
    payment.manuallyMarkedAt = new Date();
    payment.manuallyMarkedBy = auth.userId;
    payment.metadata = {
      ...(payment.metadata || {}),
      manuallyMarked: {
        at: payment.manuallyMarkedAt.toISOString(),
        by: auth.userId,
        from: "pending",
        to: "failed",
      },
    };
    await payment.save();

    return NextResponse.json({
      ok: true,
      payment: {
        id: String(payment._id),
        status: payment.status,
        manuallyMarkedAt: payment.manuallyMarkedAt,
        manuallyMarkedBy: payment.manuallyMarkedBy,
      },
    });
  } catch (err) {
    const adminErr = adminErrorResponse(err);
    if (adminErr) return adminErr;
    console.error("admin/payments mark-failed error:", err);
    return errorResponse("Failed to mark payment failed", 500);
  }
}
