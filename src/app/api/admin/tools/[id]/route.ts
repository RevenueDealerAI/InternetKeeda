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

    // Cancel any in-flight subscriptions on this tool via Cashfree.
    // The entire block is best-effort: if Cashfree env is missing,
    // the SDK throws on init, or the Subscription query errors,
    // we still proceed to the soft-delete below. A stranded Cashfree
    // subscription is a smaller problem than a tool that won't die.
    // The cron sweep at /api/cron/sync-subscription-status reconciles
    // anything we couldn't cancel here.
    const cancelResults: Array<{ subscriptionId: string; ok: boolean; error?: string }> = [];
    try {
      const activeSubs = await Subscription.find({
        toolId: tool._id,
        status: { $in: ["initialized", "active", "paused"] },
      });
      if (activeSubs.length > 0) {
        let cf: ReturnType<typeof getCashfreeClient> | null = null;
        try {
          cf = getCashfreeClient();
        } catch (cfInitErr) {
          console.warn(
            "[admin/tools/delete] cashfree client init failed — proceeding with local cancel only",
            cfInitErr instanceof Error ? cfInitErr.message : cfInitErr,
          );
        }
        for (const sub of activeSubs) {
          if (cf) {
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
          } else {
            cancelResults.push({
              subscriptionId: sub.subscriptionId,
              ok: false,
              error: "cashfree client unavailable — local cancel only",
            });
          }
          // Mark cancelled regardless of CF result — webhook will
          // confirm the real status. Avoids the admin UI showing the
          // tool as "delete failed" because of a transient CF blip.
          try {
            sub.status = "cancelled";
            sub.cancelledAt = new Date();
            sub.metadata = {
              ...(sub.metadata || {}),
              adminDeleteCancel: { at: new Date().toISOString() },
            };
            await sub.save();
          } catch (saveErr) {
            console.warn(
              "[admin/tools/delete] sub.save failed",
              sub.subscriptionId,
              saveErr instanceof Error ? saveErr.message : saveErr,
            );
          }
        }
      }
    } catch (subErr) {
      console.warn(
        "[admin/tools/delete] subscription cleanup errored — continuing to soft-delete",
        subErr instanceof Error ? subErr.message : subErr,
      );
    }

    tool.deletedAt = new Date();
    tool.listingStatus = "unpaid-hidden";
    await tool.save();
    console.log("[admin/tools/delete] soft-deleted", {
      id: String(tool._id),
      slug: tool.slug,
      category: tool.category,
      deletedAt: tool.deletedAt,
    });

    // Cache-bust every public surface that might surface this tool.
    // Without this, ISR or React-Query'd pages can keep serving the
    // deleted row for minutes. Cheap to do; revalidatePath is a no-op
    // when nothing is cached.
    const pathsToRevalidate = [
      "/",
      "/ai-tools",
      `/ai-tools/${tool.slug}`,
      "/trending",
      "/latest-launches",
      "/top-products",
      "/upcoming",
      "/search",
    ];
    if (tool.category) {
      const cat = await Category.findOne({ name: tool.category }).select("slug").lean();
      if (cat?.slug) pathsToRevalidate.push(`/category/${cat.slug}`);
    }
    for (const p of pathsToRevalidate) {
      try {
        revalidatePath(p);
      } catch (e) {
        console.warn("[admin/tools/delete] revalidatePath failed", p, e);
      }
    }

    return NextResponse.json({
      ok: true,
      id: String(tool._id),
      slug: tool.slug,
      deletedAt: tool.deletedAt,
      cancelledSubscriptions: cancelResults,
      revalidated: pathsToRevalidate,
    });
  } catch (err) {
    const adminErr = adminErrorResponse(err);
    if (adminErr) return adminErr;
    console.error("admin/tools/delete error:", err);
    return errorResponse("Failed to delete tool", 500);
  }
}
