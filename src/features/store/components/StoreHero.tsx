'use client';

import Link from 'next/link';
import { STORE_BRAND } from '../config';

export function StoreHero() {
  return (
    <section
      className="relative overflow-hidden rounded-3xl"
      style={{
        background:
          'radial-gradient(120% 80% at 20% 0%, var(--accent-soft) 0%, transparent 55%), var(--bg-2)',
        border: '1px solid var(--rule)',
        boxShadow: 'var(--shadow)',
      }}
    >
      <div className="px-7 py-14 sm:px-12 sm:py-20">
        <div
          className="text-[11px] uppercase tracking-[0.3em]"
          style={{
            color: 'var(--accent)',
            fontFamily: 'var(--mono)',
          }}
        >
          § {STORE_BRAND.parentName.toLowerCase()} · sub-brand
        </div>
        <h1
          className="m-0 mt-5"
          style={{
            color: 'var(--ink)',
            fontFamily: 'var(--sans)',
            fontSize: 'clamp(36px, 6vw, 64px)',
            fontWeight: 500,
            letterSpacing: '-0.03em',
            lineHeight: 1.02,
          }}
        >
          {STORE_BRAND.name}.{' '}
          <span style={{ color: 'var(--ink-soft)' }}>{STORE_BRAND.tagline}</span>
        </h1>
        <p
          className="m-0 mt-6 max-w-[640px] text-[16px] leading-[1.7]"
          style={{ color: 'var(--ink-2)' }}
        >
          {STORE_BRAND.blurb}
        </p>
        <div className="mt-9 flex flex-wrap items-center gap-3">
          <Link
            href="#catalog"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[12px] uppercase tracking-[0.16em] font-semibold transition-transform hover:-translate-y-0.5"
            style={{
              background: 'var(--accent)',
              color: 'var(--on-accent)',
              fontFamily: 'var(--mono)',
              boxShadow: 'var(--shadow-accent)',
            }}
          >
            Browse workflows →
          </Link>
          <Link
            href="/store/my-downloads"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3 text-[12px] uppercase tracking-[0.16em]"
            style={{
              background: 'var(--surface)',
              color: 'var(--ink-2)',
              border: '1px solid var(--rule)',
              fontFamily: 'var(--mono)',
              fontWeight: 600,
            }}
          >
            My downloads
          </Link>
        </div>
      </div>
    </section>
  );
}
