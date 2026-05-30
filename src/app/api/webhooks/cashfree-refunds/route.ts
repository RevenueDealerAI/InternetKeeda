import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/lib/db";
import { Payment } from "@/app/api/models/Payment";
import { markBoostRefunded } from "@/app/api/lib/boost-state";
import { getCashfreeClient } from "@/lib/cashfree";

/**
 * POST /api/webhooks/cashfree-refunds
 *
 * Dedicated Cashfree refund webhook. Register this URL separately in
 * the Cashfree dashboard under Webhooks → Refund events. The existing
 * cashfree-pg webhook also catches REFUND_SUCCESS/FAILED events for
 * backwards compatibility, but this endpoint is the system of record
 * for refund-status transitions — including the newer
 * REFUND_STATUS_CHANGED event that some Cashfree merchants now
 * receive in place of the legacy *_WEBHOOK variants.
 *
 * Signature verification is identical to cashfree-pg: HMAC via the
 * SDK's PGVerifyWebhookSignature, plus a ±5 min replay window.
 *
 * Status mapping (Cashfree → Payment):
 *   SUCCESS → refundStatus=SUCCESS, status=refunded, removes boost
 *   PENDING / ONHOLD → refundStatus=<same>, leaves status as-is
 *   FAILED  → refundStatus=FAILED, leaves status as-is
 */

type RefundEventType =
  | "REFUND_STATUS_CHANGED"
  | "REFUND_SUCCESS_WEBHOOK"
  | "REFUND_FAILED_WEBHOOK";

const MAX_REPLAY_WINDOW_MS = 5 * 60 * 1000;

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature");
    const timestamp = req.headers.get("x-webhook-timestamp");

    if (!signature || !timestamp) {
      console.warn("[cashfree-refunds] missing signature/timestamp headers");
      return NextResponse.json(
        { error: "Missing webhook headers" },
        { status: 401 },
      );
    }

    const tsMs = Number(timestamp) * 1000;
    if (
      Number.isNaN(tsMs) ||
      Math.abs(Date.now() - tsMs) > MAX_REPLAY_WINDOW_MS
    ) {
      console.warn("[cashfree-refunds] webhook outside replay window", {
        timestamp,
      });
      return NextResponse.json(
        { error: "Webhook timestamp out of range" },
        { status: 401 },
      );
    }

    try {
      const cf = getCashfreeClient();
      cf.PGVerifyWebhookSignature(signature, rawBody, timestamp);
    } catch (verifyErr) {
      console.warn("[cashfree-refunds] signature invalid", verifyErr);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 },
      );
    }

    let parsed: {
      type?: RefundEventType | string;
      data?: {
        order?: { order_id?: string };
        refund?: {
          cf_refund_id?: number | string;
          refund_id?: string;
          refund_status?: string;
          refund_amount?: number;
        };
      };
    };
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const eventType = parsed.type as RefundEventType | undefined;
    const orderId = parsed.data?.order?.order_id;
    const refundInfo = parsed.data?.refund;

    if (!orderId) {
      console.warn("[cashfree-refunds] missing order_id", { eventType });
      return NextResponse.json({ received: true, skipped: "no-order-id" });
    }

    await connectDB();
    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      console.warn("[cashfree-refunds] unknown orderId", orderId);
      return NextResponse.json({ received: true, skipped: "unknown-order" });
    }

    // Persist raw event for audit, same pattern as cashfree-pg webhook.
    const existingEvents = Array.isArray(
      (payment.metadata as Record<string, unknown>)?.events,
    )
      ? ((payment.metadata as Record<string, unknown>).events as unknown[])
      : [];
    payment.metadata = {
      ...(payment.metadata || {}),
      events: [
        ...existingEvents,
        {
          type: eventType,
          source: "cashfree-refunds",
          at: new Date().toISOString(),
          payload: parsed.data,
        },
      ],
    };

    // Normalize the refund status. REFUND_STATUS_CHANGED carries the
    // status in refund.refund_status; the legacy *_WEBHOOK events
    // imply it from the type.
    let refundStatus: "SUCCESS" | "PENDING" | "ONHOLD" | "FAILED" | null = null;
    const raw = (refundInfo?.refund_status || "").toUpperCase();
    if (eventType === "REFUND_SUCCESS_WEBHOOK") refundStatus = "SUCCESS";
    else if (eventType === "REFUND_FAILED_WEBHOOK") refundStatus = "FAILED";
    else if (raw === "SUCCESS" || raw === "PENDING" || raw === "ONHOLD" || raw === "FAILED") {
      refundStatus = raw;
    }

    if (!refundStatus) {
      // Unknown event — log + ack so Cashfree stops retrying.
      await payment.save();
      console.warn("[cashfree-refunds] unhandled event/status", {
        eventType,
        raw,
      });
      return NextResponse.json({ received: true, skipped: "unhandled" });
    }

    payment.refundStatus = refundStatus;
    if (refundInfo?.cf_refund_id && !payment.cfRefundId) {
      payment.cfRefundId = String(refundInfo.cf_refund_id);
    }
    if (refundInfo?.refund_amount && !payment.refundAmount) {
      // refund_amount is rupees on Cashfree's wire; store paise to
      // match our convention.
      payment.refundAmount = Math.round(refundInfo.refund_amount * 100);
    }

    // First persist refund metadata, then run the boost-state
    // reconciler (which gates on status:"success" → "refunded" so
    // re-fire of this event is a no-op).
    await payment.save();

    if (refundStatus === "SUCCESS" && payment.status === "success") {
      const r = await markBoostRefunded(payment.orderId);
      if (r.applied) {
        // Re-read so refundedAt comes from the reconciler.
        const fresh = await Payment.findById(payment._id);
        if (fresh) {
          fresh.refundStatus = "SUCCESS";
          await fresh.save();
        }
      }
    }

    return NextResponse.json({ received: true, refundStatus });
  } catch (err) {
    console.error("[cashfree-refunds] handler crashed:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}
