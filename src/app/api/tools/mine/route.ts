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

    // Exclude soft-deleted rows — once the owner deletes a pending
    // tool it should disappear from My Tools immediately. Admin can
    // still see them via /api/admin/tools?includeDeleted=true.
    const tools = await Tool.find({
      ownerUserId: auth.userId,
      $or: [{ deletedAt: null }, { deletedAt: { $exists: false } }],
    })
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
