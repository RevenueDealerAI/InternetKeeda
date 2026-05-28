'use client';

import Link from 'next/link';
import { useState, type FormEvent } from 'react';
import { useCategories } from '@/hooks/useCategories';
import { useMemo } from 'react';

type HeroProps = {
  toolCount: number;
  categoryCount: number;
  onAiSearch?: (query: string) => void;
  aiLoading?: boolean;
  initialQuery?: string;
};

// Reference glyphs — short mono symbols, blood-colored
const CAT_GLYPHS: Record<string, string> = {
  writing: '✦', design: '◆', code: '⌘', image: '◐', audio: '♪',
  video: '▶', research: '?', agents: '△', automation: '⚙',
  voice: '◊', '3d': '▣', vision: '◉', marketing: '$', business: '$',
  productivity: '⚙', chat: '◐', llm: '◐', data: '▣',
};

function glyphFor(name: string): string {
  const key = name.toLowerCase().trim();
  return CAT_GLYPHS[key] || '✦';
}

const TRENDING = [
  { label: 'claude sonnet', href: '/?q=claude+sonnet' },
  { label: 'cursor', href: '/?q=cursor' },
  { label: 'midjourney v7', href: '/?q=midjourney' },
  { label: 'elevenlabs', href: '/?q=elevenlabs' },
  { label: 'runway gen-3', href: '/?q=runway' },
];

