"use client";

/**
 * Cookie-based "is the visitor signed in?" detection that doesn't
 * require @clerk/clerk-react to be loaded. Used in components that
 * render on every public route (Navigation, AffiliateTracker, the
 * tool-action vote/save buttons) so those surfaces don't drag the
 * Clerk SDK into the home page critical path.
 *
 * How it works:
 *   - Clerk sets two cookies on sign-in:
 *       __session       — JWT, HttpOnly, server-validated
 *       __client_uat    — timestamp, NOT HttpOnly, JS-readable
 *     `__client_uat` is "0" when signed out and a unix timestamp
 *     when signed in. Both cookies are scoped to the Clerk domain
 *     + your origin.
 *   - We poll document.cookie for `__client_uat` and return:
 *       { isSignedIn: boolean; isLoaded: boolean }
 *   - For protected requests, callers do `fetch(..., { credentials:
 *     'include' })` and the server validates the __session cookie
 *     via @clerk/backend (already wired up in /api/lib/auth.ts).
 *
 * Trade-offs vs Clerk's useUser():
 *   - No user object, no email, no metadata. Only a boolean.
 *   - First render returns isLoaded: false on the client (SSR-safe
 *     default) to avoid hydration mismatches.
 */

import { useEffect, useState } from "react";

export interface ClerkSession {
  isSignedIn: boolean;
  isLoaded: boolean;
}

function readSignedInFromCookies(): boolean {
  if (typeof document === "undefined") return false;
  const cookies = document.cookie.split(";").map((c) => c.trim());
  for (const c of cookies) {
    // __client_uat=0 → signed out; any non-zero value → signed in.
    if (c.startsWith("__client_uat=")) {
      const val = c.slice("__client_uat=".length);
      return val.length > 0 && val !== "0";
    }
    // Fallback signals — these cookies exist when Clerk has set up
    // a session. Some envs use slightly different names.
    if (c.startsWith("__session=") || c.startsWith("__clerk_db_jwt=")) {
      return true;
    }
  }
  return false;
}

export function useClerkSession(): ClerkSession {
  const [state, setState] = useState<ClerkSession>({ isSignedIn: false, isLoaded: false });

  useEffect(() => {
    setState({ isSignedIn: readSignedInFromCookies(), isLoaded: true });
    // Cookies don't change frequently for one page view; re-poll on
    // window focus so a sign-in done in another tab reflects here.
    const onFocus = () => {
      const next = readSignedInFromCookies();
      setState((prev) => (prev.isSignedIn === next ? prev : { isSignedIn: next, isLoaded: true }));
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  return state;
}
