import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/app/api/lib/db";
import { requireAuth, errorResponse } from "@/app/api/lib/auth";
import { Subscription } from "@/app/api/models/Subscription";
import { getCashfreeClient } from "@/lib/cashfree";

const bodySchema = z.object({
  subscriptionId: z.string().min(1),
});

/**
 * POST /api/subscriptions/cancel
 *
 * Initiates cancellation. The actual status flip to 'cancelled' lands
 * via the SUBSCRIPTION_CANCELLED webhook (which also flips the tool
 * to unpaid-hidden). We don't write status here.
 */
export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const auth = await requireAuth(req);
    const { subscriptionId } = bodySchema.parse(await req.json());

    const sub = await Subscription.findOne({ subscriptionId });
    if (!sub) {
      return NextResponse.json({ error: "Subscription not found" }, { status: 404 });
    }
    if (sub.userId !== auth.userId) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
      const cf = getCashfreeClient();
      // The SDK's manage method handles cancel via the action field.
      // CF uses a PATCH /subscriptions/{id}/manage with action: "CANCEL".
      // We use the raw axios path since the SDK method name varies by
      // version — direct call is robust.
      await cf.axios.patch(
        `${cf.basePath}/subscriptions/${subscriptionId}/manage`,
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
        cancelRequestedAt: new Date().toISOString(),
      };
      await sub.save();

      return NextResponse.json({
        ok: true,
        note: "Cancellation requested. The webhook will mark it cancelled and unlist your tool.",
      });
    } catch (cfErr) {
      console.error("Cashfree cancel failed:", cfErr);
      return errorResponse("Cashfree cancellation failed", 502);
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
    console.error("subscriptions/cancel error:", err);
    return errorResponse("Failed to cancel", 500);
  }
}
