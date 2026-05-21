import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/lib/db";
import { Payment } from "@/app/api/models/Payment";
import { Tool } from "@/app/api/models/Tool";
import { User } from "@/app/api/models/User";
import { AffiliateProfile } from "@/app/api/models/AffiliateProfile";
import { Commission } from "@/app/api/models/Commission";
import { getCashfreeClient, boostSlotFor, type BoostProductType } from "@/lib/cashfree";

// Cashfree's signed webhook events. Status mapping is deliberately
// narrow — anything outside this set is logged and acked with 200 so
// they don't keep retrying.
type EventType =
  | "PAYMENT_SUCCESS_WEBHOOK"
  | "PAYMENT_FAILED_WEBHOOK"
  | "PAYMENT_USER_DROPPED_WEBHOOK"
  | "REFUND_SUCCESS_WEBHOOK"
  | "REFUND_FAILED_WEBHOOK"
  | "DISPUTE_CREATED_WEBHOOK";

const TERMINAL_STATUSES = new Set(["success", "failed", "refunded"]);

const MAX_REPLAY_WINDOW_MS = 5 * 60 * 1000;

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    // Cashfree sends the raw JSON body and the signature/timestamp
    // in headers. We need the unparsed body for signature verification.
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature");
    const timestamp = req.headers.get("x-webhook-timestamp");

    if (!signature || !timestamp) {
      console.warn("cashfree-pg webhook missing signature/timestamp headers");
      return NextResponse.json(
        { error: "Missing webhook headers" },
        { status: 401 },
      );
    }

    // Replay protection: refuse anything older than 5 min. The header
    // is unix seconds.
    const tsMs = Number(timestamp) * 1000;
    if (
      Number.isNaN(tsMs) ||
      Math.abs(Date.now() - tsMs) > MAX_REPLAY_WINDOW_MS
    ) {
      console.warn("cashfree-pg webhook outside replay window", { timestamp });
      return NextResponse.json(
        { error: "Webhook timestamp out of range" },
        { status: 401 },
      );
    }

    // Verify against Cashfree's secret. The SDK throws on mismatch.
    try {
      const cf = getCashfreeClient();
      cf.PGVerifyWebhookSignature(signature, rawBody, timestamp);
    } catch (verifyErr) {
      console.warn("cashfree-pg webhook signature invalid", verifyErr);
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 },
      );
    }

    let parsed: {
      type?: EventType;
      data?: {
        order?: { order_id?: string; order_amount?: number };
        payment?: {
          cf_payment_id?: number;
          payment_status?: string;
          payment_amount?: number;
        };
        refund?: { refund_amount?: number; refund_status?: string };
      };
    };
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const eventType = parsed.type;
    const orderId = parsed.data?.order?.order_id;

    if (!eventType || !orderId) {
      console.warn("cashfree-pg webhook missing type or order_id", { eventType, orderId });
      // 200 so they don't keep retrying — we still log for ourselves.
      return NextResponse.json({ received: true, skipped: "no-order-id" });
    }

    await connectDB();
    const payment = await Payment.findOne({ orderId });
    if (!payment) {
      console.warn("cashfree-pg webhook for unknown orderId", orderId);
      return NextResponse.json({ received: true, skipped: "unknown-order" });
    }

    // Idempotency: if we've already settled this payment, ack without
    // re-applying. Refund events are allowed through even if the row
    // was previously 'success'.
    const isRefundEvent =
      eventType === "REFUND_SUCCESS_WEBHOOK" ||
      eventType === "REFUND_FAILED_WEBHOOK";
    if (!isRefundEvent && TERMINAL_STATUSES.has(payment.status)) {
      return NextResponse.json({ received: true, skipped: "terminal" });
    }

    // Persist raw event under metadata.events[] for later debugging.
    const existingEvents = Array.isArray(
      (payment.metadata as Record<string, unknown>)?.events,
    )
      ? ((payment.metadata as Record<string, unknown>).events as unknown[])
      : [];
    payment.metadata = {
      ...(payment.metadata || {}),
      events: [
        ...existingEvents,
        { type: eventType, at: new Date().toISOString(), payload: parsed.data },
      ],
    };

    switch (eventType) {
      case "PAYMENT_SUCCESS_WEBHOOK": {
        payment.status = "success";
        payment.paidAt = new Date();
        payment.cashfreePaymentId = parsed.data?.payment?.cf_payment_id
          ? String(parsed.data.payment.cf_payment_id)
          : undefined;
        payment.cashfreeOrderStatus = "PAID";
        await payment.save();
        await applyBoostToTool(payment);
        await recordAffiliateCommission(payment);
        break;
      }
      case "PAYMENT_FAILED_WEBHOOK": {
        payment.status = "failed";
        payment.cashfreeOrderStatus = "FAILED";
        await payment.save();
        break;
      }
      case "PAYMENT_USER_DROPPED_WEBHOOK": {
        payment.status = "dropped";
        payment.cashfreeOrderStatus = "USER_DROPPED";
        await payment.save();
        break;
      }
      case "REFUND_SUCCESS_WEBHOOK": {
        payment.status = "refunded";
        payment.refundedAt = new Date();
        await payment.save();
        await removeBoostFromTool(payment);
        break;
      }
      case "REFUND_FAILED_WEBHOOK": {
        // Log only — keep status as it was. Admin can retry.
        await payment.save();
        break;
      }
      case "DISPUTE_CREATED_WEBHOOK": {
        // Unfeature the tool immediately pending review.
        await payment.save();
        await removeBoostFromTool(payment);
        break;
      }
      default: {
        // Unknown event — log and ack.
        await payment.save();
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("cashfree-pg webhook handler crashed:", err);
    // 500 so CF retries. We don't want to swallow handler bugs.
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

async function applyBoostToTool(payment: {
  toolId: unknown;
  productType: BoostProductType;
  boostDurationDays: number;
}) {
  const slot = boostSlotFor(payment.productType);
  const expiresAt = new Date(
    Date.now() + payment.boostDurationDays * 24 * 60 * 60 * 1000,
  );

  await Tool.findByIdAndUpdate(payment.toolId, {
    $addToSet: { activeBoosts: slot },
    $set: { [`boostExpiresAt.${slot}`]: expiresAt },
  });
}

async function removeBoostFromTool(payment: {
  toolId: unknown;
  productType: BoostProductType;
}) {
  const slot = boostSlotFor(payment.productType);
  await Tool.findByIdAndUpdate(payment.toolId, {
    $pull: { activeBoosts: slot },
    $unset: { [`boostExpiresAt.${slot}`]: "" },
  });
}

async function recordAffiliateCommission(payment: {
  userId: string;
  amount: number;
  orderId: string;
}) {
  try {
    const user = await User.findOne({ clerkId: payment.userId });
    if (!user?.referredBy) return;

    const affiliate = await AffiliateProfile.findOne({
      uniqueCode: user.referredBy,
    });
    if (
      !affiliate ||
      affiliate.status !== "active" ||
      affiliate.userId === payment.userId
    ) {
      return;
    }

    // Default boost commission: 10%. We don't read AffiliateSettings
    // for boosts to avoid the case where the admin set a 20%
    // subscription rate that's wrong for one-off boosts.
    const BOOST_COMMISSION_RATE = 0.1;
    const commissionAmount = Math.round(payment.amount * BOOST_COMMISSION_RATE);
    if (commissionAmount <= 0) return;

    await Commission.create({
      affiliateId: affiliate.userId,
      referredUserId: payment.userId,
      amount: commissionAmount,
      status: "pending",
      type: "boost",
      sourceId: payment.orderId,
    });

    affiliate.unpaidBalance += commissionAmount;
    affiliate.totalEarnings += commissionAmount;
    await affiliate.save();
  } catch (err) {
    // Affiliate failures must not break the payment success path.
    console.error("recordAffiliateCommission failed:", err);
  }
}
