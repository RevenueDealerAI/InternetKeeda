import { NextRequest, NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";
import { connectDB } from "@/app/api/lib/db";
import { requireAdmin, adminErrorResponse } from "@/app/api/lib/admin";
import { errorResponse } from "@/app/api/lib/auth";
import { Tool } from "@/app/api/models/Tool";
import { Subscription } from "@/app/api/models/Subscription";
import { Category } from "@/app/api/models/Category";
import { getCashfreeClient } from "@/lib/cashfree";

/**
 * DELETE /api/admin/tools/[id]
 *
 * SOFT delete. Sets tool.deletedAt = now and cancels any active
 * subscription via Cashfree. Payment + subscription rows stay in
 * Mongo for financial audit. Restore endpoint: POST .../restore.
 *
 * Replaces the legacy DELETE on /api/tools/[id] which had two
 * bugs: requireAuth (any signed-in user could delete) and no
 * subscription cleanup (orphaned Cashfree subscriptions).
 *
 * Accepts EITHER an ObjectId or a slug as the route param.
 */
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    await requireAdmin(req);
    const { id } = await params;

    // Lookup by ObjectId first, fall back to slug — mirrors the
    // GET handler at /api/tools/[id] which accepts both.
    const isObjectId = mongoose.Types.ObjectId.isValid(id);
    const tool = isObjectId
      ? await Tool.findById(id)
      : await Tool.findOne({ slug: id });

    if (!tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }
    if (tool.deletedAt) {
      return NextResponse.json(
        { error: "Tool already deleted", deletedAt: tool.deletedAt },
        { status: 409 },
      );
    }

    // Cancel any in-flight subscriptions on this tool via Cashfree
    // before flipping the soft-delete flag. If the Cashfree call
    // fails we still mark the row cancelled so admin's view is
    // consistent — the Subs cron will retry the real-status sync.
    const activeSubs = await Subscription.find({
      toolId: tool._id,
      status: { $in: ["initialized", "active", "paused"] },
    });

    const cancelResults: Array<{ subscriptionId: string; ok: boolean; error?: string }> = [];
    if (activeSubs.length > 0) {
      const cf = getCashfreeClient();
      for (const sub of activeSubs) {
        try {
          await cf.axios.patch(
            `${cf.basePath}/subscriptions/${sub.subscriptionId}/manage`,
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
          cancelResults.push({ subscriptionId: sub.subscriptionId, ok: true });
        } catch (cfErr) {
          const msg = cfErr instanceof Error ? cfErr.message : String(cfErr);
          cancelResults.push({ subscriptionId: sub.subscriptionId, ok: false, error: msg });
          console.warn("[admin/tools/delete] cf cancel failed", sub.subscriptionId, msg);
        }
        // Mark cancelled regardless of CF result — webhook will
        // confirm the real status. Avoids the admin UI showing the
        // tool as "delete failed" because of a transient CF blip.
        sub.status = "cancelled";
        sub.cancelledAt = new Date();
        sub.metadata = {
          ...(sub.metadata || {}),
          adminDeleteCancel: { at: new Date().toISOString() },
        };
        await sub.save();
      }
    }

    tool.deletedAt = new Date();
    tool.listingStatus = "unpaid-hidden";
    await tool.save();

    // Cache-bust the public category page so the removed tool
    // disappears immediately. Look up the slug from the canonical
    // name we stored on the tool.
    if (tool.category) {
      const cat = await Category.findOne({ name: tool.category }).select("slug").lean();
      if (cat?.slug) {
        try {
          revalidatePath(`/category/${cat.slug}`);
        } catch (e) {
          console.warn("[admin/tools/delete] revalidatePath failed", e);
        }
      }
    }

    return NextResponse.json({
      ok: true,
      id: String(tool._id),
      deletedAt: tool.deletedAt,
      cancelledSubscriptions: cancelResults,
    });
  } catch (err) {
    const adminErr = adminErrorResponse(err);
    if (adminErr) return adminErr;
    console.error("admin/tools/delete error:", err);
    return errorResponse("Failed to delete tool", 500);
  }
}
