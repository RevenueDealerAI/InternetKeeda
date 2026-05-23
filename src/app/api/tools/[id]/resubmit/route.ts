import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/app/api/lib/db";
import { requireAuth, errorResponse } from "@/app/api/lib/auth";
import { Tool } from "@/app/api/models/Tool";
import { Category } from "@/app/api/models/Category";

const bodySchema = z.object({
  name: z.string().min(2).max(120),
  websiteUrl: z.string().url(),
  description: z.string().min(20).max(2000),
  category: z.string().min(2).max(80),
});

/**
 * POST /api/tools/[id]/resubmit
 *
 * Owner-initiated re-submission of a tool the admin rejected. Lets the
 * user fix what was wrong (name/url/description/category) and put the
 * tool back into the moderation queue.
 *
 * Guards:
 *   - Auth required
 *   - Must own the tool (ownerUserId === auth.userId)
 *   - Tool must currently be in "rejected" status
 *
 * Side effects:
 *   - status → "pending"
 *   - rejectionReason / rejectedAt cleared
 *   - listingStatus, ownerUserId, _id, slug, payment history untouched
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const auth = await requireAuth(req);
    const { id } = await params;
    const data = bodySchema.parse(await req.json());

    const cat = await Category.findOne({ slug: data.category, isActive: { $ne: false } })
      .select("name slug")
      .lean();
    if (!cat) {
      return NextResponse.json(
        { error: `Category "${data.category}" is not a valid category.` },
        { status: 400 },
      );
    }

    const tool = await Tool.findOneAndUpdate(
      {
        _id: id,
        ownerUserId: auth.userId,
        status: "rejected",
      },
      {
        $set: {
          name: data.name,
          websiteUrl: data.websiteUrl,
          description: data.description,
          category: cat.name,
          status: "pending",
        },
        $unset: {
          rejectionReason: "",
          rejectedAt: "",
        },
      },
      { new: true },
    );

    if (!tool) {
      const existing = await Tool.findById(id).select("status ownerUserId").lean();
      if (!existing) {
        return NextResponse.json({ error: "Tool not found" }, { status: 404 });
      }
      if (existing.ownerUserId !== auth.userId) {
        return NextResponse.json({ error: "Not your tool" }, { status: 403 });
      }
      return NextResponse.json(
        {
          error: `Tool is not in rejected state (current: ${existing.status}).`,
          status: existing.status,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      ok: true,
      id: String(tool._id),
      status: tool.status,
    });
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
    console.error("tools/resubmit error:", err);
    return errorResponse("Failed to resubmit tool", 500);
  }
}
