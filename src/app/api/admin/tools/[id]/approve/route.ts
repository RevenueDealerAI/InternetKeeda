import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/app/api/lib/db";
import { requireAdmin, adminErrorResponse } from "@/app/api/lib/admin";
import { errorResponse } from "@/app/api/lib/auth";
import { Tool } from "@/app/api/models/Tool";
import { Category } from "@/app/api/models/Category";

const bodySchema = z.object({
  category: z.string().min(2).max(80).optional(),
});

/**
 * POST /api/admin/tools/[id]/approve
 *
 * Body (optional): { category: <slug> } — if present, overrides the
 * tool's stored category before publishing. Used when the submitter
 * picked the wrong slug or the admin reclassifies on the fly.
 *
 * Sets status = "published". The tool only becomes publicly visible
 * if listingStatus is also non-unpaid (paid-active or free-seeded).
 * This is intentional — paid listings shouldn't go live until
 * Cashfree confirms the subscription.
 *
 * Idempotent on the status: filter ensures we don't keep flipping
 * already-published tools.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    await requireAdmin(req);
    const { id } = await params;
    const body = await req.json().catch(() => ({}));
    const { category } = bodySchema.parse(body);

    let slugOverride: string | undefined;
    if (category) {
      const cat = await Category.findOne({ slug: category, isActive: { $ne: false } })
        .select("slug")
        .lean();
      if (!cat) {
        return NextResponse.json(
          { error: `Category "${category}" not found or inactive.` },
          { status: 400 },
        );
      }
      slugOverride = cat.slug;
    }

    const update: Record<string, unknown> = {
      status: "published",
      rejectionReason: null,
      rejectedAt: null,
    };
    if (slugOverride) update.category = slugOverride;

    const tool = await Tool.findOneAndUpdate(
      { _id: id, status: "pending" },
      { $set: update },
      { new: true },
    );

    if (!tool) {
      // Either not found or already not in pending state. Re-fetch so
      // we can tell which.
      const existing = await Tool.findById(id).select("status").lean();
      if (!existing) {
        return NextResponse.json({ error: "Tool not found" }, { status: 404 });
      }
      return NextResponse.json(
        {
          error: `Tool is no longer pending (current status: ${existing.status}).`,
          status: existing.status,
        },
        { status: 409 },
      );
    }

    return NextResponse.json({
      ok: true,
      id: String(tool._id),
      status: tool.status,
      category: tool.category,
      listingStatus: tool.listingStatus,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: "Validation failed", details: err.errors },
        { status: 400 },
      );
    }
    const adminErr = adminErrorResponse(err);
    if (adminErr) return adminErr;
    console.error("admin/tools/approve error:", err);
    return errorResponse("Failed to approve tool", 500);
  }
}
