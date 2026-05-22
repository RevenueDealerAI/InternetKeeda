import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/app/api/lib/db";
import { requireAuth, errorResponse, getAuth } from "@/app/api/lib/auth";
import { Tool } from "@/app/api/models/Tool";
import { Subscription } from "@/app/api/models/Subscription";
import { getCashfreeClient, PRICING } from "@/lib/cashfree";

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
 * Creates a Cashfree subscription for the ₹499/month listing fee.
 * The flow:
 *   1. Validate user owns the tool, no active sub exists for it
 *   2. Insert Subscription row (status: 'initialized')
 *   3. Call Cashfree SubsCreateSubscription with PLAN inlined
 *   4. Return { authLink, subscriptionId } so the frontend can
 *      redirect the user to Cashfree's authorization page
 *
 * The actual status flip to 'active' happens via the
 * SUBSCRIPTION_ACTIVATED webhook — Tool.listingStatus moves to
 * 'paid-active' at the same time, which is when the tool becomes
 * publicly visible.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const auth = await requireAuth(req);
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
      status: { $in: ["initialized", "active", "paused"] },
    });
    if (existingActive) {
      return NextResponse.json(
        {
          error: "This tool already has an active or pending subscription.",
          subscriptionId: existingActive.subscriptionId,
        },
        { status: 409 },
      );
    }

    // DB row first so we have a stable id to embed in subscription_id.
    const sub = await Subscription.create({
      userId: auth.userId,
      toolId: tool._id,
      planId: "monthly-listing-499",
      subscriptionId: "pending", // backfilled below
      amount: PRICING.MONTHLY_LISTING_PAISE,
      currency: "INR",
      status: "initialized",
      billingCycle: "monthly",
    });

    const subscriptionId = `sub_${sub._id.toString()}_${Date.now()}`;

    const clerkUser = await getAuth();
    const customerEmail =
      clerkUser?.emailAddresses?.[0]?.emailAddress ||
      `${auth.userId}@no-email.internetkeeda.com`;
    const customerPhone =
      clerkUser?.phoneNumbers?.[0]?.phoneNumber?.replace(/^\+91/, "") ||
      "9999999999";
    const customerName =
      `${clerkUser?.firstName ?? ""} ${clerkUser?.lastName ?? ""}`.trim() ||
      undefined;

    const origin = siteOrigin(req);
    const planAmountRupees = PRICING.MONTHLY_LISTING_PAISE / 100;
    const planMaxAmountRupees = planAmountRupees * 2; // headroom for future price increases

    try {
      const cf = getCashfreeClient();
      const cfResp = await cf.SubsCreateSubscription({
        subscription_id: subscriptionId,
        customer_details: {
          customer_email: customerEmail,
          customer_phone: customerPhone,
          ...(customerName ? { customer_name: customerName } : {}),
        },
        plan_details: {
          plan_id: "monthly-listing-499",
          plan_name: "Monthly Tool Listing",
          plan_type: "PERIODIC",
          plan_currency: "INR",
          plan_amount: planAmountRupees,
          plan_max_amount: planMaxAmountRupees,
          plan_max_cycles: 0, // 0 = unlimited
          plan_intervals: 1,
          plan_interval_type: "MONTH",
        },
        subscription_meta: {
          return_url: `${origin}/subscription/return?subscription_id={subscription_id}`,
        },
      });

      const data = cfResp.data as {
        subscription_session_id?: string;
        authorisation_details?: { authorisation_link?: string };
        auth_link?: string;
      };

      const authLink =
        data.authorisation_details?.authorisation_link ||
        data.auth_link ||
        undefined;

      sub.subscriptionId = subscriptionId;
      sub.metadata = { createResponse: cfResp.data };
      await sub.save();

      return NextResponse.json({
        subscriptionId,
        subscriptionDbId: String(sub._id),
        authLink,
        sessionId: data.subscription_session_id,
        amount: PRICING.MONTHLY_LISTING_PAISE,
        currency: "INR",
        mode: process.env.CASHFREE_MODE === "PROD" ? "production" : "sandbox",
      });
    } catch (cfErr) {
      sub.status = "failed";
      sub.metadata = {
        error: cfErr instanceof Error ? cfErr.message : String(cfErr),
      };
      await sub.save();
      console.error("Cashfree SubsCreateSubscription failed:", cfErr);
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
    console.error("subscriptions/create error:", err);
    return errorResponse("Failed to create subscription", 500);
  }
}
