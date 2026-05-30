import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/lib/db";
import { requireAdmin, adminErrorResponse } from "@/app/api/lib/admin";
import { errorResponse } from "@/app/api/lib/auth";
import { Payment, type PaymentDocument } from "@/app/api/models/Payment";
import { getCashfreeClient } from "@/lib/cashfree";
import { getOrder as paypalGetOrder, PayPalError } from "@/lib/paypal";
import { markBoostPaid, markBoostFailed } from "@/app/api/lib/boost-state";

/**
 * POST /api/admin/payments/[id]/verify
 *
 * Reconcile a pending Payment row against the provider's real-time
 * order/payment status. Used when the webhook never landed (Cashfree
 * dropped it, PayPal's IPN missed the row, etc.). Routes on the
 * Payment.provider field so Cashfree rows hit Cashfree's
 * PGFetchOrder, PayPal rows hit /v2/checkout/orders/{id}.
 *
 * Status mapping:
 *   Cashfree order_status  → our payment.status
 *     PAID                 → success    (via markBoostPaid)
 *     EXPIRED              → failed     (via markBoostFailed dropped)
 *     TERMINATED / *_REQUESTED → failed (via markBoostFailed failed)
 *     ACTIVE               → still pending, no-op (return current row)
 *   PayPal order status    → our payment.status
 *     COMPLETED / APPROVED → success    (via markBoostPaid)
 *     VOIDED / EXPIRED     → failed
 *     CREATED / SAVED / PAYER_ACTION_REQUIRED → still pending, no-op
 *
 * Idempotent through markBoostPaid/markBoostFailed — both gate on
 * status:"pending", so a verify call against an already-settled row
 * is a no-op that just returns the current state.
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
    if (payment.status !== "pending") {
      return NextResponse.json(
        {
          ok: true,
          changed: false,
          note: `Payment already in terminal status "${payment.status}". Nothing to verify.`,
          payment: serialize(payment),
        },
      );
    }

    const provider = payment.provider || "cashfree";

    if (provider === "cashfree") {
      return await verifyCashfree(payment);
    }
    if (provider === "paypal") {
      return await verifyPaypal(payment);
    }
    return NextResponse.json(
      { error: `Unknown provider "${provider}"` },
      { status: 400 },
    );
  } catch (err) {
    const adminErr = adminErrorResponse(err);
    if (adminErr) return adminErr;
    console.error("admin/payments verify error:", err);
    return errorResponse("Failed to verify payment", 500);
  }
}

async function verifyCashfree(payment: PaymentDocument) {
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
  let order;
  try {
    const r = await cf.PGFetchOrder(payment.orderId);
    order = r.data;
  } catch (cfErr) {
    console.error(
      "[admin/payments/verify] cashfree PGFetchOrder failed",
      payment.orderId,
      cfErr,
    );
    return errorResponse(
      `Cashfree order lookup failed: ${
        cfErr instanceof Error ? cfErr.message : "unknown error"
      }`,
      502,
    );
  }
  const orderStatus = (order?.order_status || "").toUpperCase();

  if (orderStatus === "PAID") {
    // Try to read a successful payment for the cf_payment_id.
    let cfPaymentId: string | undefined;
    try {
      const payments = await cf.PGOrderFetchPayments(payment.orderId);
      const success = (payments.data || []).find(
        (p) => (p.payment_status || "").toUpperCase() === "SUCCESS",
      );
      if (success?.cf_payment_id) cfPaymentId = String(success.cf_payment_id);
    } catch (e) {
      console.warn(
        "[admin/payments/verify] PGOrderFetchPayments errored — continuing without cfPaymentId",
        e,
      );
    }
    const r = await markBoostPaid(payment.orderId, {
      source: "polling-fallback",
      cashfreePaymentId: cfPaymentId,
    });
    const refreshed = r.payment ?? (await Payment.findById(payment._id));
    return NextResponse.json({
      ok: true,
      changed: r.applied,
      providerStatus: orderStatus,
      payment: refreshed ? serialize(refreshed) : null,
    });
  }

  if (
    orderStatus === "EXPIRED" ||
    orderStatus === "TERMINATED" ||
    orderStatus === "TERMINATION_REQUESTED"
  ) {
    const reason = orderStatus === "EXPIRED" ? "dropped" : "failed";
    const r = await markBoostFailed(payment.orderId, {
      source: "polling-fallback",
      reason,
    });
    const refreshed = r.payment ?? (await Payment.findById(payment._id));
    return NextResponse.json({
      ok: true,
      changed: r.applied,
      providerStatus: orderStatus,
      payment: refreshed ? serialize(refreshed) : null,
    });
  }

  // ACTIVE or any other non-terminal value — leave pending.
  payment.cashfreeOrderStatus = orderStatus || payment.cashfreeOrderStatus;
  await payment.save();
  return NextResponse.json({
    ok: true,
    changed: false,
    providerStatus: orderStatus,
    note: "Cashfree reports no terminal status yet. Row remains pending.",
    payment: serialize(payment),
  });
}

async function verifyPaypal(payment: PaymentDocument) {
  const orderId = payment.paypalOrderId || payment.orderId;
  if (!orderId) {
    return errorResponse(
      "PayPal payment row has no orderId to look up",
      400,
    );
  }
  let order;
  try {
    order = await paypalGetOrder(orderId);
  } catch (ppErr) {
    if (ppErr instanceof PayPalError) {
      console.error(
        "[admin/payments/verify] paypal getOrder failed",
        orderId,
        { httpStatus: ppErr.httpStatus, code: ppErr.paypalCode, msg: ppErr.message },
      );
      return errorResponse(`PayPal order lookup failed: ${ppErr.message}`, 502);
    }
    throw ppErr;
  }
  const status = (order?.status || "").toUpperCase();

  if (status === "COMPLETED" || status === "APPROVED") {
    // Pull the capture id if PayPal already captured the order so a
    // future refund has something to call against.
    const captureId = extractCaptureId(order);
    if (captureId && !payment.paypalCaptureId) {
      payment.paypalCaptureId = captureId;
      await payment.save();
    }
    const r = await markBoostPaid(payment.orderId, {
      source: "polling-fallback",
    });
    const refreshed = r.payment ?? (await Payment.findById(payment._id));
    return NextResponse.json({
      ok: true,
      changed: r.applied,
      providerStatus: status,
      payment: refreshed ? serialize(refreshed) : null,
    });
  }

  if (status === "VOIDED" || status === "EXPIRED") {
    const r = await markBoostFailed(payment.orderId, {
      source: "polling-fallback",
      reason: status === "EXPIRED" ? "dropped" : "failed",
    });
    const refreshed = r.payment ?? (await Payment.findById(payment._id));
    return NextResponse.json({
      ok: true,
      changed: r.applied,
      providerStatus: status,
      payment: refreshed ? serialize(refreshed) : null,
    });
  }

  return NextResponse.json({
    ok: true,
    changed: false,
    providerStatus: status,
    note: "PayPal reports no terminal status yet. Row remains pending.",
    payment: serialize(payment),
  });
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

function serialize(p: PaymentDocument) {
  return {
    id: String(p._id),
    orderId: p.orderId,
    provider: p.provider,
    status: p.status,
    amount: p.amount,
    currency: p.currency,
    cashfreeOrderStatus: p.cashfreeOrderStatus,
    cashfreePaymentId: p.cashfreePaymentId,
    paypalOrderId: p.paypalOrderId,
    paypalCaptureId: p.paypalCaptureId,
    paidAt: p.paidAt,
    refundedAt: p.refundedAt,
    manuallyMarkedAt: p.manuallyMarkedAt,
    manuallyMarkedBy: p.manuallyMarkedBy,
  };
}
