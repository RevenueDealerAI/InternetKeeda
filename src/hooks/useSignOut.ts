"use client";

import { useClerk } from "@clerk/nextjs";

/**
 * Single source of truth for "sign the user out and send them home".
 *
 * Returns a handler with no arguments — drop straight into an
 * onClick (`onClick={handleSignOut}`) or a useEffect.
 *
 * Why hard nav instead of router.push("/") + router.refresh():
 *   The public homepage's Navigation reads auth state via
 *   useClerkSession() (cookie polling, see src/hooks/useClerkSession.ts),
 *   which only re-polls on mount + window focus. A soft client-side
 *   navigation leaves Navigation mounted with its stale
 *   { isSignedIn: true } state — user appears signed-out for a
 *   moment, then the dropdown flashes back. Hard nav unmounts the
 *   whole React tree so the next render reads the cleared cookie
 *   cleanly. Also incidentally clears React Query cache, which is
 *   what we want post-signout anyway.
 *
 * For the theme-one homepage Navigation — which deliberately does
 * NOT mount ClerkProvider in its tree to keep the Clerk SDK off the
 * critical path — sign-out still routes through /sign-out, the
 * dedicated page that has its own ClerkRouteWrapper. /sign-out
 * itself uses this hook.
 */
export function useSignOut() {
  const { signOut } = useClerk();

  return async function handleSignOut() {
    try {
      await signOut();
    } catch {
      // Even if the API call throws, push the user away — the
      // Clerk cookie is usually already cleared by this point.
    }
    if (typeof window !== "undefined") {
      window.location.href = "/";
    }
  };
}