export function Hero({
  toolCount,
  categoryCount,
  onAiSearch,
  aiLoading,
  initialQuery = '',
}: HeroProps) {
  const [query, setQuery] = useState(initialQuery);
  const { data: catsData } = useCategories(true, 80);

  const categories = useMemo(() => {
    const sorted = (catsData?.data ?? [])
      .slice()
      .sort((a, b) => (b.toolCount ?? 0) - (a.toolCount ?? 0))
      .slice(0, 12);
    if (sorted.length === 0) {
      // Fallback static set keeps the strip filled before the API responds.
      return [
        { name: 'Writing', slug: 'writing', count: 842 },
        { name: 'Design', slug: 'design', count: 714 },
        { name: 'Code', slug: 'code', count: 623 },
        { name: 'Audio', slug: 'audio', count: 389 },
        { name: 'Video', slug: 'video', count: 512 },
        { name: 'Research', slug: 'research', count: 298 },
        { name: 'Agents', slug: 'agents', count: 221 },
        { name: 'Automation', slug: 'automation', count: 317 },
        { name: '3D', slug: '3d', count: 186 },
        { name: 'Vision', slug: 'vision', count: 241 },
        { name: 'Voice', slug: 'voice', count: 163 },
        { name: 'Marketing', slug: 'marketing', count: 441 },
      ];
    }
    return sorted.map((c) => ({
      name: c.name,
      slug: c.slug ?? c.name.toLowerCase().replace(/\s+/g, '-'),
      count: c.toolCount ?? 0,
    }));
  }, [catsData?.data]);

  const moreCount = Math.max((catsData?.data?.length ?? categoryCount) - 12, 0);

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || !onAiSearch) return;
    onAiSearch(q);
  };

  return (
    <section className="relative px-6 pb-20 pt-40">
      <div className="relative mx-auto max-w-[var(--maxw,1240px)] text-center">
        {/* Status chip */}
        <div
          className="ik-glass inline-flex items-center gap-2.5 rounded-full px-4 py-2"
          style={{ boxShadow: 'var(--shadow-soft)' }}
        >
          <span className="blood-dot" aria-hidden="true" />
          <span className="font-mono-display text-[11px] uppercase tracking-[0.18em] text-[color:var(--fg-dim)]">
            <span style={{ color: 'hsl(var(--foreground))' }}>
              {toolCount.toLocaleString()} tools
            </span>{' '}
            · indexed live ·{' '}
            <span style={{ color: 'hsl(var(--foreground))' }}>
              {categoryCount}
            </span>{' '}
            categories
          </span>
        </div>

        {/* Big logo as the hero mark — replaces the "INTERNET keeda"
            wordmark text. Two <img> tags swap visibility by theme. */}
        <h1 className="m-0 mt-9 mb-0 flex items-center justify-center" aria-label="Internet Keeda">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/branding/logo-light.png"
            alt="Internet Keeda"
            className="ik-logo-light block h-auto w-full max-w-[960px]"
            draggable={false}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/branding/logo-dark.png"
            alt=""
            aria-hidden="true"
            className="ik-logo-dark hidden h-auto w-full max-w-[960px]"
            draggable={false}
          />
        </h1>

        {/* Tagline */}
        <p
          className="mx-auto mt-8 text-[18px] leading-[1.55] text-[color:var(--fg-dim)]"
          style={{ maxWidth: 720 }}
        >
          <span className="font-display-roman italic text-blood">Discover.</span>{' '}
          <span className="font-display-roman italic text-blood">Learn.</span>{' '}
          <span className="font-display-roman italic">Earn.</span>{' '}
          <span className="font-display-roman italic" style={{ color: 'var(--fg-dim)' }}>
            Everything AI
          </span>{' '}
          — a hub built{' '}
          <em
            className="font-display-roman not-italic"
            style={{ fontStyle: 'italic', color: 'var(--fg)' }}
          >
            by people who use AI tools daily
          </em>
          , not a corporate aggregator.
        </p>

        {/* CTAs */}
        <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
          <Link href="/trending" className="btn-blood">
            Enter the web →
          </Link>
          <Link href="/categories" className="btn-ghost">
            Browse catalog
          </Link>
        </div>

        {/* Search bar */}
        <form onSubmit={onSubmit} className="ik-search ik-glass-strong">
          <span className="icon" aria-hidden="true">⌕</span>
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`SEARCH ${toolCount.toLocaleString()} AI TOOLS — TRY 'CODE COMPANION' OR 'LIPSYNC'…`}
            aria-label="AI search the catalog"
            disabled={aiLoading}
          />
          <button
            type="submit"
            disabled={!query.trim() || aiLoading}
            className="btn-blood"
            style={{ padding: '12px 22px' }}
          >
            {aiLoading ? 'Searching…' : 'Search →'}
          </button>
        </form>

        {/* Trending pills */}
        <div
          className="mt-6 flex flex-wrap items-center justify-center gap-2"
          style={{ fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace' }}
        >
          <span className="text-[11px] uppercase tracking-[0.18em] text-[color:var(--muted-color)]">
            Trending:
          </span>
          {TRENDING.map((t) => (
            <Link key={t.label} href={t.href} className="trend-pill">
              {t.label}
            </Link>
          ))}
        </div>

        {/* Category pills */}
        <div className="mt-14 flex flex-wrap items-center justify-center gap-2.5">
          {categories.map((c) => (
            <Link key={c.slug} href={`/category/${c.slug}`} className="cat-pill">
              <span className="glyph" aria-hidden="true">{glyphFor(c.name)}</span>
              <span className="name">{c.name}</span>
              {c.count > 0 && <span className="count">{c.count.toLocaleString()}</span>}
            </Link>
          ))}
          {moreCount > 0 && (
            <Link
              href="/categories"
              className="cat-pill"
              style={{ color: 'var(--blood-color)', borderStyle: 'dashed' }}
            >
              <span className="name">+ {moreCount} more →</span>
            </Link>
          )}
        </div>

        {/* Stats strip — 4 cells with hairline gap-1px dividers */}
        <div className="stats-strip">
          <div className="stat">
            <div className="stat-n">{toolCount.toLocaleString()}</div>
            <div className="stat-l">tools indexed</div>
          </div>
          <div className="stat">
            <div className="stat-n">$10</div>
            <div className="stat-l">/mo to list</div>
          </div>
          <div className="stat">
            <div className="stat-n">{categoryCount}</div>
            <div className="stat-l">categories</div>
          </div>
          <div className="stat">
            <div className="stat-n">218k</div>
            <div className="stat-l">pages indexed</div>
          </div>
        </div>

        {/* Corner hero spider — absolute top-right, hidden on mobile */}
        <div
          className="pointer-events-none absolute hidden lg:block"
          style={{ top: 40, right: -20, width: 220 }}
          aria-hidden="true"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/spider.png"
            alt=""
            className="ik-float-y w-full"
            style={{ filter: 'var(--spider-filter)' }}
          />
        </div>
      </div>
    </section>
  );
}
