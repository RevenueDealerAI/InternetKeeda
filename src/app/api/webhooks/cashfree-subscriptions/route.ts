import { NextRequest, NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { connectDB } from "@/app/api/lib/db";
import { Subscription } from "@/app/api/models/Subscription";
import { Tool } from "@/app/api/models/Tool";
import { markSubscriptionActive } from "@/app/api/lib/subscription-state";
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
  | "SUBSCRIPTION_STATUS_CHANGED"
  | "SUBSCRIPTION_CARD_EXPIRY_REMINDER";

const MAX_REPLAY_WINDOW_MS = 5 * 60 * 1000;
const MAX_FAILED_RENEWALS_BEFORE_UNLIST = 3;

export const dynamic = "force-dynamic";

/**
 * Multi-variant Cashfree webhook signature verifier.
 *
 * The previous single-variant implementation (timestamp + body,
 * base64) rejects every Cashfree subscription delivery in production.
 * Cashfree's documented spec for PG webhooks matches that variant —
 * but Subscription webhooks may use a different concatenation,
 * encoding, or separator. Rather than guess, we compute every common
 * variant for each candidate secret (CASHFREE_WEBHOOK_SECRET if set,
 * CASHFREE_SECRET_KEY as fallback) and accept if *any* matches.
 *
 * On a match: log which variant + which secret matched so we can
 * collapse back to a single variant later.
 *
 * On reject: log every computed candidate so we can see what's close.
 */

type Variant = {
  name: string;
  compute: (secret: string, body: string, ts: string) => string;
};

const VARIANTS: Variant[] = [
  {
    name: "b64(ts+body)",
    compute: (s, b, t) => createHmac("sha256", s).update(t + b).digest("base64"),
  },
  {
    name: "hex(ts+body)",
    compute: (s, b, t) => createHmac("sha256", s).update(t + b).digest("hex"),
  },
  {
    name: "b64(body+ts)",
    compute: (s, b, t) => createHmac("sha256", s).update(b + t).digest("base64"),
  },
  {
    name: "hex(body+ts)",
    compute: (s, b, t) => createHmac("sha256", s).update(b + t).digest("hex"),
  },
  {
    name: "b64(body)",
    compute: (s, b) => createHmac("sha256", s).update(b).digest("base64"),
  },
  {
    name: "hex(body)",
    compute: (s, b) => createHmac("sha256", s).update(b).digest("hex"),
  },
  {
    name: "b64(ts.body)",
    compute: (s, b, t) => createHmac("sha256", s).update(t + "." + b).digest("base64"),
  },
  {
    name: 'b64(v1,ts,body)',
    compute: (s, b, t) =>
      createHmac("sha256", s).update("v1," + t + "," + b).digest("base64"),
  },
];

function constantTimeEq(a: string, b: string): boolean {
  try {
    const ab = Buffer.from(a);
    const bb = Buffer.from(b);
    return ab.length === bb.length && timingSafeEqual(ab, bb);
  } catch {
    return false;
  }
}

interface VerifyResult {
  ok: boolean;
  matchedVariant?: string;
  matchedSecretSource?: "webhook" | "client";
  candidates: Array<{ variant: string; secretSource: string; computed: string }>;
}

function verifyCashfreeSignature(
  rawBody: string,
  timestamp: string,
  signature: string,
): VerifyResult {
  const webhookSecret = process.env.CASHFREE_WEBHOOK_SECRET || "";
  const clientSecret = process.env.CASHFREE_SECRET_KEY || "";
  const sources: Array<{ source: "webhook" | "client"; secret: string }> = [];
  if (webhookSecret) sources.push({ source: "webhook", secret: webhookSecret });
  if (clientSecret) sources.push({ source: "client", secret: clientSecret });

  const candidates: VerifyResult["candidates"] = [];
  for (const { source, secret } of sources) {
    for (const v of VARIANTS) {
      const computed = v.compute(secret, rawBody, timestamp);
      candidates.push({ variant: v.name, secretSource: source, computed });
      if (constantTimeEq(computed, signature)) {
        return { ok: true, matchedVariant: v.name, matchedSecretSource: source, candidates };
      }
    }
  }
  return { ok: false, candidates };
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

    // Cashfree's x-webhook-timestamp may arrive as Unix seconds
    // (10 digits) OR milliseconds (13 digits) depending on the
    // product / API version. Previously hardcoded `* 1000`, which
    // rejected every delivery from endpoints emitting ms. Auto-
    // detect by magnitude — anything < 1e12 is seconds.
    const rawTs = Number(timestamp);
    if (Number.isNaN(rawTs)) {
      console.warn("[cf-subs-webhook] reject", {
        reason: "timestamp_not_a_number",
        timestamp,
      });
      return NextResponse.json(
        { error: "Webhook timestamp invalid" },
        { status: 401 },
      );
    }
    const tsMs = rawTs < 1e12 ? rawTs * 1000 : rawTs;
    const deltaMs = Math.abs(Date.now() - tsMs);
    if (deltaMs > MAX_REPLAY_WINDOW_MS) {
      console.warn("[cf-subs-webhook] reject", {
        reason: "timestamp_out_of_range",
        rawTimestamp: timestamp,
        parsedTsMs: tsMs,
        nowMs: Date.now(),
        deltaMs,
        windowMs: MAX_REPLAY_WINDOW_MS,
      });
      return NextResponse.json(
        { error: "Webhook timestamp out of range" },
        { status: 401 },
      );
    }
    // HMAC computation below uses the raw `timestamp` string — that's
    // what Cashfree signed against, regardless of unit.

    const verifyResult = verifyCashfreeSignature(
      rawBody,
      timestamp,
      signature,
    );
    if (!verifyResult.ok) {
      console.warn("[cf-subs-webhook] reject", {
        reason: "signature_mismatch",
        receivedSig: signature,
        timestamp,
        bodyLength: rawBody.length,
        webhookSecretPrefix:
          (process.env.CASHFREE_WEBHOOK_SECRET || "").slice(0, 8),
        clientSecretPrefix:
          (process.env.CASHFREE_SECRET_KEY || "").slice(0, 8),
        candidates: verifyResult.candidates,
      });
      return NextResponse.json(
        { error: "Invalid signature" },
        { status: 401 },
      );
    }
    console.log("[cf-subs-webhook] sig.match", {
      variant: verifyResult.matchedVariant,
      secretSource: verifyResult.matchedSecretSource,
    });

    console.log("[cf-subs-webhook] body.parse.start", { length: rawBody.length });
    let parsed: { type?: SubscriptionEvent; data?: Record<string, unknown> };
    try {
      parsed = JSON.parse(rawBody);
    } catch (err) {
      console.error("[cf-subs-webhook] processing.error", {
        step: "json_parse",
        err: err instanceof Error ? err.message : String(err),
      });
      return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
    }

    // Extract subscription_id from any of the shapes Cashfree may use.
    // Their docs and the wild diverge: some payloads put fields flat
    // under `data`, others nest under `data.subscription`. Try both.
    const data = parsed.data ?? {};
    const dataSub = (data.subscription as Record<string, unknown> | undefined) ?? {};
    const dataAuth =
      (data.authorization as Record<string, unknown> | undefined) ??
      (data.authorization_details as Record<string, unknown> | undefined) ??
      (dataSub.authorization as Record<string, unknown> | undefined) ??
      {};

    const subscriptionId =
      (data.subscription_id as string | undefined) ||
      (dataSub.subscription_id as string | undefined);
    const subscriptionStatus =
      (data.subscription_status as string | undefined) ||
      (dataSub.subscription_status as string | undefined);
    const authorizationStatus =
      (data.authorization_status as string | undefined) ||
      (dataSub.authorization_status as string | undefined) ||
      (dataAuth.authorization_status as string | undefined);
    const nextChargeDate =
      (data.next_charge_date as string | undefined) ||
      (dataSub.next_charge_date as string | undefined);

    console.log("[cf-subs-webhook] body.parsed", {
      type: parsed.type,
      subscriptionId,
      subscriptionStatus,
      authorizationStatus,
      dataKeys: Object.keys(data),
    });

    const eventType = parsed.type;
    if (!eventType || !subscriptionId) {
      console.warn("[cf-subs-webhook] event.routed", {
        handler: "no_handler_found",
        reason: !eventType ? "missing_type" : "missing_subscription_id",
        rawPayload: parsed,
      });
      return NextResponse.json({ received: true, skipped: "no-subscription-id" });
    }

    console.log("[cf-subs-webhook] db.lookup", { subscriptionId });
    await connectDB();
    const sub = await Subscription.findOne({ subscriptionId });
    console.log("[cf-subs-webhook] db.found", {
      found: !!sub,
      currentStatus: sub?.status,
    });
    if (!sub) {
      console.warn("[cf-subs-webhook] event.routed", {
        handler: "no_handler_found",
        reason: "unknown_subscription_id",
        subscriptionId,
      });
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

    // Unified "this subscription is now live" handler. Cashfree
    // signals this via multiple events depending on which product /
    // API version is in play — SUBSCRIPTION_ACTIVATED, or
    // SUBSCRIPTION_AUTH_STATUS with authorization_status=ACTIVE, or
    // SUBSCRIPTION_STATUS_CHANGED with subscription_status=ACTIVE.
    // All three route through markSubscriptionActive (shared with
    // the polling-fallback in /api/subscriptions/status), which
    // uses an idempotent findOneAndUpdate so the two paths can't
    // double-apply.
    const markActive = async (handlerLabel: string) => {
      const prevStatus = sub.status;
      console.log("[cf-subs-webhook] db.update.start", {
        handler: handlerLabel,
        from: prevStatus,
        to: "active",
      });
      const { applied } = await markSubscriptionActive(sub.subscriptionId, {
        source: "webhook",
        authorizationStatus,
        nextChargeDate,
      });
      console.log("[cf-subs-webhook] db.update.done", {
        handler: handlerLabel,
        applied,
      });
    };

    switch (eventType) {
      case "SUBSCRIPTION_NEW": {
        console.log("[cf-subs-webhook] event.routed", { type: eventType, handler: "new" });
        // Don't downgrade an already-active sub if events arrive out
        // of order — only set to initialized if we were truly fresh.
        if (sub.status === "initialized" || sub.status === "failed") {
          sub.status = "initialized";
        }
        if (authorizationStatus) sub.authorizationStatus = authorizationStatus;
        await sub.save();
        break;
      }
      case "SUBSCRIPTION_ACTIVATED": {
        console.log("[cf-subs-webhook] event.routed", { type: eventType, handler: "activated" });
        await markActive("SUBSCRIPTION_ACTIVATED");
        break;
      }
      case "SUBSCRIPTION_AUTH_STATUS": {
        const isActive = authorizationStatus?.toUpperCase() === "ACTIVE";
        console.log("[cf-subs-webhook] event.routed", {
          type: eventType,
          handler: isActive ? "auth_status_active" : "auth_status_other",
          authorizationStatus,
        });
        if (isActive) {
          await markActive("SUBSCRIPTION_AUTH_STATUS(ACTIVE)");
        } else {
          if (authorizationStatus) sub.authorizationStatus = authorizationStatus;
          await sub.save();
        }
        break;
      }
      case "SUBSCRIPTION_STATUS_CHANGED": {
        const isActive = subscriptionStatus?.toUpperCase() === "ACTIVE";
        const isCancelled = subscriptionStatus?.toUpperCase() === "CANCELLED";
        console.log("[cf-subs-webhook] event.routed", {
          type: eventType,
          handler: isActive ? "status_changed_active" : isCancelled ? "status_changed_cancelled" : "status_changed_other",
          subscriptionStatus,
        });
        if (isActive) {
          await markActive("SUBSCRIPTION_STATUS_CHANGED(ACTIVE)");
        } else if (isCancelled) {
          sub.status = "cancelled";
          sub.cancelledAt = new Date();
          await sub.save();
          await Tool.findByIdAndUpdate(sub.toolId, {
            $set: { listingStatus: "unpaid-hidden" },
          });
        } else {
          await sub.save();
        }
        break;
      }
      case "SUBSCRIPTION_PAYMENT_SUCCESS": {
        console.log("[cf-subs-webhook] event.routed", { type: eventType, handler: "payment_success" });
        sub.failedRenewalCount = 0;
        if (nextChargeDate) {
          sub.nextBillingDate = new Date(nextChargeDate);
          sub.currentPeriodStart = new Date();
          sub.currentPeriodEnd = sub.nextBillingDate;
        }
        // Keep status as active unless we were cancelled (out-of-order
        // delivery defence).
        if (sub.status !== "cancelled") {
          if (sub.status !== "active") {
            await markActive("SUBSCRIPTION_PAYMENT_SUCCESS");
          } else {
            await sub.save();
          }
        }
        await recordAffiliateCommission(sub);
        break;
      }
      case "SUBSCRIPTION_PAYMENT_FAILED": {
        console.log("[cf-subs-webhook] event.routed", { type: eventType, handler: "payment_failed" });
        sub.failedRenewalCount = (sub.failedRenewalCount || 0) + 1;
        if (sub.failedRenewalCount >= MAX_FAILED_RENEWALS_BEFORE_UNLIST) {
          sub.status = "failed";
          await sub.save();
          await Tool.findByIdAndUpdate(sub.toolId, {
            $set: { listingStatus: "unpaid-hidden" },
          });
        } else {
          await sub.save();
        }
        break;
      }
      case "SUBSCRIPTION_CANCELLED": {
        console.log("[cf-subs-webhook] event.routed", { type: eventType, handler: "cancelled" });
        sub.status = "cancelled";
        sub.cancelledAt = new Date();
        await sub.save();
        await Tool.findByIdAndUpdate(sub.toolId, {
          $set: { listingStatus: "unpaid-hidden" },
        });
        break;
      }
      case "SUBSCRIPTION_PAUSED": {
        console.log("[cf-subs-webhook] event.routed", { type: eventType, handler: "paused" });
        sub.status = "paused";
        await sub.save();
        break;
      }
      case "SUBSCRIPTION_CARD_EXPIRY_REMINDER": {
        console.log("[cf-subs-webhook] event.routed", { type: eventType, handler: "card_expiry_reminder" });
        await sub.save();
        break;
      }
      default: {
        console.warn("[cf-subs-webhook] event.routed", {
          type: eventType,
          handler: "no_handler_found",
          reason: "unknown_event_type",
        });
        await sub.save();
      }
    }

    return NextResponse.json({ received: true });
  } catch (err) {
    console.error("[cf-subs-webhook] processing.error", {
      step: "outer_catch",
      err: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.split("\n").slice(0, 6) : undefined,
    });
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
