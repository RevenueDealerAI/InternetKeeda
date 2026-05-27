import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { z } from "zod";
import { connectDB } from "@/app/api/lib/db";
import { errorResponse } from "@/app/api/lib/auth";
import { requireUser } from "@/lib/auth/user";
import { Tool } from "@/app/api/models/Tool";
import { Payment } from "@/app/api/models/Payment";
import { createOneTimeOrder, PayPalError } from "@/lib/paypal";

const bodySchema = z.object({
  toolId: z.string().min(1, "toolId is required"),
  productType: z.enum([
    "boost-category-top",
    "boost-home-rotation",
    "boost-featured-badge",
  ]),
});

/**
 * USD pricing for PayPal boost orders.
 *
 * Cashfree boosts run on INR (999 / 2499 / 4999 ₹). The PayPal flow
 * is for international buyers paying in USD; rather than apply a
 * volatile FX rate, USD prices are picked to roughly track the INR
 * tier ratio (1 : 2.5 : 5) while staying memorable. Update here if
 * the user changes the dollar pricing — the Cashfree paise constants
 * in lib/cashfree.ts stay independent.
 */
const PAYPAL_BOOST_PRICING: Record<
  "boost-category-top" | "boost-home-rotation" | "boost-featured-badge",
  { amountUsd: number; days: number; label: string }
> = {
  "boost-category-top": { amountUsd: 12, days: 7, label: "Category Top boost" },
  "boost-home-rotation": { amountUsd: 30, days: 7, label: "Home Rotation boost" },
  "boost-featured-badge": { amountUsd: 60, days: 30, label: "Featured Badge boost" },
};

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
 * POST /api/payments/paypal/create-boost-order
 *
 * PayPal counterpart of /api/payments/boost/create (Cashfree). One-
 * time order against PAYPAL USD pricing. Creates the Mongo Payment
 * row in 'pending' state, calls /v2/checkout/orders, returns the
 * approveUrl. Capture happens on the return page via
 * /api/payments/paypal/capture-boost-order.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const auth = await requireUser();
    if (auth.kind !== "ok") {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    const body = await req.json();
    const { toolId, productType } = bodySchema.parse(body);
    const pricing = PAYPAL_BOOST_PRICING[productType];

    const tool = await Tool.findById(toolId);
    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }
    if (tool.seededTool) {
      return NextResponse.json(
        { error: "Seeded tools are grandfathered free and cannot purchase boosts." },
        { status: 400 },
      );
    }
    if (tool.ownerUserId !== auth.userId) {
      return NextResponse.json(
        { error: "You can only boost tools you own." },
        { status: 403 },
      );
    }

    // Pre-insert the Payment row with a placeholder orderId, then
    // swap in PayPal's id after createOneTimeOrder returns. Matches
    // the create-then-call pattern used by the Cashfree path so we
    // never lose the receipt if the upstream call fails.
    const dbId = new mongoose.Types.ObjectId();
    const placeholder = `paypal_pending_${dbId.toString()}_${Date.now()}`;

    const payment = await Payment.create({
      _id: dbId,
      userId: auth.userId,
      toolId: tool._id,
      provider: "paypal",
      orderId: placeholder,
      amount: pricing.amountUsd * 100, // store as cents
      currency: "USD",
      productType,
      boostDurationDays: pricing.days,
      status: "pending",
    });

    const origin = siteOrigin(req);
    try {
      const created = await createOneTimeOrder({
        amountUsd: pricing.amountUsd,
        description: `${pricing.label} for ${tool.name}`,
        customId: String(payment._id),
        referenceId: productType,
        returnUrl: `${origin}/payment/return?provider=paypal&payment_db_id=${String(payment._id)}`,
        cancelUrl: `${origin}/payment/return?provider=paypal&cancelled=1&payment_db_id=${String(payment._id)}`,
      });

      payment.orderId = created.id;
      payment.paypalOrderId = created.id;
      payment.metadata = { createResponse: created.raw as unknown as Record<string, unknown> };
      await payment.save();

      return NextResponse.json({
        orderId: created.id,
        paymentDbId: String(payment._id),
        approveUrl: created.approveUrl,
        amount: pricing.amountUsd * 100,
        currency: "USD",
        productType,
        boostDurationDays: pricing.days,
        provider: "paypal",
      });
    } catch (err) {
      payment.status = "failed";
      payment.metadata = {
        error: err instanceof Error ? err.message : String(err),
      };
      await payment.save();
      if (err instanceof PayPalError) {
        console.error("[paypal-boost-create] paypal error:", {
          httpStatus: err.httpStatus,
          paypalCode: err.paypalCode,
          message: err.message,
        });
        return errorResponse(`PayPal order create failed: ${err.message}`, 502);
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
    console.error("paypal/create-boost-order error:", err);
    return errorResponse("Failed to create PayPal boost order", 500);
  }
}
