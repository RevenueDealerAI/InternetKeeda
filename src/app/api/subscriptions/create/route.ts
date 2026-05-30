import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/app/api/lib/db";
import { requireAuth, errorResponse, getAuth } from "@/app/api/lib/auth";
import { Tool } from "@/app/api/models/Tool";
import { Subscription } from "@/app/api/models/Subscription";
import { getCashfreeClient, getCashfreeMode, PRICING } from "@/lib/cashfree";

const RESUME_WINDOW_MS = 10 * 60 * 1000;

const bodySchema = z.object({
  toolId: z.string().min(1, "toolId is required"),
});

function siteOrigin(req: NextRequest): string {
  const env =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, "");
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

/**
 * POST /api/subscriptions/create
 *
 * Body: { toolId }
 *
 * Creates a Cashfree subscription for the monthly listing fee
 * (PROD plan id `monthly-listing-inr-830`, ₹830/mo with a ₹2,490
 * max-amount headroom). User-facing UI elsewhere displays "$10/mo"
 * via USER_FACING_PRICES; Cashfree's checkout shows ₹830 at
 * payment time, which is expected for Indian buyers.
 *
 * The flow:
 *   1. Validate user owns the tool, no active sub exists for it
 *   2. Insert Subscription row (status: 'initialized')
 *   3. Call Cashfree SubsCreateSubscription with PLAN inlined
 *   4. Return { subscriptionId, sessionId } so the frontend can
 *      hand `sessionId` to Cashfree's JS v3 SDK
 *      (`cashfree.subscriptionsCheckout({ subscriptionSessionId })`),
 *      which opens the hosted authorization page
 *
 * The actual status flip to 'active' happens via the
 * SUBSCRIPTION_ACTIVATED webhook — Tool.listingStatus moves to
 * 'paid-active' at the same time, which is when the tool becomes
 * publicly visible.
 */
