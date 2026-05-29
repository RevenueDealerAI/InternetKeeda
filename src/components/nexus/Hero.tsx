'use client';

import Link from 'next/link';
import { Search, ArrowRight } from 'lucide-react';
import { type FormEvent, useState } from 'react';
import { NeuralCanvas } from './NeuralCanvas';
import { Ticker } from './Ticker';

type HeroProps = {
  toolCount: number;
  categoryCount: number;
  onAiSearch?: (query: string) => void;
  aiLoading?: boolean;
  initialQuery?: string;
  categories?: { name: string; slug: string; count: number; glyph: string }[];
};

const FALLBACK_CATS = [
  { name: 'Writing', slug: 'writing', count: 842, glyph: '✦' },
  { name: 'Design', slug: 'design', count: 714, glyph: '◆' },
  { name: 'Code', slug: 'code', count: 623, glyph: '⌘' },
  { name: 'Audio', slug: 'audio', count: 389, glyph: '♪' },
  { name: 'Video', slug: 'video', count: 512, glyph: '▶' },
  { name: 'Research', slug: 'research', count: 298, glyph: '?' },
  { name: 'Agents', slug: 'agents', count: 221, glyph: '△' },
  { name: 'Automation', slug: 'automation', count: 317, glyph: '⚙' },
  { name: '3D', slug: '3d', count: 186, glyph: '▣' },
  { name: 'Vision', slug: 'vision', count: 241, glyph: '◉' },
  { name: 'Voice', slug: 'voice', count: 163, glyph: '◊' },
  { name: 'Marketing', slug: 'marketing', count: 441, glyph: '$' },
];

