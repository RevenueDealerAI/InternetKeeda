import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/lib/db";
import { requireAdmin, adminErrorResponse } from "@/app/api/lib/admin";
import { errorResponse } from "@/app/api/lib/auth";
import { Payment } from "@/app/api/models/Payment";

/**
 * GET /api/admin/revenue/series?days=30
 *
 * Returns a daily revenue series for the last N days. Each item is
 * { date: "YYYY-MM-DD", paise: number, count: number }. Days with
 * zero revenue are included so the chart renders a continuous line
 * instead of jumping across gaps.
 *
 * Read-only aggregate on Payment — does not touch the self-heal /
 * webhook paths the brief flags as off-limits.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(req);

    const days = Math.min(
      90,
      Math.max(1, Number(new URL(req.url).searchParams.get("days") || "30")),
    );

    const since = new Date();
    since.setHours(0, 0, 0, 0);
    since.setDate(since.getDate() - (days - 1));

    const rows = await Payment.aggregate([
      { $match: { status: "success", paidAt: { $gte: since } } },
      {
        $group: {
          _id: {
            $dateToString: { format: "%Y-%m-%d", date: "$paidAt" },
          },
          paise: { $sum: "$amount" },
          count: { $sum: 1 },
        },
      },
    ]);

    const map = new Map<string, { paise: number; count: number }>();
    for (const r of rows) map.set(r._id, { paise: r.paise, count: r.count });

    const series: { date: string; paise: number; count: number }[] = [];
    for (let i = 0; i < days; i++) {
      const d = new Date(since);
      d.setDate(since.getDate() + i);
      const key = d.toISOString().slice(0, 10);
      const row = map.get(key) ?? { paise: 0, count: 0 };
      series.push({ date: key, paise: row.paise, count: row.count });
    }

    return NextResponse.json({ days, series });
  } catch (err) {
    const adminErr = adminErrorResponse(err);
    if (adminErr) return adminErr;
    console.error("admin/revenue/series error:", err);
    return errorResponse("Failed to fetch revenue series", 500);
  }
}
