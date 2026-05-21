import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/lib/db";
import { requireAdmin, adminErrorResponse } from "@/app/api/lib/admin";
import { errorResponse } from "@/app/api/lib/auth";
import { Payment } from "@/app/api/models/Payment";
import { getCashfreeClient } from "@/lib/cashfree";

/**
 * POST /api/admin/payments/[id]/refund
 *
 * Issues a full refund via Cashfree's PGOrderCreateRefund. We rely on
 * the cashfree-pg webhook (REFUND_SUCCESS_WEBHOOK) to flip the
 * Payment row to 'refunded' and pull the boost off the tool — that
 * keeps the success path single-source-of-truth (webhook) instead of
 * also writing here.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    await requireAdmin(req);
    const { id } = await params;

    const payment = await Payment.findById(id);
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    if (payment.status !== "success") {
      return NextResponse.json(
        {
          error: `Cannot refund payment in status "${payment.status}". Only successful payments can be refunded.`,
        },
        { status: 400 },
      );
    }

    const cf = getCashfreeClient();
    const refundAmountRupees = Math.round(payment.amount) / 100;
    const refundId = `refund_${payment._id.toString()}_${Date.now()}`;

    try {
      const resp = await cf.PGOrderCreateRefund(payment.orderId, {
        refund_amount: refundAmountRupees,
        refund_id: refundId,
        refund_note: "Admin-initiated refund",
      });

      // Stash CF's response for audit. Status flips via webhook.
      payment.metadata = {
        ...(payment.metadata || {}),
        adminRefund: {
          requestedAt: new Date().toISOString(),
          refundId,
          cashfreeResponse: resp.data,
        },
      };
      await payment.save();

      return NextResponse.json({
        ok: true,
        refundId,
        note: "Refund initiated. The webhook will mark the payment refunded and remove the boost once Cashfree confirms.",
      });
    } catch (cfErr) {
      console.error("Cashfree refund failed:", cfErr);
      return errorResponse("Cashfree refund failed", 502);
    }
  } catch (err) {
    const adminErr = adminErrorResponse(err);
    if (adminErr) return adminErr;
    console.error("admin refund error:", err);
    return errorResponse("Failed to refund", 500);
  }
}
