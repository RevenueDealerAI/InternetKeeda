import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/lib/db";
import { requireAuth, errorResponse } from "@/app/api/lib/auth";
import { Tool } from "@/app/api/models/Tool";

/**
 * GET /api/tools/mine
 *
 * Returns the signed-in user's submitted tools. Used by the dashboard
 * "My Tools" tab.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    const auth = await requireAuth(req);

    // ?deletedOnly=true → return only soft-deleted rows (powers the
    // "Show deleted" tab on /dashboard/my-tools).
    // Default → return only live rows (the dashboard's primary view).
    // No ?includeDeleted flag — the two views render as separate lists,
    // so a single endpoint with a one-or-the-other switch keeps the
    // contract obvious instead of mixing both in one response.
    const deletedOnly = req.nextUrl.searchParams.get("deletedOnly") === "true";
    const filter = deletedOnly
      ? {
          ownerUserId: auth.userId,
          deletedAt: { $ne: null, $exists: true },
        }
      : {
          ownerUserId: auth.userId,
          $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
        };
    const tools = await Tool.find(filter)
      .sort({ createdAt: -1 })
      .lean();

    return NextResponse.json({
      tools: tools.map((t) => ({
        id: String(t._id),
        name: t.name,
        slug: t.slug,
        logo: t.logo,
        category: t.category,
        description: t.description,
        websiteUrl: t.websiteUrl,
        status: t.status,
        listingStatus: t.listingStatus,
        activeBoosts: t.activeBoosts || [],
        boostExpiresAt: t.boostExpiresAt || {},
        rejectionReason: t.rejectionReason,
        rejectedAt: t.rejectedAt,
        createdAt: t.createdAt,
        deletedAt: t.deletedAt ?? undefined,
      })),
    });
  } catch (err) {
    if (err instanceof Error && err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    console.error("tools/mine error:", err);
    return errorResponse("Failed to fetch your tools", 500);
  }
}
