import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { connectDB } from "@/app/api/lib/db";
import { requireAdmin, adminErrorResponse } from "@/app/api/lib/admin";
import { errorResponse } from "@/app/api/lib/auth";
import { Tool } from "@/app/api/models/Tool";

const bodySchema = z.object({
  // Reason is now optional — admins can reject without one, and the
  // dialog only requires it when it's user-friendly to do so. Trimmed
  // empty strings normalize to undefined so we don't write "" into
  // the doc.
  reason: z
    .string()
    .max(2000)
    .optional()
    .transform((s) => {
      const t = s?.trim();
      return t && t.length > 0 ? t : undefined;
    }),
});

/**
 * POST /api/admin/tools/[id]/reject
 *
 * Sets status = "rejected" and stamps rejectionReason + rejectedAt +
 * rejectedBy. The owner sees the reason (if any) on /dashboard →
 * My Tools and can edit + resubmit after a 48h cooldown.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    await connectDB();
    const adminAuth = await requireAdmin(req);
    const { id } = await params;
    const parsed = bodySchema.parse(await req.json().catch(() => ({})));

    const tool = await Tool.findOneAndUpdate(
      { _id: id, status: "pending" },
      {
        $set: {
          status: "rejected",
          rejectedAt: new Date(),
          rejectedBy: adminAuth.userId,
          ...(parsed.reason
            ? { rejectionReason: parsed.reason }
            : {}),
        },
        ...(parsed.reason
          ? {}
          : { $unset: { rejectionReason: "" } }),
      },
      { new: true },
    );

    if (!tool) {
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
      rejectionReason: tool.rejectionReason,
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
    console.error("admin/tools/reject error:", err);
    return errorResponse("Failed to reject tool", 500);
  }
}
