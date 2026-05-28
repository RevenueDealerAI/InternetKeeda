'use client';

// Sign-in / sign-out / account dropdown for the Nexus Nav.
// Uses the cookie-based useClerkSession() (NOT useUser) so we don't
// drag the Clerk SDK onto the public-home critical path.
//
// - Not signed in  → "Sign in" link (mono, ghost) + the avatar button
//                    links to /sign-in.
// - Signed in      → avatar opens a small panel: Dashboard, Submit Tool,
//                    Admin (if isAdmin cookie), Sign out (→ /sign-out
//                    which handles the actual signOut() flow without
//                    needing ClerkProvider mounted here).

import Link from 'next/link';
import { useEffect, useRef, useState } from 'react';
import { LayoutDashboard, Plus, LogOut, ShieldCheck, User } from 'lucide-react';
import { useClerkSession } from '@/hooks/useClerkSession';

function readIsAdminCookie(): boolean {
  if (typeof document === 'undefined') return false;
  // Mongo-backed isAdmin is mirrored to a Clerk publicMetadata key that
  // the server sets onto a cookie at sign-in time. If your project uses
  // a different mechanism, this just stays false — the admin link won't
  // render. Safe default.
  const match = document.cookie.match(/(?:^|;\s*)ik_is_admin=([^;]+)/);
  return match?.[1] === '1';
}

export function NavAccount() {
  const { isSignedIn, isLoaded } = useClerkSession();
  const [isAdmin, setIsAdmin] = useState(false);
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (isSignedIn) setIsAdmin(readIsAdminCookie());
  }, [isSignedIn]);

  useEffect(() => {
    if (!open) return;
    const onDown = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false);
    };
    document.addEventListener('mousedown', onDown);
    document.addEventListener('keydown', onKey);
    return () => {
      document.removeEventListener('mousedown', onDown);
      document.removeEventListener('keydown', onKey);
    };
  }, [open]);

  // While unloaded — render the avatar slot but without a click target
  // (avoids hydration mismatch + flash). Once loaded we render the
  // correct path.
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
          className="grid h-9 w-9 place-items-center rounded-full transition-all duration-200"
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

  // Signed-in dropdown
  return (
    <div ref={ref} className="relative">
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label="Account menu"
        onClick={() => setOpen((v) => !v)}
        className="grid h-9 w-9 place-items-center rounded-full transition-all duration-200"
        style={{
          background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
          color: 'var(--on-accent)',
          boxShadow: 'var(--shadow-accent)',
        }}
      >
        <User className="h-4 w-4" />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 mt-2 w-56 overflow-hidden rounded-2xl backdrop-blur-2xl"
          style={{
            background: 'color-mix(in oklab, var(--bg-2) 92%, transparent)',
            border: '1px solid var(--rule)',
            boxShadow: 'var(--shadow)',
          }}
        >
          <DropdownItem
            href="/dashboard"
            icon={<LayoutDashboard className="h-3.5 w-3.5" />}
            label="Dashboard"
            onClick={() => setOpen(false)}
          />
          <DropdownItem
            href="/submit-tool"
            icon={<Plus className="h-3.5 w-3.5" />}
            label="Submit a tool"
            onClick={() => setOpen(false)}
          />
          {isAdmin && (
            <DropdownItem
              href="/admin"
              icon={<ShieldCheck className="h-3.5 w-3.5" />}
              label="Admin"
              onClick={() => setOpen(false)}
            />
          )}
          <div
            aria-hidden="true"
            className="my-1"
            style={{ height: 1, background: 'var(--rule)' }}
          />
          <DropdownItem
            href="/sign-out"
            icon={<LogOut className="h-3.5 w-3.5" />}
            label="Sign out"
            onClick={() => setOpen(false)}
            accent
          />
        </div>
      )}
    </div>
  );
}

function DropdownItem({
  href,
  icon,
  label,
  onClick,
  accent,
}: {
  href: string;
  icon: React.ReactNode;
  label: string;
  onClick?: () => void;
  accent?: boolean;
}) {
  return (
    <Link
      href={href}
      onClick={onClick}
      role="menuitem"
      className="flex items-center gap-2.5 px-3 py-2.5 text-[12px] transition-colors"
      style={{
        color: accent ? 'var(--accent)' : 'var(--ink)',
        fontFamily: 'var(--mono)',
        letterSpacing: '0.06em',
      }}
      onMouseEnter={(e) => {
        (e.currentTarget as HTMLElement).style.background = accent
          ? 'var(--accent-soft)'
          : 'var(--surface)';
      }}
      onMouseLeave={(e) => {
        (e.currentTarget as HTMLElement).style.background = 'transparent';
      }}
    >
      <span aria-hidden="true">{icon}</span>
      <span>{label}</span>
    </Link>
  );
}
