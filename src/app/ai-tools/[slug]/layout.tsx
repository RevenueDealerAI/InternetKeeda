import { ClerkRouteWrapper } from '@/components/ClerkRouteWrapper';

export const dynamic = 'force-dynamic';
export const dynamicParams = true;

// Tool detail uses ReviewForm + ReviewList which call useUser/useAuth
// from @clerk/clerk-react. Provide a per-route ClerkProvider so those
// hooks resolve. Root layout no longer mounts Clerk site-wide.
export default function AIToolLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <ClerkRouteWrapper>{children}</ClerkRouteWrapper>;
}




