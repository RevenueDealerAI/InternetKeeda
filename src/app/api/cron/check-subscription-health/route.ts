import { NextResponse } from "next/server";
import { connectDB } from "@/app/api/lib/db";
import { Subscription } from "@/app/api/models/Subscription";
import { getCashfreeClient } from "@/lib/cashfree";

/**
 * GET /api/cron/check-subscription-health?key=<CRON_SECRET>
 *
 * Daily reconciliation. Finds subscriptions where the next billing
 * date passed more than 3 days ago but we haven't received a
 * PAYMENT_SUCCESS webhook. Cashfree webhooks can be lossy under load;
 * this is the safety net that pulls real status from CF and updates
 * the row so the rest of the system isn't lying.
 */
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const key = new URL(req.url).searchParams.get("key");
  if (!key || key !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const threshold = new Date(Date.now() - 3 * 24 * 60 * 60 * 1000);

    const stale = await Subscription.find({
      status: "active",
      nextBillingDate: { $lt: threshold },
    }).limit(200);

    const summary = {
      checked: stale.length,
      updated: 0,
      errors: 0,
    };

    const cf = getCashfreeClient();
    for (const sub of stale) {
      try {
        const resp = await cf.SubsFetchSubscription(sub.subscriptionId);
        const data = resp.data as {
          subscription_status?: string;
          next_charge_date?: string;
          authorization_status?: string;
        };
        if (data.next_charge_date) {
          sub.nextBillingDate = new Date(data.next_charge_date);
          sub.currentPeriodEnd = sub.nextBillingDate;
        }
        if (data.authorization_status) {
          sub.authorizationStatus = data.authorization_status;
        }
        if (data.subscription_status === "CANCELLED") {
          sub.status = "cancelled";
          sub.cancelledAt = sub.cancelledAt || new Date();
        }
        sub.metadata = {
          ...(sub.metadata || {}),
          healthCheck: { at: new Date().toISOString(), data },
        };
        await sub.save();
        summary.updated += 1;
      } catch (err) {
        console.error("subscription health check failed for", sub.subscriptionId, err);
        summary.errors += 1;
      }
    }

    return NextResponse.json({ ok: true, ...summary });
  } catch (err) {
    console.error("check-subscription-health cron failed:", err);
    return NextResponse.json(
      { error: "check-subscription-health failed" },
      { status: 500 },
    );
  }
}