export function Hero({
  toolCount,
  categoryCount,
  onAiSearch,
  aiLoading,
  initialQuery = '',
  categories,
}: HeroProps) {
  const [query, setQuery] = useState(initialQuery);
  const cats = (categories && categories.length >= 6 ? categories : FALLBACK_CATS).slice(0, 12);
  const moreCount = Math.max(categoryCount - 12, 0);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (q && onAiSearch) onAiSearch(q);
  };

  return (
    <section
      className="relative overflow-hidden"
      style={{ background: 'var(--hero-bg)', color: '#f4f3f0' }}
    >
      {/* Neural backdrop fills the entire hero box. Density tuned
          down from 0.00010 → 0.00006 — 40% fewer particles, still
          reads as a full field but cuts the per-frame work. */}
      <NeuralCanvas
        density={0.00006}
        maxDist={160}
        speed={0.28}
        interactive={false}
        style={{ zIndex: 0 }}
      />

      {/* Pulsing red orb top-right */}
      <div
        aria-hidden="true"
        className="ik-pulse-orb pointer-events-none absolute"
        style={{
          top: '-200px',
          right: '-200px',
          width: '600px',
          height: '600px',
          borderRadius: '9999px',
          background:
            'radial-gradient(circle, rgba(255,59,59,0.32) 0%, rgba(255,59,59,0.10) 35%, transparent 65%)',
          zIndex: 1,
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute"
        style={{
          bottom: '-300px',
          left: '-150px',
          width: '600px',
          height: '600px',
          borderRadius: '9999px',
          background:
            'radial-gradient(circle, rgba(255,59,59,0.16) 0%, rgba(255,59,59,0.06) 40%, transparent 70%)',
          zIndex: 1,
        }}
      />

      <div className="relative mx-auto max-w-[1320px] px-7 pt-36 pb-20" style={{ zIndex: 2 }}>
        {/* Status chip */}
        <div className="flex justify-center">
          <div
            className="inline-flex items-center gap-2.5 rounded-full px-4 py-2 backdrop-blur-xl"
            style={{
              background: 'rgba(255,255,255,0.04)',
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            <span
              aria-hidden="true"
              className="ik-pulse-dot relative flex h-1.5 w-1.5 rounded-full"
              style={{ background: 'var(--accent)', boxShadow: '0 0 12px var(--accent-glow)' }}
            />
            <span
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 11,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                color: 'rgba(244,243,240,0.75)',
              }}
            >
              <span style={{ color: '#f4f3f0' }}>{toolCount.toLocaleString()} tools</span>{' '}
              · indexed live ·{' '}
              <span style={{ color: '#f4f3f0' }}>{categoryCount}</span>{' '}
              categories
            </span>
          </div>
        </div>

        {/* Headline — Nexus voice. Italic Instrument Serif accents on 1-2
            words per row. "Everything AI." stays sans + dim. */}
        <h1
          className="m-0 mt-10 text-center font-medium"
          style={{
            fontFamily: 'var(--sans)',
            fontSize: 'clamp(56px, 9.5vw, 144px)',
            lineHeight: 0.92,
            letterSpacing: '-0.035em',
            color: '#f4f3f0',
          }}
        >
          <span className="block">
            Discover.{' '}
            <span style={{ fontWeight: 600, color: 'var(--accent)' }}>Learn.</span>
          </span>
          <span className="block">
            Earn.{' '}
            <span style={{ color: 'rgba(244,243,240,0.42)' }}>Everything AI.</span>
          </span>
        </h1>

        {/* Tagline — plain sans, no italic */}
        <p
          className="mx-auto mt-7 max-w-[640px] text-center text-[17px] leading-[1.55]"
          style={{ color: 'rgba(244,243,240,0.75)' }}
        >
          A hand-curated atlas of the AI internet — {toolCount.toLocaleString()}+ tools across
          writing, design, code, audio, video &amp; research. Built by humans who actually use
          them.
        </p>

        {/* CTAs */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link
            href="/trending"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-transform hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              color: 'var(--on-accent)',
              boxShadow: 'var(--shadow-accent)',
              fontFamily: 'var(--mono)',
            }}
          >
            Enter the index <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </Link>
          <Link
            href="/categories"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-colors"
            style={{
              border: '1px solid rgba(255,255,255,0.16)',
              color: '#f4f3f0',
              fontFamily: 'var(--mono)',
            }}
          >
            Browse {toolCount.toLocaleString()} tools
          </Link>
        </div>

        {/* Search bar */}
        <form
          onSubmit={onSubmit}
          className="mx-auto mt-12 flex max-w-[720px] items-center gap-2 rounded-full px-3 py-2"
          style={{
            background: 'rgba(255,255,255,0.04)',
            border: '1px solid rgba(255,255,255,0.10)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          <Search className="ml-2 h-4 w-4" style={{ color: 'var(--accent)' }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search 5,000+ AI tools — try 'lip sync' or 'code companion'"
            aria-label="AI search the index"
            disabled={aiLoading}
            className="flex-1 bg-transparent px-2 py-3 focus:outline-none"
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 13,
              color: '#f4f3f0',
            }}
          />
          <kbd
            className="hidden items-center gap-1 rounded-md border px-1.5 py-1 text-[10px] sm:inline-flex"
            style={{
              borderColor: 'rgba(255,255,255,0.16)',
              color: 'rgba(244,243,240,0.5)',
              fontFamily: 'var(--mono)',
            }}
          >
            ⌘ K
          </kbd>
          <button
            type="submit"
            disabled={!query.trim() || aiLoading}
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              color: 'var(--on-accent)',
              boxShadow: 'var(--shadow-accent)',
              fontFamily: 'var(--mono)',
            }}
          >
            {aiLoading ? 'Searching…' : 'Search'}
            <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
          </button>
        </form>

        {/* Trending ticker */}
        <div className="mt-7">
          <Ticker />
        </div>

        {/* Category chips */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {cats.map((c) => (
            <Link
              key={c.slug}
              href={`/category/${c.slug}`}
              className="inline-flex items-center gap-2.5 rounded-full px-4 py-2 transition-all duration-200"
              style={{
                background: 'rgba(255,255,255,0.04)',
                border: '1px solid rgba(255,255,255,0.1)',
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'var(--accent-soft)';
                (e.currentTarget as HTMLElement).style.borderColor = 'var(--accent)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)';
                (e.currentTarget as HTMLElement).style.borderColor = 'rgba(255,255,255,0.1)';
              }}
            >
              <span
                style={{
                  fontFamily: 'var(--mono)',
                  color: 'var(--accent)',
                  fontSize: 11,
                  width: 14,
                  textAlign: 'center',
                }}
                aria-hidden="true"
              >
                {c.glyph}
              </span>
              <span style={{ fontSize: 13, color: '#f4f3f0' }}>{c.name}</span>
              <span
                className="rounded-full px-2 py-0.5"
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 10,
                  background: 'rgba(0,0,0,0.35)',
                  color: 'rgba(244,243,240,0.6)',
                }}
              >
                {c.count.toLocaleString()}
              </span>
            </Link>
          ))}
          {moreCount > 0 && (
            <Link
              href="/categories"
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 transition-colors"
              style={{
                border: '1px dashed var(--accent)',
                color: 'var(--accent)',
                fontFamily: 'var(--mono)',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.14em',
              }}
            >
              + {moreCount} more →
            </Link>
          )}
        </div>

        {/* 4-stat strip */}
        <div
          className="mx-auto mt-16 grid max-w-[1080px] grid-cols-2 overflow-hidden rounded-2xl sm:grid-cols-4"
          style={{
            background: 'rgba(255,255,255,0.06)',
            gap: 1,
            boxShadow: 'var(--shadow)',
          }}
        >
          <StatCell value={toolCount.toLocaleString()} label="tools indexed" />
          <StatCell value="$10" label="/mo to list" />
          <StatCell value={categoryCount.toString()} label="categories" />
          <StatCell value="218k" label="pages crawled" />
        </div>
      </div>
    </section>
  );
}

function StatCell({ value, label }: { value: string; label: string }) {
  return (
    <div
      className="px-7 py-7"
      style={{ background: 'rgba(17,17,20,0.85)' }}
    >
      <div
        className="text-left tabular-nums"
        style={{
          fontFamily: 'var(--sans)',
          fontSize: 'clamp(36px, 4vw, 52px)',
          fontWeight: 600,
          letterSpacing: '-0.03em',
          lineHeight: 1,
          color: '#f4f3f0',
        }}
      >
        {value}
      </div>
      <div
        className="mt-2.5 text-left"
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: 'rgba(244,243,240,0.5)',
        }}
      >
        {label}
      </div>
    </div>
  );
}
