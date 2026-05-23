import { redirect } from "next/navigation";
import { auth } from "@clerk/nextjs/server";
import { connectDB } from "@/app/api/lib/db";
import { User } from "@/app/api/models/User";
import ModerationPage from "@/themes/theme-one/pages/admin/moderation/ModerationPage";
import { AdminLayout } from "@/components/admin/layout/AdminLayout";

/**
 * Server-component shell for /admin/moderation.
 *
 * Auth check happens here on the server — Clerk `auth()` reads the
 * session cookie, then we look up the Mongo `User.isAdmin` flag.
 * Non-admins get redirected to the home page (no 403 page; the
 * existing admin routes also redirect home on failure for consistency).
 *
 * The interactive moderation UI is a client component because it
 * needs React Query + form state. AdminLayout (the sidebar wrapper)
 * is also client; both render fine as children of a server component.
 */
export const dynamic = "force-dynamic";

export default async function AdminModerationRoute() {
  const { userId } = await auth();
  if (!userId) {
    redirect("/sign-in?redirect_url=/admin/moderation");
  }

  await connectDB();
  const me = await User.findOne({ clerkId: userId }).select("isAdmin email").lean();

  // Two failure modes — surface them clearly. An admin debugging
  // access shouldn't have to guess whether the issue is "no Mongo
  // row" (Clerk webhook didn't run, or row was inserted with the
  // wrong field name) vs "row exists, isAdmin is just false".
  if (!me) {
    return (
      <AdminLayout>
        <div className="max-w-md mx-auto bg-white border border-amber-200 rounded-2xl p-8 text-center">
          <h1 className="text-lg font-semibold text-gray-900">No Mongo user row</h1>
          <p className="mt-2 text-sm text-gray-600">
            You&apos;re signed in via Clerk (<code className="text-xs">{userId}</code>) but no
            <code className="text-xs"> users </code> document exists with that{" "}
            <code className="text-xs">clerkId</code>. Either the Clerk webhook hasn&apos;t run yet —
            sign out and in to retry — or a row was inserted by hand under a different field
            name (the canonical field is <code className="text-xs">clerkId</code>, not
            <code className="text-xs"> clerkUserId</code>).
          </p>
        </div>
      </AdminLayout>
    );
  }

  if (!me.isAdmin) {
    return (
      <AdminLayout>
        <div className="max-w-md mx-auto bg-white border border-red-200 rounded-2xl p-8 text-center">
          <h1 className="text-lg font-semibold text-gray-900">Not an admin</h1>
          <p className="mt-2 text-sm text-gray-600">
            Your account ({me.email || userId}) exists but{" "}
            <code className="text-xs">isAdmin</code> is not set to true. Flip it via the
            seed script (<code className="text-xs">ADMIN_EMAIL=… npx tsx scripts/seed-admin.ts</code>)
            or directly in Atlas.
          </p>
        </div>
      </AdminLayout>
    );
  }

  return (
    <AdminLayout>
      <ModerationPage />
    </AdminLayout>
  );
}
