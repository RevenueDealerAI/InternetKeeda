import { auth } from "@clerk/nextjs/server";

/**
 * Canonical signed-in check. Returns a discriminated union with a
 * string-literal `kind` (boolean discriminants don't narrow under this
 * project's non-strict tsconfig). No throw — routes that get hit by
 * anonymous visitors return 401 cleanly instead of the 500 the old
 * `requireAuth` produced.
 *
 * For admin-only routes use `requireAdmin` from `./admin` instead;
 * that one also enforces `User.isAdmin === true`.
 */

export type UserCheck =
  | { kind: "ok"; userId: string }
  | { kind: "unauthenticated" };

export async function requireUser(): Promise<UserCheck> {
  const { userId } = await auth();
  if (!userId) return { kind: "unauthenticated" };
  return { kind: "ok", userId };
}
