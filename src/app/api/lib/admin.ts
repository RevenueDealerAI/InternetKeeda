import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/app/api/lib/auth";
import { connectDB } from "@/app/api/lib/db";
import { User } from "@/app/api/models/User";

/**
 * Throws-or-returns admin guard. Accepts EITHER source:
 *   1. Clerk publicMetadata.role === "admin" / "superadmin"  (legacy)
 *   2. Mongo User.isAdmin === true  (new, used by /admin/moderation)
 *
 * Existing admin endpoints keep working under the Clerk role check;
 * newer endpoints (or admins who don't have Clerk role configured)
 * can rely on the DB flag, flipped via scripts/seed-admin.ts.
 */
export async function requireAdmin(_req: NextRequest): Promise<{ userId: string }> {
  const user = await getAuth();
  if (!user) {
    throw new Error("Unauthorized");
  }
  const role = (user.publicMetadata as Record<string, unknown> | null)?.role;
  if (role === "admin" || role === "superadmin") {
    return { userId: user.id };
  }

  // Fallback: check the Mongo User.isAdmin flag for this Clerk id.
  try {
    await connectDB();
    const dbUser = await User.findOne({ clerkId: user.id }).select("isAdmin").lean();
    if (dbUser?.isAdmin) {
      return { userId: user.id };
    }
  } catch {
    // DB error — fall through to Forbidden rather than 500 so the
    // client sees a stable response. The actual error is logged by
    // the connectDB wrapper.
  }

  throw new Error("Forbidden");
}

export function adminErrorResponse(err: unknown) {
  if (err instanceof Error) {
    if (err.message === "Unauthorized") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    if (err.message === "Forbidden") {
      return NextResponse.json({ error: "Admin role required" }, { status: 403 });
    }
  }
  return null;
}