export async function POST(req: NextRequest) {
  // Temporary debug logging — remove after first successful sandbox run.
  const log = (step: string, payload?: unknown) =>
    console.error("[sub-create]", step, payload ?? "");

  // Kill switch. The Cashfree subscription path is being re-rolled
  // out behind a feature flag — the route returns 503 until the
  // operator flips SUBSCRIPTIONS_ENABLED=true in Vercel env after
  // the live smoke test passes. Boost (one-time) checkout is
  // unaffected; this gate only covers recurring subscriptions.
  if ((process.env.SUBSCRIPTIONS_ENABLED || "false").toLowerCase() !== "true") {
    log("kill-switch", { enabled: process.env.SUBSCRIPTIONS_ENABLED ?? "<unset>" });
    return NextResponse.json(
      {
        error: "SUBSCRIPTIONS_DISABLED",
        message:
          "Subscriptions temporarily unavailable — try again shortly.",
      },
      { status: 503 },
    );
  }

  try {
    log("start");
    await connectDB();
    log("db.connected");
    const auth = await requireAuth(req);
    log("auth.ok", { userId: auth.userId });
    const body = await req.json();
    log("body.parsed", body);
    const { toolId } = bodySchema.parse(body);
    log("zod.ok", { toolId });

    const tool = await Tool.findById(toolId);
    log("tool.lookup", { found: !!tool, seededTool: tool?.seededTool, ownerUserId: tool?.ownerUserId, listingStatus: tool?.listingStatus });
    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }
    if (tool.seededTool) {
      return NextResponse.json(
        { error: "Seeded tools are grandfathered free." },
        { status: 400 },
      );
    }
    if (tool.ownerUserId !== auth.userId) {
      log("owner.mismatch", { expected: auth.userId, actual: tool.ownerUserId });
      return NextResponse.json(
        { error: "You can only subscribe for tools you own." },
        { status: 403 },
      );
    }

    // ── Resume-or-clean check ──────────────────────────────────
    // If an active/paused sub exists, refuse (409). If an
    // initialized (i.e. authorization-pending) sub exists from a
    // recent attempt, return its existing authorization link so
    // the user resumes the same flow. If the initialized sub is
    // stale (>10 min) the user probably abandoned it — delete the
    // orphan and start fresh.
    const existingActive = await Subscription.findOne({
      toolId: tool._id,
      status: { $in: ["active", "paused"] },
    });
    log("existing.activeCheck", { has: !!existingActive });
    if (existingActive) {
      return NextResponse.json(
        {
          error: "This tool already has an active subscription.",
          subscriptionId: existingActive.subscriptionId,
        },
        { status: 409 },
      );
    }

    const existingInitialized = await Subscription.findOne({
      toolId: tool._id,
      userId: auth.userId,
      status: "initialized",
    }).sort({ createdAt: -1 });

    if (existingInitialized) {
      const ageMs = Date.now() - new Date(existingInitialized.createdAt).getTime();
      const sameProvider = (existingInitialized.provider ?? "cashfree") === "cashfree";
      log("existing.initialized", {
        dbId: String(existingInitialized._id),
        subscriptionId: existingInitialized.subscriptionId,
        provider: existingInitialized.provider,
        ageMs,
      });
      // Only resume same-provider rows. If the user previously
      // tried PayPal and is now retrying with Cashfree (or vice
      // versa), the stashed session id from the other provider is
      // useless — delete and create fresh.
      if (sameProvider && ageMs < RESUME_WINDOW_MS) {
        const stashed = (existingInitialized.metadata as Record<string, unknown>)
          ?.createResponse as
          | { subscription_session_id?: string }
          | undefined;
        return NextResponse.json({
          subscriptionId: existingInitialized.subscriptionId,
          subscriptionDbId: String(existingInitialized._id),
          sessionId: stashed?.subscription_session_id,
          amount: existingInitialized.amount,
          currency: existingInitialized.currency,
          mode: process.env.CASHFREE_MODE === "PROD" ? "production" : "sandbox",
          resumed: true,
        });
      }
      // Stale same-provider orphan, OR cross-provider switch — wipe
      // and continue. The user gets a clean retry that respects
      // whichever gateway they just picked.
      await Subscription.deleteOne({ _id: existingInitialized._id });
      log("existing.initialized.deleted", {
        dbId: String(existingInitialized._id),
        reason: sameProvider ? "stale" : "cross-provider",
      });
    }

    // Phone precondition — runs BEFORE we insert the Subscription
    // row so a phone-less user never leaves an orphan row to clean
    // up. Cashfree subscriptions need a verified phone for the
    // UPI Autopay collect-request / e-mandate mandate flow; the
    // previous test-only placeholder fallback was masking this
    // requirement and routing the mandate request to a number the
    // customer doesn't own.
    const clerkUser = await getAuth();
    log("clerk.user", {
      hasUser: !!clerkUser,
      hasEmail: !!clerkUser?.emailAddresses?.[0]?.emailAddress,
      hasPhone: !!clerkUser?.phoneNumbers?.[0]?.phoneNumber,
    });
    const verifiedPhone = clerkUser?.phoneNumbers?.find(
      (p) => p?.verification?.status === "verified",
    );
    if (!verifiedPhone?.phoneNumber) {
      log("phone.required");
      return NextResponse.json(
        {
          error: "PHONE_REQUIRED",
          message:
            "A verified phone number is required to start a subscription. Please add one in your profile.",
        },
        { status: 400 },
      );
    }
    const customerPhone = verifiedPhone.phoneNumber.trim();
    // Defense-in-depth: the precondition above should have already
    // caught anything malformed, but if Clerk ever returns something
    // un-E.164 we refuse the call rather than ship junk to Cashfree.
    if (!/^\+\d{8,15}$/.test(customerPhone)) {
      log("phone.invalid", { sample: customerPhone.slice(0, 4) });
      return NextResponse.json(
        {
          error: "PHONE_INVALID",
          message:
            "Phone number is not in international format. Please re-add it in your profile.",
        },
        { status: 400 },
      );
    }
    const customerEmail =
      clerkUser?.emailAddresses?.[0]?.emailAddress ||
      `${auth.userId}@no-email.internetkeeda.com`;
    const customerName =
      `${clerkUser?.firstName ?? ""} ${clerkUser?.lastName ?? ""}`.trim() ||
      undefined;

    // Pre-generate the ObjectId so subscription_id is unique on
    // first insert — no "pending" placeholder, no E11000 retry hazard.
    const dbId = new mongoose.Types.ObjectId();
    const subscriptionId = `sub_${dbId.toString()}_${Date.now()}`;

    const sub = await Subscription.create({
      _id: dbId,
      userId: auth.userId,
      toolId: tool._id,
      planId: PRICING.MONTHLY_LISTING.planId,
      subscriptionId,
      amount: PRICING.MONTHLY_LISTING.amountMinorUnit,
      currency: PRICING.MONTHLY_LISTING.currency,
      status: "initialized",
      billingCycle: "monthly",
      cashfreeMode: getCashfreeMode(),
    });
    log("sub.row.created", { dbId: String(sub._id), subscriptionId });

    const origin = siteOrigin(req);

    log("cf.about_to_call", {
      subscriptionId,
      planId: PRICING.MONTHLY_LISTING.planId,
      customerEmail,
      customerPhonePresent: !!customerPhone,
      origin,
      mode: process.env.CASHFREE_MODE,
      appIdPrefix: (process.env.CASHFREE_APP_ID || "").slice(0, 12),
      secretPrefix: (process.env.CASHFREE_SECRET_KEY || "").slice(0, 16),
    });

    try {
      const cf = getCashfreeClient();
      log("cf.client.created");
      // No inline plan_details — the plan is provisioned out of
      // band by scripts/cashfree-create-plans.ts and referenced
      // by id only. Inlining was causing Cashfree to inherit the
      // payload's plan config every call, which the dashboard then
      // surfaced as "plan_not_found" when looked up directly.
      //
      // notification_channel: required so Cashfree's hosted checkout
      //   can deliver the UPI Autopay collect request via SMS / EMAIL.
      //   Without it, UPI Autopay options are filtered out → "No
      //   Payment Mode Available".
      // authorization_amount: ₹1 in paise. Required for card-mandate
      //   auth — Cashfree filters card-recurring out without it.
      // subscription_first_charge_time: explicit "now + 60s" so the
      //   PERIODIC flow has an unambiguous first cycle time across
      //   timezones / clock skew.
      const firstChargeAt = new Date(Date.now() + 60_000).toISOString();
      const cfResp = await cf.SubsCreateSubscription({
        subscription_id: subscriptionId,
        customer_details: {
          customer_email: customerEmail,
          customer_phone: customerPhone,
          ...(customerName ? { customer_name: customerName } : {}),
        },
        plan_details: { plan_id: PRICING.MONTHLY_LISTING.planId },
        authorization_details: {
          authorization_amount: 100,
        },
        subscription_first_charge_time: firstChargeAt,
        subscription_meta: {
          // Bounce via /subscription/return-bounce — that route
          // accepts Cashfree's form POST and 303-redirects to the
          // GET-only page at /subscription/return with the
          // subscription_id parsed out of the body as a query param.
          return_url: `${origin}/subscription/return-bounce`,
          notification_channel: ["EMAIL", "SMS"],
        },
      });

      // Cashfree's SubscriptionEntity has NO authorization link field
      // (verified against the cashfree-pg@6 SDK's TypeScript types).
      // The only actionable handoff value is `subscription_session_id`
      // — the client hands it to Cashfree's JS v3 SDK, which opens
      // the hosted authorization page.
      const data = cfResp.data as {
        subscription_session_id?: string;
      };

      // subscriptionId was already stored on insert; just stash CF response.
      sub.metadata = { createResponse: cfResp.data };
      await sub.save();

      return NextResponse.json({
        subscriptionId,
        subscriptionDbId: String(sub._id),
        sessionId: data.subscription_session_id,
        amount: PRICING.MONTHLY_LISTING.amountMinorUnit,
        currency: PRICING.MONTHLY_LISTING.currency,
        mode: process.env.CASHFREE_MODE === "PROD" ? "production" : "sandbox",
      });
    } catch (cfErr) {
      // Axios errors carry the real API response under response.data.
      const axiosLike = cfErr as { response?: { status?: number; data?: unknown }; message?: string };
      log("cf.error", {
        message: axiosLike.message,
        status: axiosLike.response?.status,
        data: axiosLike.response?.data,
      });
      // Delete the Mongo row so the next retry isn't blocked by an
      // orphan. The user gets a clean E11000-free retry attempt.
      try {
        await Subscription.deleteOne({ _id: sub._id });
        log("sub.row.deleted_after_cf_error", { dbId: String(sub._id) });
      } catch (delErr) {
        log("sub.row.delete_failed", {
          dbId: String(sub._id),
          err: delErr instanceof Error ? delErr.message : String(delErr),
        });
      }
      // Specific signal for the plan-not-provisioned case so the
      // operator knows the fix is to run the provisioning script,
      // not to dig through axios stack traces.
      const cfBody = axiosLike.response?.data as { code?: string } | undefined;
      if (cfBody?.code === "plan_not_found") {
        console.error(
          "Cashfree plan missing in LIVE — run scripts/cashfree-create-plans.ts",
          { planId: PRICING.MONTHLY_LISTING.planId },
        );
        return NextResponse.json(
          {
            error: "PLAN_MISSING",
            message: `Cashfree plan "${PRICING.MONTHLY_LISTING.planId}" is missing — run scripts/cashfree-create-plans.ts against LIVE to provision it, then retry.`,
          },
          { status: 500 },
        );
      }
      return errorResponse("Failed to create Cashfree subscription", 502);
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 400 },
      );
    }
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    log("outer.catch", {
      message: err instanceof Error ? err.message : String(err),
      stack: err instanceof Error ? err.stack?.split("\n").slice(0, 6) : undefined,
    });
    return errorResponse("Failed to create subscription", 500);
  }
}
