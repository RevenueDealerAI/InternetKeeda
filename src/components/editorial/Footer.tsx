'use client';

import Link from 'next/link';

const COLS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: 'Catalog',
    links: [
      { label: 'Discover', href: '/' },
      { label: 'Categories', href: '/categories' },
      { label: 'Featured', href: '/top-products' },
      { label: 'Submit a tool', href: '/submit-tool' },
    ],
  },
  {
    title: 'Rooms',
    links: [
      { label: 'Latest launches', href: '/latest-launches' },
      { label: 'Trending', href: '/trending' },
      { label: 'Top products', href: '/top-products' },
      { label: 'AI news', href: '/latest-news' },
    ],
  },
  {
    title: 'Company',
    links: [
      { label: 'About', href: '/about' },
      { label: 'Pricing', href: '/#pricing' },
      { label: 'Advertise', href: '/advertise' },
      { label: 'Privacy', href: '/privacy' },
      { label: 'Terms', href: '/terms' },
    ],
  },
];

export function Footer() {
  return (
    <footer
      className="mt-15 px-6 pb-9 pt-20"
      style={{ borderTop: '1px solid var(--border-color)' }}
    >
      <div className="mx-auto grid max-w-[var(--maxw,1240px)] grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]">
        {/* Brand block — logo image */}
        <div className="flex flex-col gap-4">
          <div className="relative h-14 w-[220px]">
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
              className="ik-logo-dark absolute left-0 top-0 hidden h-full w-auto object-contain"
              draggable={false}
            />
          </div>
          <p
            className="m-0 text-[14px] leading-[1.55]"
            style={{ color: 'var(--fg-dim)', maxWidth: 360 }}
          >
            Built by people who use AI tools daily. Operated by Viom Global Inc. — a hub, not a
            directory; opinionated, not algorithmic.
            <span
              className="mt-2 block font-mono-display text-[10px] uppercase tracking-[0.22em]"
              style={{ color: 'var(--muted-color)' }}
            >
              internetkeeda.com
            </span>
          </p>
        </div>

        {COLS.map((col) => (
          <div key={col.title}>
            <h4
              className="m-0 mb-4.5 font-medium font-mono-display text-[10px] uppercase tracking-[0.25em]"
              style={{ color: 'var(--muted-color)' }}
            >
              {col.title}
            </h4>
            <ul className="m-0 grid list-none gap-3 p-0">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-[14px] transition-colors"
                    style={{ color: 'var(--fg-dim)' }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = 'var(--blood-color)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = 'var(--fg-dim)';
                    }}
                  >
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      <div
        className="mx-auto mt-14 flex max-w-[var(--maxw,1240px)] flex-wrap justify-between gap-4 pt-6"
        style={{ borderTop: '1px solid var(--border-color)' }}
      >
        <div
          className="font-mono-display text-[10px] uppercase tracking-[0.22em]"
          style={{ color: 'var(--muted-color)' }}
        >
          © 2026 viom global inc · all webs reserved
        </div>
        <div
          className="font-display-roman text-[14px] italic"
          style={{ color: 'var(--fg-dim)' }}
        >
          Made with{' '}
          <span aria-hidden="true" style={{ color: 'var(--blood-color)' }}>
            ●
          </span>{' '}
          and too much coffee.
        </div>
      </div>
    </footer>
  );
}
