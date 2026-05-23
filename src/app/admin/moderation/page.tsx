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
  const me = await User.findOne({ clerkId: userId }).select("isAdmin").lean();
  if (!me?.isAdmin) {
    redirect("/");
  }

  return (
    <AdminLayout>
      <ModerationPage />
    </AdminLayout>
  );
}
