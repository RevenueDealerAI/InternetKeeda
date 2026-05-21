import { NextRequest, NextResponse } from "next/server";
import { getAuth } from "@/app/api/lib/auth";

/**
 * Throws-or-returns admin guard. Mirrors the inline pattern used in
 * /api/config/* and /api/reviews/[id]/* — Clerk publicMetadata.role
 * must be "admin" or "superadmin".
 */
export async function requireAdmin(_req: NextRequest): Promise<{ userId: string }> {
  const user = await getAuth();
  if (!user) {
    throw new Error("Unauthorized");
  }
  const role = (user.publicMetadata as Record<string, unknown> | null)?.role;
  if (role !== "admin" && role !== "superadmin") {
    throw new Error("Forbidden");
  }
  return { userId: user.id };
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
