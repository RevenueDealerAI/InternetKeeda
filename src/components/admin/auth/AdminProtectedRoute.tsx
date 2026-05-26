'use client';

import { useAuth, useUser } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

/**
 * Reads `publicMetadata.isAdmin` (the mirror of Mongo `User.isAdmin`,
 * kept in sync by the Clerk webhook on signup and by
 * scripts/sync-admin-to-clerk.ts). The legacy `role === 'admin'`
 * mirror is accepted as a transitional fallback so already-elevated
 * admins are not locked out before the sync script has run — remove
 * once production is fully migrated.
 */
function checkIsAdmin(user: { publicMetadata?: Record<string, unknown> } | null | undefined): boolean {
  if (!user) return false;
  const meta = user.publicMetadata as Record<string, unknown> | undefined;
  if (meta?.isAdmin === true) return true;
  // Transitional fallback — drop once sync-admin-to-clerk has been run.
  if (meta?.role === 'admin' || meta?.role === 'superadmin') return true;
  return false;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      router.replace('/');
      return;
    }

    if (!checkIsAdmin(user)) {
      router.replace('/');
      return;
    }
  }, [isLoaded, isSignedIn, user, router]);

  if (!isLoaded) {
    return <div>Loading...</div>;
  }

  if (!isSignedIn || !user) {
    return null;
  }

  if (!checkIsAdmin(user)) {
    return null;
  }

  return <>{children}</>;
} 