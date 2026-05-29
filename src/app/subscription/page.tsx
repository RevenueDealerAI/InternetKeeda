import { redirect } from 'next/navigation';

// /subscription itself has no landing page — subscription details and
// billing controls live on the user's dashboard. Bouncing here keeps
// the URL working when a user types it from memory or follows a stale
// link. Clerk middleware on /dashboard handles the sign-in redirect
// for unauthenticated visitors.
export default function SubscriptionIndex(): never {
  redirect('/dashboard');
}
