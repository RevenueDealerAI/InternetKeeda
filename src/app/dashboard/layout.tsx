import { auth } from '@clerk/nextjs/server';
import { redirect } from 'next/navigation';
import { ClerkRouteWrapper } from '@/components/ClerkRouteWrapper';
import type { ReactNode } from 'react';

/**
 * Server-side auth guard for /dashboard and its sub-routes. Anon
 * visitors used to reach the client-side Dashboard.tsx and see
 * "Welcome back, User!" with a placeholder name because the page
 * happily renders with user=null. We bounce them to /sign-in
 * before the page mounts.
 */
export const dynamic = 'force-dynamic';

export default async function DashboardLayout({ children }: { children: ReactNode }) {
  const { userId } = await auth();
  if (!userId) {
    redirect('/sign-in?redirect_url=/dashboard');
  }
  return <ClerkRouteWrapper>{children}</ClerkRouteWrapper>;
}
