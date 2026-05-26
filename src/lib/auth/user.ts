import { auth } from "@clerk/nextjs/server";

/**
 * Canonical signed-in check. Returns a discriminated union — no throw,
 * so routes that get hit by anonymous visitors return 401 cleanly
 * instead of the 500 the old `requireAuth` produced.
 *
 * For admin-only routes use `requireAdmin` from `./admin` instead;
 * that one also enforces `User.isAdmin === true`.
 */

export type UserCheck =
  | { ok: true; userId: string }
  | { ok: false };

export async function requireUser(): Promise<UserCheck> {
  const { userId } = await auth();
  if (!userId) return { ok: false };
  return { ok: true, userId };
}
