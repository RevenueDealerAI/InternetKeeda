import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/lib/db";
import { Subscription } from "@/app/api/models/Subscription";
import { Payment } from "@/app/api/models/Payment";
import {
  markSubscriptionActive,
} from "@/app/api/lib/subscription-state";
import {
  markBoostPaid,
  markBoostFailed,
  markBoostRefunded,
} from "@/app/api/lib/boost-state";
import { verifyWebhookSignature, PayPalError } from "@/lib/paypal";

/**
 * POST /api/webhooks/paypal
 *
 * Signature verification: calls /v1/notifications/verify-webhook-
 * signature with PAYPAL_WEBHOOK_ID + the 5 transmission headers + the
 * parsed event body. Any non-SUCCESS verification rejects with 401.
 *
 * Event handling: BILLING.SUBSCRIPTION.* flips the matching Mongo
 * Subscription doc through the shared markSubscriptionActive
 * reconciler (so the polling self-heal can't double-apply). Boost
 * orders dispatch through markBoostPaid / markBoostFailed /
 * markBoostRefunded.
 *
 * Always returns 200 so PayPal doesn't enter exponential retry
 * spirals; any reconciliation failure is logged and picked up by
 * the polling self-heal on the next /payment/return or
 * /subscription/return load.
 */
export async function POST(req: NextRequest) {
  let parsedBody: Record<string, unknown> | null = null;
  try {
    const rawBody = await req.text();
    try {
      parsedBody = JSON.parse(rawBody);
    } catch {
      console.warn("[paypal-webhook] non-JSON body received");
      return NextResponse.json({ ok: true }, { status: 200 });
    }

    const authAlgo = req.headers.get("paypal-auth-algo");
    const certUrl = req.headers.get("paypal-cert-url");
    const transmissionId = req.headers.get("paypal-transmission-id");
    const transmissionSig = req.headers.get("paypal-transmission-sig");
    const transmissionTime = req.headers.get("paypal-transmission-time");

    if (
      !authAlgo ||
      !certUrl ||
      !transmissionId ||
      !transmissionSig ||
      !transmissionTime
    ) {
      console.warn("[paypal-webhook] missing transmission headers", {
        hasAuthAlgo: !!authAlgo,
        hasCertUrl: !!certUrl,
        hasTransmissionId: !!transmissionId,
        hasTransmissionSig: !!transmissionSig,
        hasTransmissionTime: !!transmissionTime,
      });
      return NextResponse.json({ error: "Missing headers" }, { status: 401 });
    }

    try {
      const ok = await verifyWebhookSignature({
        authAlgo,
        certUrl,
        transmissionId,
        transmissionSig,
        transmissionTime,
        webhookEvent: parsedBody,
      });
      if (!ok) {
        console.warn("[paypal-webhook] signature verification failed", {
          transmissionId,
          eventType: parsedBody?.event_type,
        });
        return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
      }
    } catch (err) {
      if (err instanceof PayPalError) {
        console.error("[paypal-webhook] verify call failed", {
          httpStatus: err.httpStatus,
          paypalCode: err.paypalCode,
          message: err.message,
        });
      } else {
        console.error("[paypal-webhook] verify call failed", err);
      }
      // Don't 200 here — we couldn't actually verify, so refuse the event.
      return NextResponse.json({ error: "Verify failed" }, { status: 401 });
    }

    await connectDB();
    await dispatch(parsedBody);

    return NextResponse.json({ ok: true });
  } catch (err) {
    console.error("[paypal-webhook] handler error", err, {
      eventType: parsedBody?.event_type,
    });
    // Always 200 — the polling self-heal will reconcile what the
    // webhook missed. Retries from PayPal aren't useful here.
    return NextResponse.json({ ok: true });
  }
}

type WebhookEvent = {
  event_type?: string;
  resource?: Record<string, unknown>;
};

