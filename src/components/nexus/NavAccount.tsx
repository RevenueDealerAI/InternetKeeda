'use client';

// Sign-in / sign-out / dashboard controls for the Nexus Nav.
// Uses the cookie-based useClerkSession() so the public-home critical
// path doesn't drag the Clerk SDK.
//
// - Not signed in → "Sign in" mono pill (visible) + avatar that also
//   links to /sign-in.
// - Signed in    → "Sign out" mono pill (visible, blood-glow on
//   hover) + avatar that links to /dashboard. No dropdown — every
//   action is one tap.

import Link from 'next/link';
import { LogOut, User } from 'lucide-react';
import { useClerkSession } from '@/hooks/useClerkSession';

export function NavAccount() {
  const { isSignedIn, isLoaded } = useClerkSession();

  // Pre-load slot — avoid flicker / hydration mismatch.
  if (!isLoaded) {
    return (
      <div
        aria-hidden="true"
        className="grid h-9 w-9 place-items-center rounded-full"
        style={{
          background: 'var(--accent-soft)',
          border: '1px solid var(--rule)',
          color: 'var(--accent)',
        }}
      >
        <User className="h-4 w-4" />
      </div>
    );
  }

  if (!isSignedIn) {
    return (
      <>
        <Link
          href="/sign-in"
          className="hidden rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition-colors sm:inline-flex"
          style={{ color: 'var(--ink-2)', fontFamily: 'var(--mono)' }}
          onMouseEnter={(e) =>
            ((e.currentTarget as HTMLElement).style.color = 'var(--ink)')
          }
          onMouseLeave={(e) =>
            ((e.currentTarget as HTMLElement).style.color = 'var(--ink-2)')
          }
        >
          Sign in
        </Link>
        <Link
          href="/sign-in"
          aria-label="Sign in"
          className="grid h-9 w-9 place-items-center rounded-full transition-all duration-200 sm:hidden"
          style={{
            background: 'var(--accent-soft)',
            border: '1px solid var(--rule)',
            color: 'var(--accent)',
          }}
        >
          <User className="h-4 w-4" />
        </Link>
      </>
    );
  }

  // Signed in — visible Sign out button + avatar.
  return (
    <>
      <Link
        href="/sign-out"
        aria-label="Sign out"
        className="inline-flex items-center gap-1.5 rounded-full px-3 py-2 text-[11px] font-semibold uppercase tracking-[0.16em] transition-all duration-200"
        style={{
          color: 'var(--ink-2)',
          fontFamily: 'var(--mono)',
          border: '1px solid var(--rule)',
          background: 'transparent',
        }}
        onMouseEnter={(e) => {
          (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
          (e.currentTarget as HTMLElement).style.background = 'var(--accent-soft)';
        }}
        onMouseLeave={(e) => {
          (e.currentTarget as HTMLElement).style.color = 'var(--ink-2)';
          (e.currentTarget as HTMLElement).style.borderColor = 'var(--rule)';
          (e.currentTarget as HTMLElement).style.background = 'transparent';
        }}
      >
        <LogOut className="h-3 w-3" strokeWidth={2.5} />
        <span className="hidden sm:inline">Sign out</span>
      </Link>
      <Link
        href="/dashboard"
        aria-label="Open dashboard"
        title="Dashboard"
        className="grid h-9 w-9 place-items-center rounded-full transition-all duration-200"
        style={{
          background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
          color: 'var(--on-accent)',
          boxShadow: 'var(--shadow-accent)',
        }}
      >
        <User className="h-4 w-4" />
      </Link>
    </>
  );
}
