'use client';

import Link from 'next/link';
import { BRAND, LEGAL_ENTITIES } from '@/lib/brand';
import { WhatsAppSupportButton } from './WhatsAppSupportButton';

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
      { label: 'AI tool reviews', href: '/reviews' },
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
      { label: 'Terms & conditions', href: '/terms' },
      { label: 'Privacy policy', href: '/privacy' },
      { label: 'Refund & cancellation', href: '/refund' },
      { label: 'Shipping & delivery', href: '/shipping-delivery' },
      { label: 'Pricing', href: '/pricing' },
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
          {/* Brand logo — theme-aware pair so the wordmark reads on
           * both palettes. Light: logo-light.png (black "Internet").
           * Dark: animated GIF (white "Internet"). */}
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
              src="/branding/logo-animated.gif"
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
          <div className="mt-5">
            <WhatsAppSupportButton />
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
          className="text-[10px] uppercase tracking-[0.22em] leading-[1.7]"
          style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
        >
          © 2026 {BRAND.name} — operated by {LEGAL_ENTITIES.inr.name} (India)
          and {LEGAL_ENTITIES.usd.name} (USA)
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
