import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/app/api/lib/db";
import { requireAdmin, adminErrorResponse } from "@/app/api/lib/admin";
import { errorResponse } from "@/app/api/lib/auth";
import { Subscription } from "@/app/api/models/Subscription";
import { Tool } from "@/app/api/models/Tool";

const bodySchema = z.object({ extraDays: z.number().int().positive().max(365) });

/**
 * POST /api/admin/subscriptions/[id]/extend
 *
 * Goodwill / comp extension — pushes `nextBillingDate` and
 * `currentPeriodEnd` out by extraDays without taking a payment.
 * Also re-publishes the tool if it was hidden.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    await requireAdmin(req);
    const { id } = await params;
    const { extraDays } = bodySchema.parse(await req.json());

    const sub = await Subscription.findById(id);
    if (!sub) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    const baseNext = sub.nextBillingDate && sub.nextBillingDate > new Date() ? sub.nextBillingDate : new Date();
    const newNext = new Date(baseNext.getTime() + extraDays * 24 * 60 * 60 * 1000);
    sub.nextBillingDate = newNext;
    sub.currentPeriodEnd = newNext;

    // If the sub had auto-failed, treat the extension as a reactivation.
    if (sub.status === "failed" || sub.status === "expired") {
      sub.status = "active";
      sub.failedRenewalCount = 0;
    }

    sub.metadata = {
      ...(sub.metadata || {}),
      adminExtensions: [
        ...(((sub.metadata as Record<string, unknown>)?.adminExtensions as unknown[]) || []),
        { at: new Date().toISOString(), extraDays, newNextBillingDate: newNext },
      ],
    };
    await sub.save();

    // Re-publish the linked tool.
    await Tool.findByIdAndUpdate(sub.toolId, {
      $set: { listingStatus: "paid-active" },
    });

    return NextResponse.json({ ok: true, newNextBillingDate: newNext });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: "Validation failed", details: err.errors }, { status: 400 });
    }
    const adminErr = adminErrorResponse(err);
    if (adminErr) return adminErr;
    console.error("admin/subscriptions/extend error:", err);
    return errorResponse("Failed to extend", 500);
  }
}
