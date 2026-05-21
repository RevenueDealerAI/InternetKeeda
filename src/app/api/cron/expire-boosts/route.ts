import { NextResponse } from "next/server";
import { connectDB } from "@/app/api/lib/db";
import { Tool } from "@/app/api/models/Tool";

/**
 * GET /api/cron/expire-boosts?key=<CRON_SECRET>
 *
 * Daily sweep. For each boost slot, find tools whose
 * boostExpiresAt[slot] is in the past and pull the slot off
 * activeBoosts. Idempotent — re-runs do nothing once everything's
 * already cleaned up.
 */
export const dynamic = "force-dynamic";

const SLOTS = [
  "category-top",
  "home-rotation",
  "featured-badge",
] as const;

export async function GET(req: Request) {
  const expected = process.env.CRON_SECRET;
  if (!expected) {
    console.error("CRON_SECRET env var not set; refusing expire-boosts.");
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const key = new URL(req.url).searchParams.get("key");
  if (!key || key !== expected) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await connectDB();
    const now = new Date();
    const summary: Record<string, number> = {};

    for (const slot of SLOTS) {
      const field = `boostExpiresAt.${slot}`;
      const res = await Tool.updateMany(
        {
          activeBoosts: slot,
          [field]: { $lt: now },
        },
        {
          $pull: { activeBoosts: slot },
          $unset: { [field]: "" },
        },
      );
      summary[slot] = res.modifiedCount;
    }

    return NextResponse.json({ ok: true, expired: summary, at: now.toISOString() });
  } catch (err) {
    console.error("expire-boosts cron failed:", err);
    return NextResponse.json(
      { error: "expire-boosts failed" },
      { status: 500 },
    );
  }
}
