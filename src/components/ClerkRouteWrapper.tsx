'use client';

import { ClerkProvider } from '@clerk/nextjs';
import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';

const PLACEHOLDER_KEY = 'pk_test_Y2xlcmsuZXhhbXBsZS5jb20k';

/**
 * Per-route ClerkProvider wrapper. Used by route-level layouts for
 * surfaces that genuinely need Clerk (sign-in, sign-up, dashboard,
 * admin, tool detail page with reviews, etc.).
 *
 * Public routes (home, category, trending, etc.) deliberately do NOT
 * wrap in ClerkProvider — they use cookie-based session detection
 * via `useClerkSession()` and never load the Clerk SDK on initial
 * paint. That's the main perf win.
 *
 * Iframe pass-through is preserved (Envato preview / embed contexts).
 */
export function ClerkRouteWrapper({ children }: { children: ReactNode }) {
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }
  }, []);

  if (isInIframe) {
    return <>{children}</>;
  }

  const key = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || PLACEHOLDER_KEY;
  return <ClerkProvider publishableKey={key}>{children}</ClerkProvider>;
}
