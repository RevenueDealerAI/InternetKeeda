import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/app/api/lib/db";
import { requireAdmin, adminErrorResponse } from "@/app/api/lib/admin";
import { errorResponse } from "@/app/api/lib/auth";
import { Tool } from "@/app/api/models/Tool";
import { User } from "@/app/api/models/User";

/**
 * GET /api/admin/tools/pending?page=&limit=
 *
 * Returns tools awaiting moderation review (status: "pending"),
 * newest first. Each row includes owner email + display name so the
 * moderation UI can show who submitted what without a second round-
 * trip.
 */
export async function GET(req: NextRequest) {
  try {
    await connectDB();
    await requireAdmin(req);

    const url = new URL(req.url);
    const page = Math.max(1, Number(url.searchParams.get("page") || "1"));
    const limit = Math.min(
      100,
      Math.max(1, Number(url.searchParams.get("limit") || "20")),
    );
    const skip = (page - 1) * limit;

    // Seeded tools are pre-approved by definition (the 5,000
    // imported from the original CodeCanyon scrape). Excluding
    // them keeps the moderation queue to actual user submissions —
    // a few of the seeded rows have status:"pending" left over
    // from the import and shouldn't compete for the admin's time.
    const filter = { status: "pending", seededTool: { $ne: true } };

    const [items, total] = await Promise.all([
      Tool.find(filter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Tool.countDocuments(filter),
    ]);

    const ownerIds = Array.from(
      new Set(items.map((t) => t.ownerUserId).filter((x): x is string => !!x)),
    );
    const owners = ownerIds.length
      ? await User.find({ clerkId: { $in: ownerIds } })
          .select("clerkId email firstName lastName")
          .lean()
      : [];
    const ownerMap = new Map(owners.map((u) => [u.clerkId, u]));

    return NextResponse.json({
      page,
      limit,
      total,
      items: items.map((t) => {
        const owner = t.ownerUserId ? ownerMap.get(t.ownerUserId) : undefined;
        return {
          id: String(t._id),
          name: t.name,
          slug: t.slug,
          description: t.description,
          description_ai: t.description_ai,
          websiteUrl: t.websiteUrl,
          category: t.category,
          logo: t.logo,
          status: t.status,
          listingStatus: t.listingStatus,
          ownerUserId: t.ownerUserId,
          ownerEmail: owner?.email,
          ownerName: owner ? `${owner.firstName} ${owner.lastName}`.trim() || undefined : undefined,
          createdAt: t.createdAt,
        };
      }),
    });
  } catch (err) {
    const adminErr = adminErrorResponse(err);
    if (adminErr) return adminErr;
    console.error("admin/tools/pending error:", err);
    return errorResponse("Failed to list pending tools", 500);
  }
}
