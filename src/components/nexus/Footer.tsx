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
      { label: 'Launches', href: '/latest-launches' },
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
      style={{
        padding: '80px 28px 36px',
        borderTop: '1px solid var(--rule)',
        background: 'var(--bg)',
        color: 'var(--ink)',
      }}
    >
      <div
        className="mx-auto grid max-w-[1320px] grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr]"
      >
        <div>
          <div className="flex items-center gap-3.5">
            <span
              aria-hidden="true"
              className="grid h-11 w-11 place-items-center rounded-full"
              style={{
                background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                color: 'var(--on-accent)',
                boxShadow: 'var(--shadow-accent)',
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                fontSize: 22,
              }}
            >
              K
            </span>
            <div>
              <div
                className="text-[20px] font-semibold leading-none tracking-tight"
                style={{ color: 'var(--ink)' }}
              >
                Internet Keeda
              </div>
              <div
                className="mt-1.5 text-[9px] uppercase tracking-[0.22em]"
                style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
              >
                everything ai · since 2026
              </div>
            </div>
          </div>
          <p
            className="m-0 mt-5 max-w-[400px] text-[14px] leading-[1.55]"
            style={{ color: 'var(--ink-2)' }}
          >
            Built by humans who use AI tools daily. Operated by Viom Global Inc. — a hand-curated
            atlas of the AI internet.
          </p>
          <div
            className="mt-3 text-[10px] uppercase tracking-[0.22em]"
            style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
          >
            internetkeeda.com
          </div>
        </div>

        {COLS.map((col) => (
          <div key={col.title}>
            <h4
              className="m-0 mb-5 text-[10px] uppercase tracking-[0.25em]"
              style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)', fontWeight: 500 }}
            >
              {col.title}
            </h4>
            <ul className="m-0 grid list-none gap-3 p-0">
              {col.links.map((l) => (
                <li key={l.label}>
                  <Link
                    href={l.href}
                    className="text-[14px] transition-colors"
                    style={{ color: 'var(--ink-2)' }}
                    onMouseEnter={(e) =>
                      ((e.currentTarget as HTMLElement).style.color = 'var(--accent)')
                    }
                    onMouseLeave={(e) =>
                      ((e.currentTarget as HTMLElement).style.color = 'var(--ink-2)')
                    }
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
        className="mx-auto mt-14 flex max-w-[1320px] flex-wrap justify-between gap-4 pt-6"
        style={{ borderTop: '1px solid var(--rule)' }}
      >
        <div
          className="text-[10px] uppercase tracking-[0.22em]"
          style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
        >
          © 2026 viom global inc · all webs reserved
        </div>
        <div
          className="text-[14px]"
          style={{ color: 'var(--ink-2)', fontFamily: 'var(--serif)', fontStyle: 'italic' }}
        >
          Made with{' '}
          <span aria-hidden="true" style={{ color: 'var(--accent)' }}>
            ●
          </span>{' '}
          from somewhere on the internet.
        </div>
      </div>
    </footer>
  );
}
