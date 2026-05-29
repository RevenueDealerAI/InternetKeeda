'use client';

import Link from 'next/link';
import { BRAND } from '@/lib/brand';

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
    ],
  },
  {
    title: 'Legal',
    links: [
      { label: 'Privacy policy', href: '/privacy' },
      { label: 'Terms of service', href: '/terms' },
      { label: 'Refund policy', href: '/refunds' },
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
        className="mx-auto grid max-w-[1320px] grid-cols-1 gap-10 sm:grid-cols-2 lg:grid-cols-[2fr_1fr_1fr_1fr_1fr]"
      >
        <div>
          {/* Brand logo — image, theme-aware. Bigger per spec. */}
          <div className="relative h-20 w-[300px]">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/branding/logo-light.png"
              alt={BRAND.name}
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
          <div
            className="mt-3 text-[9px] uppercase tracking-[0.22em]"
            style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
          >
            everything ai · since 2026
          </div>
          <p
            className="m-0 mt-5 max-w-[400px] text-[14px] leading-[1.55]"
            style={{ color: 'var(--ink-2)' }}
          >
            Built by humans who use AI tools daily. Operated by {BRAND.legalEntity} — a
            hand-curated atlas of the AI internet.
          </p>
          <div
            className="mt-3 text-[10px] uppercase tracking-[0.22em]"
            style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
          >
            {BRAND.domain}
          </div>

          {/* WhatsApp contact — primary support channel */}
          <a
            href="https://wa.me/internetkeeda"
            target="_blank"
            rel="noopener noreferrer"
            aria-label="Chat with us on WhatsApp"
            className="mt-5 inline-flex items-center gap-2 rounded-full px-4 py-2.5 transition-transform hover:-translate-y-0.5"
            style={{
              background: '#25D366',
              color: '#fff',
              fontFamily: 'var(--mono)',
              fontSize: 11,
              fontWeight: 600,
              letterSpacing: '0.14em',
              textTransform: 'uppercase',
              boxShadow: '0 8px 24px -8px rgba(37, 211, 102, 0.55)',
            }}
          >
            <svg
              aria-hidden="true"
              viewBox="0 0 24 24"
              width="16"
              height="16"
              fill="currentColor"
            >
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.004A9.87 9.87 0 016.96 20.42l-.365-.218-3.78.99 1.01-3.68-.238-.378a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.889-9.884a9.825 9.825 0 016.992 2.898 9.825 9.825 0 012.892 6.99c-.002 5.45-4.437 9.885-9.885 9.885zM20.52 3.449C18.24 1.245 15.24.044 12.045.044 5.46.044.103 5.398.1 11.987c0 2.096.547 4.142 1.588 5.945L0 24l6.215-1.63a11.943 11.943 0 005.83 1.485h.005c6.585 0 11.945-5.354 11.948-11.943 0-3.192-1.245-6.196-3.475-8.463z" />
            </svg>
            Chat on WhatsApp
          </a>
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
          © 2026 {BRAND.legalEntity.toLowerCase()} · all webs reserved
        </div>
        <div
          className="text-[13px]"
          style={{
            color: 'var(--ink-soft)',
            fontFamily: 'var(--mono)',
            letterSpacing: '0.06em',
          }}
        >
          Made with{' '}
          <span aria-hidden="true" style={{ color: 'var(--accent)' }}>●</span>{' '}
          from somewhere on the internet.
        </div>
      </div>
    </footer>
  );
}
