'use client';

import Link from 'next/link';
import { ChevronDown, Plus, User } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';

const LINKS = [
  { label: 'Launches', href: '#launches', caret: true },
  { label: 'Categories', href: '/categories', caret: true },
  { label: 'Products', href: '/top-products', caret: true },
  { label: 'News', href: '/latest-news', caret: true },
  { label: 'Advertise', href: '/advertise', caret: false },
];

export function Nav() {
  return (
    <header
      className="fixed left-1/2 top-4 z-50 -translate-x-1/2 px-3"
      style={{ width: 'min(1320px, calc(100% - 24px))' }}
    >
      <nav
        className="flex items-center justify-between gap-3 rounded-full px-2 py-2 pl-4 backdrop-blur-2xl"
        style={{
          background: 'color-mix(in oklab, var(--bg-2) 78%, transparent)',
          border: '1px solid var(--rule)',
          boxShadow: 'var(--shadow-sm)',
        }}
        aria-label="Primary"
      >
        {/* Brand */}
        <Link href="/" className="flex items-center gap-2.5 py-0.5">
          <span
            aria-hidden="true"
            className="grid h-9 w-9 place-items-center rounded-full"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              color: 'var(--on-accent)',
              boxShadow: 'var(--shadow-accent)',
              fontFamily: 'var(--serif)',
              fontStyle: 'italic',
              fontSize: 18,
            }}
          >
            K
          </span>
          <span className="leading-tight">
            <span
              className="block text-[15px] font-semibold tracking-tight"
              style={{ color: 'var(--ink)' }}
            >
              Internet Keeda
            </span>
            <span
              className="mt-0.5 block text-[9px] uppercase tracking-[0.22em]"
              style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
            >
              everything ai
            </span>
          </span>
        </Link>

        {/* Center links — desktop */}
        <ul className="hidden list-none items-center gap-0.5 p-0 lg:flex">
          {LINKS.map((l) => (
            <li key={l.label} className="list-none">
              <a
                href={l.href}
                className="inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors"
                style={{ color: 'var(--ink-2)' }}
                onMouseEnter={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
                  (e.currentTarget as HTMLElement).style.background = 'var(--accent-soft)';
                }}
                onMouseLeave={(e) => {
                  (e.currentTarget as HTMLElement).style.color = 'var(--ink-2)';
                  (e.currentTarget as HTMLElement).style.background = 'transparent';
                }}
              >
                {l.label}
                {l.caret && <ChevronDown className="h-3 w-3 opacity-70" strokeWidth={2.5} />}
              </a>
            </li>
          ))}
        </ul>

        {/* Right cluster */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link
            href="/submit-tool"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.16em] transition-transform hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              color: 'var(--on-accent)',
              boxShadow: 'var(--shadow-accent)',
              fontFamily: 'var(--mono)',
            }}
          >
            <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
            <span className="hidden sm:inline">Submit your tool</span>
            <span className="sm:hidden">Submit</span>
          </Link>
          <Link
            href="/dashboard"
            aria-label="Account"
            className="grid h-9 w-9 place-items-center rounded-full transition-all duration-200"
            style={{
              background: 'var(--accent-soft)',
              border: '1px solid var(--rule)',
              color: 'var(--accent)',
            }}
          >
            <User className="h-4 w-4" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
