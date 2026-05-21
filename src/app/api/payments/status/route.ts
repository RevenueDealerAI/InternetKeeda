import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/lib/db";
import { requireAuth, errorResponse } from "@/app/api/lib/auth";
import { Payment } from "@/app/api/models/Payment";
import { getCashfreeClient } from "@/lib/cashfree";

/**
 * GET /api/payments/status?orderId=XXX
 *
 * Frontend polls this on the /payment/return page. Returns the
 * Payment row's current status. If the row is still 'pending' we
 * also poke Cashfree directly — webhooks can lag, and a user
 * sitting on the return page expects fast feedback.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = await requireAuth(req);

    const orderId = new URL(req.url).searchParams.get("orderId");
    if (!orderId) {
      return NextResponse.json(
        { error: "orderId is required" },
        { status: 400 },
      );
    }

    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (payment.userId !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // If we're still waiting, ask Cashfree directly. The webhook will
    // also fire and idempotently match this update.
    if (payment.status === "pending") {
      try {
        const cf = getCashfreeClient();
        const resp = await cf.PGFetchOrder(orderId);
        const data = resp.data as {
          order_status?: string;
        };
        payment.cashfreeOrderStatus = data.order_status;
        // We deliberately don't flip status to 'success' here without
        // the signed webhook — order_status PAID is suggestive but the
        // webhook is the source of truth.
        await payment.save();
      } catch {
        // Network blips: keep returning the DB state. Frontend retries.
      }
    }

    return NextResponse.json({
      orderId: payment.orderId,
      status: payment.status,
      productType: payment.productType,
      amount: payment.amount,
      currency: payment.currency,
      boostDurationDays: payment.boostDurationDays,
      paidAt: payment.paidAt,
      cashfreeOrderStatus: payment.cashfreeOrderStatus,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("payments/status error:", err);
    return errorResponse("Failed to read payment status", 500);
  }
}
