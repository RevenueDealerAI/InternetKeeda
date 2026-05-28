'use client';

import Link from 'next/link';

const COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Catalog',
    links: [
      { label: 'Discover', href: '/' },
      { label: 'Categories', href: '/categories' },
      { label: 'Top products', href: '/top-products' },
      { label: 'Trending', href: '/trending' },
      { label: 'Recently added', href: '/recently-added' },
    ],
  },
  {
    title: 'Rooms',
    links: [
      { label: 'Hidden gems', href: '/recently-added' },
      { label: 'Side hustles', href: '/best-productivity-tools-for-adhd' },
      { label: 'Deals', href: '/latest-launches' },
      { label: 'Automation', href: '/best-project-management-tools' },
      { label: 'Community', href: '/discussions' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Advertise', href: '/advertise' },
      { label: 'Blog', href: '/blog' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
];

export function Footer() {
  return (
    <footer className="border-t bg-background px-4 pb-10 pt-20" style={{ borderColor: 'hsl(var(--border))' }}>
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-10 sm:grid-cols-2 lg:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 lg:col-span-1">
            <Link href="/" className="flex items-center gap-2">
              <span
                aria-hidden="true"
                className="flex h-8 w-8 items-center justify-center rounded-full bg-foreground text-background"
              >
                <span className="font-display text-base italic leading-none">K</span>
              </span>
              <span className="font-display-roman text-base italic">
                Internet <span className="italic">Keeda</span>
              </span>
            </Link>
            <p className="mt-6 max-w-xs text-sm leading-relaxed text-muted-foreground">
              Built by people who use AI tools daily. Operated by Viom Global Inc.
            </p>
            <div className="font-mono-display mt-6 text-[11px] uppercase tracking-[0.22em] text-foreground/70">
              internetkeeda.com
            </div>
          </div>

          {COLS.map((col) => (
            <div key={col.title}>
              <div className="font-mono-display text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
                {col.title}
              </div>
              <ul className="mt-5 flex flex-col gap-3">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-sm text-foreground/80 hover:text-foreground transition-colors"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="ik-hairline mt-16 h-px w-full" />

        <div className="mt-6 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div className="font-mono-display text-[11px] uppercase tracking-[0.22em] text-muted-foreground">
            © 2026 viom global inc · all webs reserved
          </div>
          <div className="font-display text-base italic text-foreground/80">
            Made with <span aria-hidden="true" className="text-foreground">●</span> and too much
            coffee.
          </div>
        </div>
      </div>
    </footer>
  );
}
