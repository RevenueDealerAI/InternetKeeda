import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/app/api/lib/db";
import { requireAuth, errorResponse, getAuth } from "@/app/api/lib/auth";
import { Tool } from "@/app/api/models/Tool";
import { Payment } from "@/app/api/models/Payment";
import {
  getCashfreeClient,
  getBoostPricing,
  type BoostProductType,
} from "@/lib/cashfree";

const bodySchema = z.object({
  toolId: z.string().min(1, "toolId is required"),
  productType: z.enum([
    "boost-category-top",
    "boost-home-rotation",
    "boost-featured-badge",
  ]),
});

function siteOrigin(req: NextRequest): string {
  // Prefer the explicit env (Vercel) so return_url + notify_url are
  // stable and don't pick up preview-deploy hosts. Fall back to the
  // request origin for local dev.
  const env =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, "");
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const auth = await requireAuth(req);
    const body = await req.json();
    const { toolId, productType } = bodySchema.parse(body);

    const tool = await Tool.findById(toolId);
    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }
    if (tool.seededTool) {
      return NextResponse.json(
        {
          error:
            "Seeded tools are grandfathered free and cannot purchase boosts.",
        },
        { status: 400 },
      );
    }
    if (tool.ownerUserId !== auth.userId) {
      return NextResponse.json(
        { error: "You can only boost tools you own." },
        { status: 403 },
      );
    }

    const pricing = getBoostPricing(productType as BoostProductType);

    // Create the Payment row first so we have a stable DB id to embed
    // in the Cashfree order_id. If Cashfree fails we leave a pending
    // row behind that the admin can sweep, rather than calling CF and
    // then losing the receipt.
    const payment = await Payment.create({
      userId: auth.userId,
      toolId: tool._id,
      orderId: "pending", // backfilled below
      amount: pricing.paise,
      currency: "INR",
      productType,
      boostDurationDays: pricing.days,
      status: "pending",
    });

    const orderId = `boost_${payment._id.toString()}_${Date.now()}`;

    // Cashfree expects rupees, not paise. We store paise internally
    // for accuracy and convert once at the API boundary.
    const orderAmountRupees = Math.round(pricing.paise) / 100;

    // Pull customer info from Clerk. Cashfree requires phone — fall
    // back to a placeholder if the user hasn't set one. Sandbox accepts
    // 9999999999; in prod the user will be prompted to update their
    // profile after the first failed attempt.
    const clerkUser = await getAuth();
    const customerEmail =
      clerkUser?.emailAddresses?.[0]?.emailAddress || `${auth.userId}@no-email.internetkeeda.com`;
    const customerPhone =
      clerkUser?.phoneNumbers?.[0]?.phoneNumber?.replace(/^\+91/, "") ||
      "9999999999";
    const customerName =
      `${clerkUser?.firstName ?? ""} ${clerkUser?.lastName ?? ""}`.trim() ||
      undefined;

    const origin = siteOrigin(req);

    try {
      const cf = getCashfreeClient();
      const cfResp = await cf.PGCreateOrder({
        order_id: orderId,
        order_amount: orderAmountRupees,
        order_currency: "INR",
        customer_details: {
          customer_id: auth.userId,
          customer_email: customerEmail,
          customer_phone: customerPhone,
          ...(customerName ? { customer_name: customerName } : {}),
        },
        order_meta: {
          return_url: `${origin}/payment/return?order_id={order_id}`,
          notify_url: `${origin}/api/webhooks/cashfree-pg`,
        },
        order_note: `Boost ${productType} for tool ${tool.name}`,
        order_tags: {
          productType,
          toolId: String(tool._id),
          paymentDbId: String(payment._id),
        },
      });

      const paymentSessionId = (cfResp.data as { payment_session_id?: string })
        .payment_session_id;
      const cfOrderStatus = (cfResp.data as { order_status?: string })
        .order_status;

      payment.orderId = orderId;
      payment.paymentSessionId = paymentSessionId;
      payment.cashfreeOrderStatus = cfOrderStatus;
      payment.metadata = { createOrderResponse: cfResp.data };
      await payment.save();

      return NextResponse.json({
        paymentSessionId,
        orderId,
        paymentDbId: String(payment._id),
        amount: pricing.paise,
        currency: "INR",
        productType,
        boostDurationDays: pricing.days,
        // The Cashfree JS SDK uses this to know which environment to
        // hit. Mirror it so the client doesn't have to read env vars.
        mode: process.env.CASHFREE_MODE === "PROD" ? "production" : "sandbox",
      });
    } catch (cfErr) {
      // CF failure: mark the row as failed so we don't leak pending
      // entries forever. The admin still sees it in the payments table.
      payment.status = "failed";
      payment.metadata = {
        error: cfErr instanceof Error ? cfErr.message : String(cfErr),
      };
      await payment.save();
      console.error("Cashfree PGCreateOrder failed:", cfErr);
      return errorResponse("Failed to create Cashfree order", 502);
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
    console.error("boost/create error:", err);
    return errorResponse("Failed to create boost", 500);
  }
}

