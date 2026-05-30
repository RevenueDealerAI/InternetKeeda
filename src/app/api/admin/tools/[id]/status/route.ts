import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/app/api/lib/db";
import { requireAdmin, adminErrorResponse } from "@/app/api/lib/admin";
import { errorResponse } from "@/app/api/lib/auth";
import { Tool } from "@/app/api/models/Tool";

/**
 * PATCH /api/admin/tools/[id]/status
 *
 * Admin-guarded status flip. Replaces the unguarded
 * /api/tools/[id]/status route which let any signed-in user mutate
 * any tool's status. Only used by the admin Tools page's Archive
 * button today; the Approve / Reject flow goes through the
 * dedicated /api/admin/tools/[id]/approve and /reject routes
 * (which also handle rejection-reason capture and category
 * re-assignment).
 *
 * Body: { status: "draft" | "published" | "archived" | "pending" |
 *          "approved" | "rejected" }
 * "approved" maps to "published" on save — matches the legacy
 * mapping the deleted route used so admin-side semantics don't
 * change.
 */
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    await requireAdmin(req);

    const { id } = await params;
    const body = await req.json();
    const { status } = z
      .object({
        status: z.enum([
          "draft",
          "published",
          "archived",
          "pending",
          "approved",
          "rejected",
        ]),
      })
      .parse(body);

    const finalStatus = status === "approved" ? "published" : status;

    const updated = await Tool.findByIdAndUpdate(
      id,
      { status: finalStatus, updatedAt: new Date() },
      { new: true, runValidators: true },
    );
    if (!updated) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }
    return NextResponse.json(updated);
  } catch (err) {
    const adminErr = adminErrorResponse(err);
    if (adminErr) return adminErr;
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.errors }, { status: 400 });
    }
    console.error("admin/tools/status error:", err);
    return errorResponse("Failed to update tool status", 500);
  }
}
