'use client';

import Link from 'next/link';

const NAV_LINKS = [
  { href: '#featured', label: 'Discover' },
  { href: '#corridors', label: 'Hidden' },
  { href: '#corridors', label: 'Hustles' },
  { href: '#corridors', label: 'Deals' },
  { href: '#corridors', label: 'Community' },
  { href: '#pricing', label: 'Pro' },
];

export function Nav() {
  return (
    <header className="fixed inset-x-0 top-4 z-40 flex justify-center px-4">
      <nav
        className="ik-pill flex items-center gap-1 rounded-full px-3 py-2 backdrop-blur-md"
        style={{
          maxWidth: 1200,
          width: '100%',
          background: 'hsl(var(--card) / 0.85)',
        }}
        aria-label="Primary"
      >
        <Link href="/" className="flex items-center gap-2 pl-1 pr-3">
          <span
            aria-hidden="true"
            className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background"
          >
            <span className="font-display text-base leading-none">K</span>
          </span>
          <span className="font-display-roman hidden text-base italic tracking-tight sm:inline">
            <span className="italic">Internet</span>
            <span className="ml-1 italic">Keeda</span>
          </span>
        </Link>

        <ul className="ml-2 hidden flex-1 items-center justify-center gap-1 lg:flex">
          {NAV_LINKS.map((link) => (
            <li key={link.label}>
              <a
                href={link.href}
                className="font-mono-display text-foreground/70 hover:text-foreground hover:bg-muted rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] transition-colors"
              >
                {link.label}
              </a>
            </li>
          ))}
        </ul>

        <div className="ml-auto flex items-center gap-1.5 pr-1">
          <Link
            href="/sign-in"
            className="font-mono-display hidden rounded-full px-3 py-1.5 text-[11px] uppercase tracking-[0.18em] text-foreground/70 hover:text-foreground hover:bg-muted transition-colors sm:inline"
          >
            Sign in
          </Link>
          <Link
            href="/submit-tool"
            className="font-mono-display rounded-full bg-foreground px-4 py-2 text-[11px] uppercase tracking-[0.18em] text-background transition-opacity hover:opacity-90"
          >
            Submit tool →
          </Link>
        </div>
      </nav>
    </header>
  );
}
