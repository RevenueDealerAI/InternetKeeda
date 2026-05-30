import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/app/api/lib/db";
import { errorResponse } from "@/app/api/lib/auth";
import { requireUser } from "@/lib/auth/user";
import { Tool } from "@/app/api/models/Tool";
import { Subscription } from "@/app/api/models/Subscription";
import { createSubscription, getPaypalMode, PayPalError } from "@/lib/paypal";

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
 * POST /api/payments/paypal/create-subscription
 *
 * PayPal counterpart of /api/subscriptions/create (Cashfree). Creates
 * a Mongo Subscription row in 'initialized' state, asks PayPal for a
 * subscription against PAYPAL_PLAN_ID, swaps the placeholder
 * subscriptionId for PayPal's I-XXXX once we have it, and returns the
 * PayPal approveUrl so the client can redirect the buyer.
 *
 * The activation transition (initialized -> active +
 * Tool.listingStatus = 'paid-active') happens via the
 * BILLING.SUBSCRIPTION.ACTIVATED webhook, with /api/subscriptions/
 * status as the polling self-heal safety net.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const auth = await requireUser();
    if (auth.kind !== "ok") {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    const body = await req.json();
    const { toolId } = bodySchema.parse(body);

    const tool = await Tool.findById(toolId);
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
      return NextResponse.json(
        { error: "You can only subscribe for tools you own." },
        { status: 403 },
      );
    }

    const existingActive = await Subscription.findOne({
      toolId: tool._id,
      status: { $in: ["active", "paused"] },
    });
    if (existingActive) {
      return NextResponse.json(
        {
          error: "This tool already has an active subscription.",
          subscriptionId: existingActive.subscriptionId,
        },
        { status: 409 },
      );
    }

    // Retry flow: if the user has an initialized subscription for
    // this tool (either provider — they may be switching from
    // Cashfree to PayPal after abandoning checkout), delete it and
    // create fresh. PayPal's approval URL is single-use; reusing
    // the stale Mongo row would mean issuing a new approval link
    // anyway, and PayPal subs that never reach ACTIVE expire on
    // their side.
    const abandoned = await Subscription.deleteMany({
      toolId: tool._id,
      userId: auth.userId,
      status: "initialized",
    });
    if (abandoned.deletedCount > 0) {
      console.log("[paypal-sub-create] cleaned abandoned initialized rows", {
        toolId: String(tool._id),
        userId: auth.userId,
        count: abandoned.deletedCount,
      });
    }

    // Pre-generate an ObjectId so the placeholder subscriptionId is
    // unique on insert. Replaced with PayPal's I-XXXX after the
    // createSubscription call returns.
    const dbId = new mongoose.Types.ObjectId();
    const placeholder = `paypal_pending_${dbId.toString()}_${Date.now()}`;

    const sub = await Subscription.create({
      _id: dbId,
      userId: auth.userId,
      toolId: tool._id,
      provider: "paypal",
      planId: process.env.PAYPAL_PLAN_ID || "paypal-monthly",
      subscriptionId: placeholder,
      amount: 1000, // $10 in cents
      currency: "USD",
      status: "initialized",
      billingCycle: "monthly",
      paypalMode: getPaypalMode(),
    });

    const origin = siteOrigin(req);
    try {
      const created = await createSubscription({
        userId: auth.userId,
        customId: String(sub._id),
        // PayPal automatically appends ?subscription_id=I-XXX&ba_token=…
        // &token=… to the return_url on approval, so we don't add our
        // own subscription_id template (which PayPal wouldn't
        // substitute anyway). The existing /subscription/return page
        // reads `subscription_id`.
        returnUrl: `${origin}/subscription/return?provider=paypal`,
        cancelUrl: `${origin}/subscription/cancel?provider=paypal`,
      });

      sub.subscriptionId = created.id;
      sub.paypalSubscriptionId = created.id;
      sub.metadata = { createResponse: created.raw as unknown as Record<string, unknown> };
      await sub.save();

      return NextResponse.json({
        subscriptionId: created.id,
        subscriptionDbId: String(sub._id),
        approveUrl: created.approveUrl,
        amount: 1000,
        currency: "USD",
        provider: "paypal",
      });
    } catch (err) {
      // PayPal failure: delete the placeholder row so the next retry
      // doesn't trip the active-sub check or leak orphans.
      try {
        await Subscription.deleteOne({ _id: sub._id });
      } catch (delErr) {
        console.error("[paypal-sub-create] orphan cleanup failed:", delErr);
      }
      if (err instanceof PayPalError) {
        console.error("[paypal-sub-create] paypal error:", {
          httpStatus: err.httpStatus,
          paypalCode: err.paypalCode,
          message: err.message,
        });
        return errorResponse(`PayPal subscription create failed: ${err.message}`, 502);
      }
      throw err;
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 400 },
      );
    }
    console.error("paypal/create-subscription error:", err);
    return errorResponse("Failed to create PayPal subscription", 500);
  }
}
