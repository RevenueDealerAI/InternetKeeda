import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/app/api/lib/db";
import { requireAdmin, adminErrorResponse } from "@/app/api/lib/admin";
import { errorResponse } from "@/app/api/lib/auth";
import { Payment } from "@/app/api/models/Payment";
import { Tool } from "@/app/api/models/Tool";
import { boostSlotFor } from "@/lib/cashfree";

const bodySchema = z.object({
  extraDays: z.number().int().positive().max(365),
});

/**
 * POST /api/admin/payments/[id]/extend-boost
 *
 * Comp / goodwill extension. Pushes `boostExpiresAt[slot]` out by N
 * days (without taking a new payment). The corresponding boost slot
 * is also re-added to activeBoosts in case it had already expired.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    await requireAdmin(req);
    const { id } = await params;

    const body = await req.json();
    const { extraDays } = bodySchema.parse(body);

    const payment = await Payment.findById(id);
    if (!payment) {
      return NextResponse.json({ error: "Payment not found" }, { status: 404 });
    }
    if (payment.status !== "success") {
      return NextResponse.json(
        { error: "Only successful payments can be extended." },
        { status: 400 },
      );
    }

    const tool = await Tool.findById(payment.toolId);
    if (!tool) {
      return NextResponse.json(
        { error: "Tool linked to this payment is gone." },
        { status: 404 },
      );
    }

    const slot = boostSlotFor(payment.productType);
    const current = tool.boostExpiresAt?.[slot];
    const base = current && current > new Date() ? current : new Date();
    const newExpiry = new Date(
      base.getTime() + extraDays * 24 * 60 * 60 * 1000,
    );

    await Tool.findByIdAndUpdate(payment.toolId, {
      $addToSet: { activeBoosts: slot },
      $set: { [`boostExpiresAt.${slot}`]: newExpiry },
    });

    payment.metadata = {
      ...(payment.metadata || {}),
      adminExtensions: [
        ...(((payment.metadata as Record<string, unknown>)?.adminExtensions as unknown[]) || []),
        { at: new Date().toISOString(), extraDays, newExpiry },
      ],
    };
    await payment.save();

    return NextResponse.json({
      ok: true,
      slot,
      newExpiry,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 400 },
      );
    }
    const adminErr = adminErrorResponse(err);
    if (adminErr) return adminErr;
    console.error("admin extend-boost error:", err);
    return errorResponse("Failed to extend boost", 500);
  }
}