async function dispatch(evt: Record<string, unknown> | null): Promise<void> {
  if (!evt) return;
  const event = evt as WebhookEvent;
  const eventType = event.event_type;
  const resource = (event.resource || {}) as Record<string, unknown>;

  switch (eventType) {
    case "BILLING.SUBSCRIPTION.ACTIVATED": {
      const subId = String(resource.id || "");
      if (!subId) return;
      const billingInfo = resource.billing_info as
        | { next_billing_time?: string }
        | undefined;
      const { applied } = await markSubscriptionActive(subId, {
        source: "webhook",
        authorizationStatus: "ACTIVE",
        nextChargeDate: billingInfo?.next_billing_time,
      });
      console.log("[paypal-webhook] subscription activated", { subId, applied });
      return;
    }

    case "BILLING.SUBSCRIPTION.CANCELLED": {
      const subId = String(resource.id || "");
      if (!subId) return;
      await Subscription.findOneAndUpdate(
        {
          subscriptionId: subId,
          status: { $in: ["initialized", "active", "paused"] },
        },
        { $set: { status: "cancelled", cancelledAt: new Date() } },
      );
      console.log("[paypal-webhook] subscription cancelled", { subId });
      return;
    }

    case "BILLING.SUBSCRIPTION.EXPIRED": {
      const subId = String(resource.id || "");
      if (!subId) return;
      await Subscription.findOneAndUpdate(
        {
          subscriptionId: subId,
          status: { $in: ["initialized", "active", "paused"] },
        },
        {
          $set: {
            status: "cancelled",
            cancelledAt: new Date(),
            "metadata.cancelReason": "expired",
          },
        },
      );
      console.log("[paypal-webhook] subscription expired", { subId });
      return;
    }

    case "BILLING.SUBSCRIPTION.PAYMENT.FAILED": {
      // PayPal retries automatically up to payment_failure_threshold
      // (3 per plan config). We just bump the counter so admin can
      // see how many failed in a row without changing the status —
      // PayPal's own EXPIRED event handles the eventual terminal.
      const subId = String(resource.id || "");
      if (!subId) return;
      await Subscription.findOneAndUpdate(
        { subscriptionId: subId },
        { $inc: { failedRenewalCount: 1 } },
      );
      console.log("[paypal-webhook] subscription payment failed", { subId });
      return;
    }

    case "PAYMENT.SALE.COMPLETED": {
      // Subscription renewal payment. Sub stays active — log only.
      const billingAgreementId = String(resource.billing_agreement_id || "");
      console.log("[paypal-webhook] sub renewal payment", { billingAgreementId });
      return;
    }

    case "PAYMENT.CAPTURE.COMPLETED": {
      // One-time boost capture confirmed. PayPal's resource.id is the
      // capture id; the parent order id is at
      // resource.supplementary_data.related_ids.order_id.
      const captureId = String(resource.id || "");
      const supp = resource.supplementary_data as
        | { related_ids?: { order_id?: string } }
        | undefined;
      const orderId = supp?.related_ids?.order_id;
      if (!orderId) {
        // Fall back to looking up by custom_id (we set it to the Mongo
        // Payment _id on create).
        const customId = String(resource.custom_id || "");
        if (!customId) {
          console.warn("[paypal-webhook] capture completed with no orderId/customId");
          return;
        }
        const byCustom = await Payment.findById(customId);
        if (!byCustom) return;
        const { applied } = await markBoostPaid(byCustom.orderId, {
          source: "webhook",
          cashfreePaymentId: captureId,
        });
        if (applied) {
          await Payment.findOneAndUpdate(
            { orderId: byCustom.orderId },
            { $set: { paypalCaptureId: captureId } },
          );
        }
        console.log("[paypal-webhook] boost capture completed (via customId)", {
          orderId: byCustom.orderId,
          captureId,
          applied,
        });
        return;
      }

      const { applied } = await markBoostPaid(orderId, {
        source: "webhook",
        cashfreePaymentId: captureId,
      });
      if (applied && captureId) {
        await Payment.findOneAndUpdate(
          { orderId },
          { $set: { paypalCaptureId: captureId } },
        );
      }
      console.log("[paypal-webhook] boost capture completed", {
        orderId,
        captureId,
        applied,
      });
      return;
    }

    case "PAYMENT.CAPTURE.DENIED": {
      const supp = resource.supplementary_data as
        | { related_ids?: { order_id?: string } }
        | undefined;
      const orderId = supp?.related_ids?.order_id;
      if (!orderId) return;
      const { applied } = await markBoostFailed(orderId, {
        source: "webhook",
        reason: "failed",
      });
      console.log("[paypal-webhook] capture denied", { orderId, applied });
      return;
    }

    case "PAYMENT.CAPTURE.REFUNDED": {
      const supp = resource.supplementary_data as
        | { related_ids?: { order_id?: string } }
        | undefined;
      const orderId = supp?.related_ids?.order_id;
      if (!orderId) return;
      const { applied } = await markBoostRefunded(orderId);
      console.log("[paypal-webhook] capture refunded", { orderId, applied });
      return;
    }

    default:
      console.log("[paypal-webhook] unhandled event", { eventType });
      return;
  }
}
