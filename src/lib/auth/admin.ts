import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/app/api/lib/db";
import { User, type UserDocument } from "@/app/api/models/User";

/**
 * Canonical admin check. One source of truth: Mongo `User.isAdmin === true`.
 *
 * Returns a discriminated union instead of throwing so callers can branch
 * on the failure reason — server components redirect, API routes return
 * the matching HTTP status. No legacy Clerk `publicMetadata.role` check
 * here; that path was retired in the auth canonicalization sweep. Use
 * `scripts/sync-admin-to-clerk.ts` to mirror Mongo `isAdmin` into Clerk
 * `publicMetadata.isAdmin` for fast client-side reads.
 *
 * Usage:
 *   // Server component
 *   const a = await requireAdmin();
 *   if (!a.ok) redirect(a.reason === "unauthenticated" ? "/sign-in" : "/");
 *   const { mongoUser } = a;
 *
 *   // API route
 *   const a = await requireAdmin();
 *   if (!a.ok) return NextResponse.json(
 *     { error: a.reason },
 *     { status: a.reason === "unauthenticated" ? 401 : 403 },
 *   );
 */

export type AdminCheck =
  | { ok: true; userId: string; mongoUser: UserDocument }
  | { ok: false; reason: "unauthenticated" | "not-admin" };

export async function requireAdmin(): Promise<AdminCheck> {
  const { userId } = await auth();
  if (!userId) return { ok: false, reason: "unauthenticated" };

  await connectDB();
  const mongoUser = await User.findOne({ clerkId: userId }).lean<UserDocument>();
  if (!mongoUser || !mongoUser.isAdmin) {
    return { ok: false, reason: "not-admin" };
  }

  return { ok: true, userId, mongoUser };
}
