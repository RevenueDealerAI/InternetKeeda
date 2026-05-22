import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { connectDB } from "@/app/api/lib/db";
import { Subscription } from "@/app/api/models/Subscription";
import { Tool } from "@/app/api/models/Tool";
import { User } from "@/app/api/models/User";
import { AffiliateProfile } from "@/app/api/models/AffiliateProfile";
import { Commission } from "@/app/api/models/Commission";
import { AffiliateSettings } from "@/models/AffiliateSettings";

type SubscriptionEvent =
  | "SUBSCRIPTION_NEW"
  | "SUBSCRIPTION_ACTIVATED"
  | "SUBSCRIPTION_PAYMENT_SUCCESS"
  | "SUBSCRIPTION_PAYMENT_FAILED"
  | "SUBSCRIPTION_CANCELLED"
  | "SUBSCRIPTION_PAUSED"
  | "SUBSCRIPTION_AUTH_STATUS"
  | "SUBSCRIPTION_CARD_EXPIRY_REMINDER";

const MAX_REPLAY_WINDOW_MS = 5 * 60 * 1000;
const MAX_FAILED_RENEWALS_BEFORE_UNLIST = 3;

export const dynamic = "force-dynamic";

/**
 * HMAC verification per Cashfree's webhook spec:
 *
 *   signature = base64(HMAC-SHA256(timestamp + rawBody, secret))
 *
 * Subscription webhooks are signed with the **per-webhook secret**
 * generated when you register the webhook in Cashfree's dashboard —
 * NOT the client secret used for API auth. We honour
 * CASHFREE_WEBHOOK_SECRET when set, and fall back to
 * CASHFREE_SECRET_KEY for environments that left it blank (which is
 * what the sandbox dashboard does until you explicitly create one).
 */
function verifyCashfreeSignature(
  rawBody: string,
  timestamp: string,
  signature: string,
): { ok: boolean; expected: string; secretSource: "webhook" | "client" | "none" } {
  const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET || "";
  const clientSecret = process.env.CASHFREE_SECRET_KEY || "";
  const secret = webhookSecret || clientSecret;
  if (!secret) {
    return { ok: false, expected: "", secretSource: "none" };
  }
  const expected = createHmac("sha256", secret)
    .update(timestamp + rawBody)
    .digest("base64");

  let ok = false;
  try {
    const a = Buffer.from(signature);
    const b = Buffer.from(expected);
    ok = a.length === b.length && timingSafeEqual(a, b);
  } catch {
    ok = false;
  }
  return {
    ok,
    expected,
    secretSource: webhookSecret ? "webhook" : "client",
  };
}

