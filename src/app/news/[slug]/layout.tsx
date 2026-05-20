import { ClerkRouteWrapper } from '@/components/ClerkRouteWrapper';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// News article page uses useAuth from @clerk/clerk-react (saves the
// post under the signed-in user). Wrap in Clerk per-route.
export default function NewsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClerkRouteWrapper>{children}</ClerkRouteWrapper>;
}




