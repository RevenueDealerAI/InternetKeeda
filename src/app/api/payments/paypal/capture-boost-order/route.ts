import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/app/api/lib/db";
import { errorResponse } from "@/app/api/lib/auth";
import { requireUser } from "@/lib/auth/user";
import { Payment } from "@/app/api/models/Payment";
import { markBoostPaid, markBoostFailed } from "@/app/api/lib/boost-state";
import { captureOrder, PayPalError } from "@/lib/paypal";

const bodySchema = z.object({
  orderId: z.string().min(1, "orderId is required"),
});

/**
 * POST /api/payments/paypal/capture-boost-order
 *
 * Called by /payment/return when the buyer is bounced back from
 * PayPal with `?provider=paypal&token=<orderId>`. We POST PayPal's
 * /v2/checkout/orders/{id}/capture; on COMPLETED status we run the
 * shared markBoostPaid reconciler (same one the webhook calls) so
 * the boost is applied + affiliate commission recorded exactly once.
 *
 * The route is idempotent: capturing an already-captured order
 * returns the existing payment row without re-running side effects
 * (markBoostPaid's pending-status filter makes the second call a
 * no-op).
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const auth = await requireUser();
    if (auth.kind !== "ok") {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    const { orderId } = bodySchema.parse(await req.json());

    let payment = await Payment.findOne({ orderId });
    if (!payment) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }
    if (payment.userId !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }
    if (payment.provider !== "paypal") {
      return NextResponse.json(
        { error: "Not a PayPal order" },
        { status: 400 },
      );
    }

    // Already terminal — nothing more for the capture endpoint to do.
    if (payment.status !== "pending") {
      return NextResponse.json({
        orderId: payment.orderId,
        status: payment.status,
        paymentVerifiedVia: payment.paymentVerifiedVia,
      });
    }

    try {
      const captured = await captureOrder(orderId);
      const captureId = captured.purchase_units?.[0]?.payments?.captures?.[0]?.id;

      if (captured.status === "COMPLETED") {
        const { applied } = await markBoostPaid(orderId, {
          source: "polling-fallback",
          cashfreePaymentId: captureId,
        });
        if (applied && captureId) {
          await Payment.findOneAndUpdate(
            { orderId },
            {
              $set: {
                paypalCaptureId: captureId,
                "metadata.captureResponse": captured as unknown as Record<string, unknown>,
              },
            },
          );
        }
        payment = (await Payment.findOne({ orderId })) ?? payment;
      } else {
        // PayPal returned non-COMPLETED (DECLINED, PAYER_ACTION_REQUIRED, etc.)
        // Mark as failed so the user sees a clear terminal state.
        await markBoostFailed(orderId, {
          source: "polling-fallback",
          reason: "failed",
        });
        payment = (await Payment.findOne({ orderId })) ?? payment;
      }
    } catch (err) {
      if (err instanceof PayPalError) {
        console.error("[paypal-capture] paypal error:", {
          httpStatus: err.httpStatus,
          paypalCode: err.paypalCode,
          message: err.message,
        });
        // If PayPal says "ORDER_ALREADY_CAPTURED", treat it as success
        // and let the webhook / status route reconcile — don't surface
        // a 502 to the user.
        if (err.paypalCode === "ORDER_ALREADY_CAPTURED") {
          payment = (await Payment.findOne({ orderId })) ?? payment;
        } else {
          return errorResponse(`PayPal capture failed: ${err.message}`, 502);
        }
      } else {
        throw err;
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
      paymentVerifiedVia: payment.paymentVerifiedVia,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 400 },
      );
    }
    console.error("paypal/capture-boost-order error:", err);
    return errorResponse("Failed to capture PayPal order", 500);
  }
}