export async function POST(req: NextRequest) {
  try {
    const rawBody = await req.text();
    const signature = req.headers.get("x-webhook-signature");
    const timestamp = req.headers.get("x-webhook-timestamp");

    if (!signature || !timestamp) {
      console.warn("[cf-subs-webhook] reject", {
        reason: "missing_headers",
        hasSignature: !!signature,
        hasTimestamp: !!timestamp,
        allHeaders: Object.fromEntries(req.headers.entries()),
      });
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
      console.warn("[cf-subs-webhook] reject", {
        reason: "timestamp_out_of_range",
        timestamp,
        nowMs: Date.now(),
        deltaMs: Math.abs(Date.now() - tsMs),
      });
      return NextResponse.json(
        { error: "Webhook timestamp out of range" },
        { status: 401 },
      );
    }

    const { ok, expected, secretSource } = verifyCashfreeSignature(
      rawBody,
      timestamp,
      signature,
    );
    if (!ok) {
      console.warn("[cf-subs-webhook] reject", {
        reason: "signature_mismatch",
        receivedSig: signature,
        expectedSig: expected,
        timestamp,
        bodyLength: rawBody.length,
        secretSource,
        webhookSecretPrefix:
          (process.env.CASHFREE_WEBHOOK_SECRET || "").slice(0, 8),
        clientSecretPrefix:
          (process.env.CASHFREE_SECRET_KEY || "").slice(0, 8),
      });
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 },
      );
    }

    let parsed: {
      type?: SubscriptionEvent;
      data?: {
        subscription?: {
          subscription_id?: string;
          subscription_status?: string;
          authorization_status?: string;
          current_cycle?: number;
          next_charge_date?: string;
        };
        payment?: {
          payment_amount?: number;
          payment_status?: string;
        };
      };
    };
    try {
      parsed = JSON.parse(rawBody);
    } catch {
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    const eventType = parsed.type;
    const subscriptionId = parsed.data?.subscription?.subscription_id;

    if (!eventType || !subscriptionId) {
      return NextResponse.json({ received: true, skipped: "no-subscription-id" });
    }

    await connectDB();
    const sub = await Subscription.findOne({ subscriptionId });
    if (!sub) {
      console.warn("cashfree-subscriptions for unknown id", subscriptionId);
      return NextResponse.json({ received: true, skipped: "unknown" });
    }

    // Persist raw event under metadata.events[] for debugging.
    const existingEvents = Array.isArray(
      (sub.metadata as Record<string, unknown>)?.events,
    )
      ? ((sub.metadata as Record<string, unknown>).events as unknown[])
      : [];
    sub.metadata = {
      ...(sub.metadata || {}),
      events: [
        ...existingEvents,
        { type: eventType, at: new Date().toISOString(), payload: parsed.data },
      ],
    };

    switch (eventType) {
      case "SUBSCRIPTION_NEW": {
        sub.status = "initialized";
        if (parsed.data?.subscription?.authorization_status) {
          sub.authorizationStatus = parsed.data.subscription.authorization_status;
        }
        await sub.save();
        break;
      }
      case "SUBSCRIPTION_ACTIVATED": {
        sub.status = "active";
        sub.authorizationStatus =
          parsed.data?.subscription?.authorization_status || sub.authorizationStatus;
        if (parsed.data?.subscription?.next_charge_date) {
          sub.nextBillingDate = new Date(parsed.data.subscription.next_charge_date);
          sub.currentPeriodStart = new Date();
          sub.currentPeriodEnd = sub.nextBillingDate;
        }
        sub.failedRenewalCount = 0;
        await sub.save();
        // Flip the tool to publicly visible.
        await Tool.findByIdAndUpdate(sub.toolId, {
          $set: { listingStatus: "paid-active" },
        });
        break;
      }
      case "SUBSCRIPTION_PAYMENT_SUCCESS": {
        sub.failedRenewalCount = 0;
        if (parsed.data?.subscription?.next_charge_date) {
          sub.nextBillingDate = new Date(parsed.data.subscription.next_charge_date);
          sub.currentPeriodStart = new Date();
          sub.currentPeriodEnd = sub.nextBillingDate;
        }
        // Keep status as active if we were active; ignore if we were
        // cancelled (Cashfree shouldn't fire success after cancel, but
        // defensive in case of out-of-order delivery).
        if (sub.status !== "cancelled") sub.status = "active";
        await sub.save();
        await recordAffiliateCommission(sub);
        break;
      }
      case "SUBSCRIPTION_PAYMENT_FAILED": {
        sub.failedRenewalCount = (sub.failedRenewalCount || 0) + 1;
        if (sub.failedRenewalCount >= MAX_FAILED_RENEWALS_BEFORE_UNLIST) {
          sub.status = "failed";
          await sub.save();
          // Auto-unlist after 3 strikes.
          await Tool.findByIdAndUpdate(sub.toolId, {
            $set: { listingStatus: "unpaid-hidden" },
          });
        } else {
          await sub.save();
        }
        break;
      }
      case "SUBSCRIPTION_CANCELLED": {
        sub.status = "cancelled";
        sub.cancelledAt = new Date();
        await sub.save();
        await Tool.findByIdAndUpdate(sub.toolId, {
          $set: { listingStatus: "unpaid-hidden" },
        });
        break;
      }
      case "SUBSCRIPTION_PAUSED": {
        sub.status = "paused";
        await sub.save();
        break;
      }
      case "SUBSCRIPTION_AUTH_STATUS": {
        if (parsed.data?.subscription?.authorization_status) {
          sub.authorizationStatus = parsed.data.subscription.authorization_status;
        }
        await sub.save();
        break;
      }
      case "SUBSCRIPTION_CARD_EXPIRY_REMINDER": {
        // Log only — Phase B/C don't have email infrastructure to
        // forward this. Admin can pull it from metadata.events[].
        await sub.save();
        break;
      }
      default: {
        await sub.save();
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("cashfree-subscriptions handler crashed:", err);
    return NextResponse.json(
      { error: "Webhook processing failed" },
      { status: 500 },
    );
  }
}

async function recordAffiliateCommission(sub: {
  userId: string;
  amount: number;
  subscriptionId: string;
}) {
  try {
    const user = await User.findOne({ clerkId: sub.userId });
    if (!user?.referredBy) return;

    const affiliate = await AffiliateProfile.findOne({
      uniqueCode: user.referredBy,
    });
    if (
      !affiliate ||
      affiliate.status !== "active" ||
      affiliate.userId === sub.userId
    ) {
      return;
    }

    const settings = await AffiliateSettings.getSettings();
    const rate = settings.commissionRate || 0.2;
    const commissionAmount = Math.round(sub.amount * rate);
    if (commissionAmount <= 0) return;

    await Commission.create({
      affiliateId: affiliate.userId,
      referredUserId: sub.userId,
      amount: commissionAmount,
      status: "pending",
      type: "subscription",
      sourceId: sub.subscriptionId,
    });

    affiliate.unpaidBalance += commissionAmount;
    affiliate.totalEarnings += commissionAmount;
    await affiliate.save();
  } catch (err) {
    console.error("subscription affiliate commission failed:", err);
  }
}
