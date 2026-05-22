import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/lib/db";
import { requireAdmin, adminErrorResponse } from "@/app/api/lib/admin";
import { errorResponse } from "@/app/api/lib/auth";
import { Subscription } from "@/app/api/models/Subscription";
import { getCashfreeClient } from "@/lib/cashfree";

/**
 * POST /api/admin/subscriptions/[id]/cancel
 *
 * Admin-initiated cancel. The webhook flips the status row and
 * unlists the tool — we don't write status here.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    await requireAdmin(req);
    const { id } = await params;

    const sub = await Subscription.findById(id);
    if (!sub) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }

    try {
      const cf = getCashfreeClient();
      await cf.axios.patch(
        `${cf.basePath}/subscriptions/${sub.subscriptionId}/manage`,
        { action: "CANCEL" },
        {
          headers: {
            "x-client-id": cf.XClientId,
            "x-client-secret": cf.XClientSecret,
            "x-api-version": cf.XApiVersion,
            "Content-Type": "application/json",
          },
        },
      );

      sub.metadata = {
        ...(sub.metadata || {}),
        adminCancel: { at: new Date().toISOString() },
      };
      await sub.save();

      return NextResponse.json({ ok: true });
    } catch (cfErr) {
      console.error("admin Cashfree cancel failed:", cfErr);
      return errorResponse("Cashfree cancellation failed", 502);
    }
  } catch (err) {
    const adminErr = adminErrorResponse(err);
    if (adminErr) return adminErr;
    console.error("admin/subscriptions/cancel error:", err);
    return errorResponse("Failed to cancel", 500);
  }
}
