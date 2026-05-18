'use client';

import { useAuth, useUser } from "@clerk/clerk-react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

interface AdminProtectedRouteProps {
  children: React.ReactNode;
}

export function AdminProtectedRoute({ children }: AdminProtectedRouteProps) {
  const { isLoaded, isSignedIn } = useAuth();
  const { user } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!isLoaded) return;

    if (!isSignedIn || !user) {
      console.log('User not signed in');
      router.replace('/');
      return;
    }

    const hasAdminRole = user.publicMetadata?.role === 'admin';
    const isAdmin = hasAdminRole;

    console.log('Admin check:', { 
      hasAdminRole,
      isAdmin,
      userEmail: user.emailAddresses[0]?.emailAddress,
      userRole: user.publicMetadata?.role,
    });

    if (!isAdmin) {
      console.log('User is not an admin');
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

  const hasAdminRole = user.publicMetadata?.role === 'admin';
  const isAdmin = hasAdminRole;

  if (!isAdmin) {
    return null;
  }

  return <>{children}</>;
} 