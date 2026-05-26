import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/app/api/lib/db";
import { User, type UserDocument } from "@/app/api/models/User";

/**
 * Canonical admin check. One source of truth: Mongo `User.isAdmin === true`.
 *
 * Returns a discriminated union with a string-literal `kind` field so the
 * narrowing works under this project's non-strict tsconfig (boolean
 * discriminants don't narrow without strictNullChecks). The legacy Clerk
 * `publicMetadata.role` check is gone. Use `scripts/sync-admin-to-clerk.ts`
 * to mirror Mongo `isAdmin` into Clerk `publicMetadata.isAdmin` for fast
 * client-side reads.
 *
 * Usage:
 *   // Server component
 *   const a = await requireAdmin();
 *   if (a.kind !== "ok") redirect(a.kind === "unauthenticated" ? "/sign-in" : "/");
 *   const { mongoUser } = a;
 *
 *   // API route
 *   const a = await requireAdmin();
 *   if (a.kind !== "ok") return NextResponse.json(
 *     { error: a.kind },
 *     { status: a.kind === "unauthenticated" ? 401 : 403 },
 *   );
 */

export type AdminCheck =
  | { kind: "ok"; userId: string; mongoUser: UserDocument }
  | { kind: "unauthenticated" }
  | { kind: "not-admin" };

export async function requireAdmin(): Promise<AdminCheck> {
  const { userId } = await auth();
  if (!userId) return { kind: "unauthenticated" };

  await connectDB();
  const mongoUser = await User.findOne({ clerkId: userId }).lean<UserDocument>();
  if (!mongoUser || !mongoUser.isAdmin) {
    return { kind: "not-admin" };
  }

  return { kind: "ok", userId, mongoUser };
}
