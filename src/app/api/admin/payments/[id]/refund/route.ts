import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/lib/db";
import { requireAdmin, adminErrorResponse } from "@/app/api/lib/admin";
import { errorResponse } from "@/app/api/lib/auth";
import { Payment, type PaymentDocument } from "@/app/api/models/Payment";
import { getCashfreeClient } from "@/lib/cashfree";
import {
  captureOrder as paypalCaptureOrder,
  refundCapture as paypalRefundCapture,
  PayPalError,
} from "@/lib/paypal";

/**
 * POST /api/admin/payments/[id]/refund
 *
 * Issues a full refund through whichever provider holds the order.
 * Routes on Payment.provider:
 *   - cashfree → cf.PGOrderCreateRefund(orderId, ...)
 *   - paypal   → /v2/payments/captures/{captureId}/refund
 *
 * Idempotency: refuses (409) any row whose refundStatus is SUCCESS
 * or PENDING — the admin sees the existing refund-status badge in
 * the UI instead of a fresh Refund button. The provider call itself
 * also carries an idempotency key (Cashfree refund_id, PayPal
 * PayPal-Request-Id) so a network retry within this handler doesn't
 * double-issue.
 *
 * Cashfree path: status flip to "refunded" still happens via the
 * REFUND_SUCCESS webhook (now also handled by /api/webhooks/
 * cashfree-refunds). We store the synchronous response's
 * refund_status here so the UI reflects PENDING/ONHOLD immediately;
 * the webhook flips it to SUCCESS + payment.status to "refunded"
 * once Cashfree settles.
 *
 * PayPal path: the v2 refund endpoint returns PENDING / COMPLETED
 * synchronously. COMPLETED maps to refundStatus = SUCCESS + payment.
 * status = "refunded" + removeBoostFromTool. PENDING waits — no
 * PayPal refund webhook is wired here yet, but the row stays
 * accurate (admin sees "Refund pending" and won't try again).
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
    if (
      payment.refundStatus === "SUCCESS" ||
      payment.refundStatus === "PENDING"
    ) {
      return NextResponse.json(
        {
          error: `Refund already ${payment.refundStatus.toLowerCase()} for this payment.`,
          refundStatus: payment.refundStatus,
        },
        { status: 409 },
      );
    }

    const provider = payment.provider || "cashfree";
    if (provider === "cashfree") {
      return await refundCashfree(payment);
    }
    if (provider === "paypal") {
      return await refundPaypal(payment);
    }
    return NextResponse.json(
      { error: `Unknown provider "${provider}"` },
      { status: 400 },
    );
  } catch (err) {
    const adminErr = adminErrorResponse(err);
    if (adminErr) return adminErr;
    console.error("admin refund error:", err);
    return errorResponse("Failed to refund", 500);
  }
}

async function refundCashfree(payment: PaymentDocument) {
  let cf;
  try {
    cf = getCashfreeClient();
  } catch (cfInitErr) {
    return errorResponse(
      cfInitErr instanceof Error
        ? `Cashfree client unavailable: ${cfInitErr.message}`
        : "Cashfree client unavailable",
      503,
    );
  }
  // Refund amount is in the same minor units as `amount`. Cashfree's
  // refund_amount expects rupees (not paise) for INR orders. We rely
  // on the existing convention that Cashfree boost rows store paise.
  const refundAmountRupees = Math.round(payment.amount) / 100;
  const refundId = `refund_${payment._id.toString()}_${Date.now()}`;

  try {
    const resp = await cf.PGOrderCreateRefund(payment.orderId, {
      refund_amount: refundAmountRupees,
      refund_id: refundId,
      refund_note: "Admin-initiated refund",
    });
    const data = (resp.data || {}) as {
      cf_refund_id?: number | string;
      refund_status?: string;
      refund_id?: string;
      refund_amount?: number;
    };
    const refundStatus = normalizeRefundStatus(data.refund_status);

    payment.cfRefundId = data.cf_refund_id ? String(data.cf_refund_id) : refundId;
    payment.refundStatus = refundStatus;
    payment.refundAmount = payment.amount;
    payment.metadata = {
      ...(payment.metadata || {}),
      adminRefund: {
        requestedAt: new Date().toISOString(),
        refundId,
        cashfreeResponse: data,
      },
    };
    // Cashfree refund: only flip payment.status when the synchronous
    // response is already SUCCESS. For PENDING/ONHOLD, the webhook
    // does the flip when the refund clears.
    if (refundStatus === "SUCCESS") {
      payment.status = "refunded";
      payment.refundedAt = new Date();
    }
    await payment.save();

    return NextResponse.json({
      ok: true,
      provider: "cashfree",
      refundId,
      refundStatus,
      note:
        refundStatus === "SUCCESS"
          ? "Refund completed."
          : "Refund initiated. Status will update when Cashfree settles.",
    });
  } catch (cfErr) {
    console.error("[admin/payments/refund] cashfree refund failed:", cfErr);
    return errorResponse(
      `Cashfree refund failed: ${
        cfErr instanceof Error ? cfErr.message : "unknown error"
      }`,
      502,
    );
  }
}

async function refundPaypal(payment: PaymentDocument) {
  // PayPal refunds happen against captures, not orders. If we never
  // stored the capture id (e.g. capture happened via webhook before
  // the field was added), fetch the order and pull the capture out
  // before refunding.
  let captureId = payment.paypalCaptureId;
  if (!captureId) {
    try {
      const orderId = payment.paypalOrderId || payment.orderId;
      const captured = await paypalCaptureOrder(orderId);
      captureId = extractCaptureId(captured) || undefined;
      if (captureId) {
        payment.paypalCaptureId = captureId;
        await payment.save();
      }
    } catch (capErr) {
      if (capErr instanceof PayPalError && capErr.paypalCode === "UNPROCESSABLE_ENTITY") {
        // Already captured — try fetching the order to read the
        // existing capture id. Swallow this branch; fall through to
        // the error below if we can't recover.
      } else {
        console.error("[admin/payments/refund] paypal capture lookup failed", capErr);
      }
    }
  }
  if (!captureId) {
    return errorResponse(
      "PayPal capture id missing on this payment; cannot issue refund. Run Verify first to populate it.",
      409,
    );
  }

  const amountValue = (payment.amount / 100).toFixed(2);
  const refundRequestId = `refund_${payment._id.toString()}_${Date.now()}`;

  try {
    const refund = await paypalRefundCapture({
      captureId,
      amountValue,
      currencyCode: payment.currency || "USD",
      noteToPayer: "Refund issued by Internet Keeda admin",
      requestId: refundRequestId,
    });
    const refundStatus =
      refund.status === "COMPLETED"
        ? "SUCCESS"
        : refund.status === "PENDING"
        ? "PENDING"
        : refund.status === "FAILED"
        ? "FAILED"
        : "ONHOLD";

    payment.paypalRefundId = refund.id;
    payment.refundStatus = refundStatus;
    payment.refundAmount = payment.amount;
    payment.metadata = {
      ...(payment.metadata || {}),
      adminRefund: {
        requestedAt: new Date().toISOString(),
        refundRequestId,
        paypalResponse: refund,
      },
    };
    if (refundStatus === "SUCCESS") {
      payment.status = "refunded";
      payment.refundedAt = new Date();
    }
    await payment.save();
    // For PayPal SUCCESS, we drop the boost off the tool here since
    // there's no equivalent of the cashfree refund webhook wired yet.
    if (refundStatus === "SUCCESS") {
      try {
        const { removeBoostFromTool } = await import("@/app/api/lib/boost-state");
        await removeBoostFromTool(payment);
      } catch (e) {
        console.warn(
          "[admin/payments/refund] removeBoostFromTool failed on paypal refund",
          e,
        );
      }
    }

    return NextResponse.json({
      ok: true,
      provider: "paypal",
      refundId: refund.id,
      refundStatus,
      note:
        refundStatus === "SUCCESS"
          ? "Refund completed."
          : refundStatus === "PENDING"
          ? "Refund pending — PayPal will settle shortly."
          : `Refund returned ${refundStatus}.`,
    });
  } catch (ppErr) {
    if (ppErr instanceof PayPalError) {
      console.error("[admin/payments/refund] paypal refund failed", {
        httpStatus: ppErr.httpStatus,
        code: ppErr.paypalCode,
        msg: ppErr.message,
      });
      return errorResponse(`PayPal refund failed: ${ppErr.message}`, 502);
    }
    throw ppErr;
  }
}

function normalizeRefundStatus(
  raw: string | undefined,
): "SUCCESS" | "PENDING" | "ONHOLD" | "FAILED" {
  const up = (raw || "").toUpperCase();
  if (up === "SUCCESS" || up === "PENDING" || up === "ONHOLD" || up === "FAILED") {
    return up;
  }
  // Unknown / not-yet-returned: treat as PENDING so the admin can't
  // re-fire the refund. Real value lands via webhook.
  return "PENDING";
}

function extractCaptureId(order: unknown): string | undefined {
  if (!order || typeof order !== "object") return undefined;
  const o = order as {
    purchase_units?: Array<{
      payments?: { captures?: Array<{ id?: string; status?: string }> };
    }>;
  };
  for (const pu of o.purchase_units ?? []) {
    for (const cap of pu.payments?.captures ?? []) {
      if (cap?.id) return cap.id;
    }
  }
  return undefined;
}
