import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/lib/db";
import { requireAuth, errorResponse } from "@/app/api/lib/auth";
import { Payment } from "@/app/api/models/Payment";
import { markBoostPaid, markBoostFailed } from "@/app/api/lib/boost-state";
import { getCashfreeClient } from "@/lib/cashfree";

/**
 * GET /api/payments/status?orderId=XXX
 *
 * Frontend polls this on the /payment/return page. SELF-HEALING:
 * if the row is still 'pending' but Cashfree's Order API reports
 * PAID/FAILED/USER_DROPPED, we apply the same state transition
 * the webhook would have via the shared boost-state helpers.
 *
 * markBoostPaid / markBoostFailed use a `status: "pending"` filter
 * for idempotency, so if the webhook DOES fire later it'll be a
 * no-op rather than a double-apply.
 *
 * The webhook stays the primary path; this is the safety net for
 * when Cashfree's webhook delivery lags or fails.
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

    let payment = await Payment.findOne({ orderId });
    if (!payment) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (payment.userId !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (payment.status === "pending") {
      try {
        const cf = getCashfreeClient();
        const resp = await cf.PGFetchOrder(orderId);
        const data = resp.data as {
          order_status?: string;
        };
        const cfStatus = (data.order_status || "").toUpperCase();

        if (cfStatus === "PAID") {
          console.log("[payment-status] self-heal triggered", {
            orderId,
            productType: payment.productType,
            cfStatus,
          });
          const { applied } = await markBoostPaid(orderId, {
            source: "polling-fallback",
          });
          if (applied) {
            payment = await Payment.findOne({ orderId });
          }
        } else if (cfStatus === "FAILED" || cfStatus === "PAYMENT_FAILED") {
          console.log("[payment-status] self-heal triggered", {
            orderId,
            cfStatus,
            reason: "failed",
          });
          const { applied } = await markBoostFailed(orderId, {
            source: "polling-fallback",
            reason: "failed",
          });
          if (applied) {
            payment = await Payment.findOne({ orderId });
          }
        } else if (
          cfStatus === "USER_DROPPED" ||
          cfStatus === "TERMINATION_REQUESTED" ||
          cfStatus === "EXPIRED"
        ) {
          console.log("[payment-status] self-heal triggered", {
            orderId,
            cfStatus,
            reason: "dropped",
          });
          const { applied } = await markBoostFailed(orderId, {
            source: "polling-fallback",
            reason: "dropped",
          });
          if (applied) {
            payment = await Payment.findOne({ orderId });
          }
        } else if (payment) {
          // Non-terminal CF status (ACTIVE, PARTIALLY_PAID, etc.) —
          // just stash the raw status for visibility; status stays
          // 'pending' for the next poll.
          payment.cashfreeOrderStatus = data.order_status;
          await payment.save();
        }
      } catch (err) {
        // Network blips: keep returning the DB state. Frontend retries.
        console.warn("[payment-status] cf fetch failed", err);
      }
    }

    if (!payment) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
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
      paymentVerifiedVia: payment.paymentVerifiedVia,
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("payments/status error:", err);
    return errorResponse("Failed to read payment status", 500);
  }
}
