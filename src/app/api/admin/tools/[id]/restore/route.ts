import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { connectDB } from "@/app/api/lib/db";
import { requireAdmin, adminErrorResponse } from "@/app/api/lib/admin";
import { errorResponse } from "@/app/api/lib/auth";
import { Tool } from "@/app/api/models/Tool";
import { Category } from "@/app/api/models/Category";

/**
 * POST /api/admin/tools/[id]/restore
 *
 * Clears `deletedAt`. The tool reappears on public listings if its
 * other gates (status="published", listingStatus paid-active /
 * free-seeded, etc.) still hold. Subscriptions cancelled during
 * delete stay cancelled — the owner can re-activate via the
 * dashboard if they want.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    await requireAdmin(req);
    const { id } = await params;

    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const tool = isObjectId
      ? await Tool.findById(id)
      : await Tool.findOne({ slug: id });

    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }
    if (!tool.deletedAt) {
      return NextResponse.json(
        { error: "Tool is not deleted" },
        { status: 409 },
      );
    }

    tool.deletedAt = undefined;
    await tool.save();

    if (tool.category) {
      const cat = await Category.findOne({ name: tool.category }).select("slug").lean();
      if (cat?.slug) {
        try {
          revalidatePath(`/category/${cat.slug}`);
        } catch (e) {
          console.warn("[admin/tools/restore] revalidatePath failed", e);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      id: String(tool._id),
      listingStatus: tool.listingStatus,
      status: tool.status,
    });
  } catch (err) {
    const adminErr = adminErrorResponse(err);
    if (adminErr) return adminErr;
    console.error("admin/tools/restore error:", err);
    return errorResponse("Failed to restore tool", 500);
  }
}
