import { NextRequest, NextResponse } from "next/server";
import { requireAdmin as requireAdminCanonical } from "@/lib/auth/admin";

/**
 * Legacy compat shim. Existing admin API routes use a try/catch
 * pattern with this throw-based `requireAdmin` + `adminErrorResponse`.
 * The body now delegates to the canonical Mongo-only check in
 * `src/lib/auth/admin.ts`, which is the single source of truth.
 * New routes should import the canonical version directly and branch
 * on the `{ ok }` discriminator instead of try/catch.
 *
 * The `_req: NextRequest` parameter is retained for the legacy
 * signature only — it is unused.
 */
export async function requireAdmin(_req: NextRequest): Promise<{ userId: string }> {
  const a = await requireAdminCanonical();
  if (a.kind === "unauthenticated") throw new Error("Unauthorized");
  if (a.kind === "not-admin") throw new Error("Forbidden");
  return { userId: a.userId };
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
