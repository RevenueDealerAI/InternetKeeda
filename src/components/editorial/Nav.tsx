'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useEffect, useState } from 'react';
import { ChevronDown, Moon, Sun, User } from 'lucide-react';

type Mode = 'light' | 'dark';

function readMode(): Mode {
  if (typeof document === 'undefined') return 'light';
  const attr = document.documentElement.dataset.theme;
  if (attr === 'dark' || attr === 'light') return attr;
  return 'light';
}

function applyMode(mode: Mode) {
  document.documentElement.dataset.theme = mode;
  try {
    localStorage.setItem('ik-theme', mode);
  } catch {
    /* localStorage unavailable */
  }
}

const NAV_LINKS = [
  { label: 'Launches', href: '/latest-launches', caret: true },
  { label: 'Categories', href: '/categories', caret: true },
  { label: 'Products', href: '/top-products', caret: true },
  { label: 'News', href: '/latest-news', caret: true },
  { label: 'Advertise', href: '/advertise', caret: false },
];

export function Nav() {
  const [mode, setMode] = useState<Mode>(() => readMode());
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMode(readMode());
    setMounted(true);
  }, []);

  const setTheme = (m: Mode) => {
    setMode(m);
    applyMode(m);
  };

  return (
    <header className="nav-pill">
      <nav className="nav-pill-inner ik-glass-strong" aria-label="Primary">
        {/* Brand — logo image swaps based on theme via dual-img */}
        <Link
          href="/"
          aria-label="Internet Keeda — home"
          className="relative flex h-12 w-[180px] shrink-0 items-center pl-1 sm:w-[220px]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/branding/logo-light.png"
            alt="Internet Keeda"
            className="ik-logo-light block h-full w-auto object-contain"
            draggable={false}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/branding/logo-dark.png"
            alt=""
            aria-hidden="true"
            className="ik-logo-dark absolute left-1 top-1/2 hidden h-full w-auto -translate-y-1/2 object-contain"
            draggable={false}
          />
        </Link>

        {/* Center nav links — desktop only */}
        <ul className="hidden list-none items-center gap-0.5 p-0 lg:flex">
          {NAV_LINKS.map((l) => (
            <li key={l.label} className="list-none">
              <Link
                href={l.href}
                className="font-medium inline-flex items-center gap-1 rounded-full px-3.5 py-2 text-[14px] text-[color:var(--fg-dim)] transition-colors hover:bg-[color:var(--blood-soft)] hover:text-[color:var(--blood-color)]"
              >
                {l.label}
                {l.caret && (
                  <ChevronDown
                    className="h-2.5 w-2.5 opacity-70"
                    aria-hidden="true"
                    strokeWidth={2.5}
                  />
                )}
              </Link>
            </li>
          ))}
        </ul>

        {/* Right cluster */}
        <div className="flex items-center gap-1.5">
          {/* Two-button theme toggle (inside the nav pill) */}
          {mounted && (
            <div
              role="group"
              aria-label="Theme"
              className="inline-flex items-center gap-0 rounded-full border p-1"
              style={{
                borderColor: 'var(--border-strong)',
                background: 'var(--card-color)',
              }}
            >
              <button
                type="button"
                onClick={() => setTheme('dark')}
                aria-pressed={mode === 'dark'}
                aria-label="Dark theme"
                title="Dark theme"
                className="grid h-7 w-7 place-items-center rounded-full transition-all duration-200"
                style={
                  mode === 'dark'
                    ? {
                        background: 'var(--gradient-blood, linear-gradient(135deg, hsl(var(--blood)), hsl(var(--blood-deep))))',
                        color: '#fff',
                        boxShadow: 'var(--shadow-blood)',
                      }
                    : { color: 'var(--muted-color)' }
                }
              >
                <Moon className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
              <button
                type="button"
                onClick={() => setTheme('light')}
                aria-pressed={mode === 'light'}
                aria-label="Light theme"
                title="Light theme"
                className="grid h-7 w-7 place-items-center rounded-full transition-all duration-200"
                style={
                  mode === 'light'
                    ? {
                        background: 'var(--gradient-blood, linear-gradient(135deg, hsl(var(--blood)), hsl(var(--blood-deep))))',
                        color: '#fff',
                        boxShadow: 'var(--shadow-blood)',
                      }
                    : { color: 'var(--muted-color)' }
                }
              >
                <Sun className="h-3.5 w-3.5" aria-hidden="true" />
              </button>
            </div>
          )}

          {/* Sign in — text only, desktop */}
          <Link
            href="/sign-in"
            className="font-mono-display hidden rounded-full px-3 py-2 text-[11px] uppercase tracking-[0.18em] text-[color:var(--fg-dim)] transition-colors hover:text-foreground sm:inline-flex"
          >
            Sign in
          </Link>

          {/* Primary CTA — Submit your tool */}
          <Link href="/submit-tool" className="btn-blood">
            <span className="text-[14px] leading-none">+</span>
            <span className="hidden sm:inline">Submit Your Tool</span>
            <span className="sm:hidden">Submit</span>
          </Link>

          {/* Account avatar */}
          <Link
            href="/dashboard"
            aria-label="Account"
            className="grid h-9 w-9 place-items-center rounded-full transition-all duration-200"
            style={{
              background: 'var(--blood-soft)',
              border: '1px solid var(--border-strong)',
              color: 'var(--blood-color)',
            }}
          >
            <User className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      </nav>
    </header>
  );
}
