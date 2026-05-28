'use client';

import Link from 'next/link';
import { Search } from 'lucide-react';
import { useState, type FormEvent } from 'react';
import { CategoryPills } from './CategoryPills';

type HeroProps = {
  toolCount: number;
  categoryCount: number;
  /** Optional: top categories pulled from useCategories. Falls back to a
   * static list if not provided. Decorative — used only in the marquee. */
  marqueeWords?: string[];
  /** AI search handler — when present, the hero search input fires this.
   * If absent, the input is omitted entirely (rather than show fake UI). */
  onAiSearch?: (query: string) => void;
  aiLoading?: boolean;
  initialQuery?: string;
};

const FALLBACK_MARQUEE = [
  'writing', 'design', 'code', 'audio', 'video', 'research',
  'agents', 'automation', '3d', 'vision', 'voice', 'search',
];

export function Hero({
  toolCount,
  categoryCount,
  marqueeWords,
  onAiSearch,
  aiLoading,
  initialQuery = '',
}: HeroProps) {
  const [query, setQuery] = useState(initialQuery);

  const words = (marqueeWords && marqueeWords.length >= 6 ? marqueeWords : FALLBACK_MARQUEE).slice(0, 14);
  const marqueeItems = [...words, ...words];

  const onSubmit = (e: FormEvent) => {
    e.preventDefault();
    const q = query.trim();
    if (!q || !onAiSearch) return;
    onAiSearch(q);
  };

  return (
    <section className="relative px-4 pt-36 pb-24 sm:pt-40 sm:pb-32">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center text-center">
          {/* Live-tools pill — honest copy, no "indexed live" claim */}
          <div className="ik-pill font-mono-display flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-foreground/70">
            <span className="relative flex h-2 w-2">
              <span className="relative inline-flex h-2 w-2 rounded-full bg-foreground"></span>
            </span>
            <span>
              <span className="text-foreground">{toolCount.toLocaleString()} tools</span>
              <span className="mx-2 text-foreground/30">·</span>
              <span>across {categoryCount}+ categories</span>
            </span>
          </div>

          {/* H1 — Geist + italic Instrument Serif accents in blood red */}
          <h1 className="mt-8 text-5xl font-medium tracking-tight leading-[0.95] sm:text-7xl md:text-[5.5rem] lg:text-[7rem]">
            <span className="block">
              <span className="font-display italic text-blood">Discover.</span>{' '}
              <span className="font-display italic text-blood">Learn.</span>{' '}
              <span>Earn.</span>
            </span>
            <span className="block text-foreground/85">
              <span className="font-display italic text-blood">Everything</span>{' '}
              <span className="font-display italic text-blood">AI.</span>
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-base text-muted-foreground sm:text-lg">
            A directory of {toolCount.toLocaleString()}+ AI tools across {categoryCount}+ categories.
            Submitted by builders, ranked by use. Browse by room, search by intent.
          </p>

          {/* AI search input — only renders when a handler is provided */}
          {onAiSearch && (
            <form onSubmit={onSubmit} className="mt-8 w-full max-w-xl">
              <div className="ik-card flex w-full items-center gap-2 rounded-full border bg-card px-4 py-2.5"
                   style={{ borderColor: 'hsl(var(--border))' }}>
                <Search className="h-4 w-4 shrink-0 text-foreground/50" aria-hidden="true" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Describe what you want to do — e.g. transcribe meetings"
                  className="font-display-roman flex-1 bg-transparent text-base italic placeholder:text-foreground/40 focus:outline-none"
                  aria-label="AI search the catalog"
                  disabled={aiLoading}
                />
                <button
                  type="submit"
                  disabled={!query.trim() || aiLoading}
                  className="font-mono-display bg-gradient-blood shadow-blood rounded-full px-3.5 py-1.5 text-[10px] uppercase tracking-[0.2em] text-white transition-transform hover:-translate-y-0.5 disabled:opacity-40 disabled:translate-y-0"
                >
                  {aiLoading ? 'Searching…' : 'Ask →'}
                </button>
              </div>
            </form>
          )}

          <div className="mt-6 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="/trending"
              className="font-mono-display bg-gradient-blood shadow-blood rounded-full px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-white transition-transform hover:-translate-y-0.5"
            >
              Enter the web →
            </Link>
            <Link
              href="/categories"
              className="ik-pill font-mono-display rounded-full px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-white/[0.06]"
            >
              Browse catalog
            </Link>
          </div>

          {/* Category pills strip — real categories, real counts */}
          <CategoryPills />

          {/* Hanging hero spider */}
          <HangingSpider toolCount={toolCount} categoryCount={categoryCount} />

          {/* Stat strip */}
          <div className="mt-16 w-full">
            <StatStrip toolCount={toolCount} categoryCount={categoryCount} />
          </div>
        </div>
      </div>

      {/* Category marquee */}
      <div className="ik-marquee-mask mt-20 overflow-hidden">
        <div className="ik-marquee flex w-max items-center gap-10 whitespace-nowrap text-3xl text-foreground/45 sm:text-4xl md:text-5xl">
          {marqueeItems.map((c, i) => (
            <span key={i} className="flex items-center gap-10">
              <span className="font-display italic">{c.toLowerCase()}</span>
              <span aria-hidden="true" className="text-blood/60">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function HangingSpider({ toolCount, categoryCount }: { toolCount: number; categoryCount: number }) {
  return (
    <div className="relative mt-16 flex h-[26rem] w-full items-start justify-center sm:h-[30rem]">
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 -translate-x-1/2 ik-thread"
        style={{ width: 1, height: '60%' }}
      />

      {/* Outer rig — dangles on the thread (combined X/Y/rotate sway).
          Inner wrapper — fast leg-wiggle so legs ripple while the
          whole spider drifts. */}
      <div className="absolute left-1/2 top-[40%] -translate-x-1/2 ik-dangle">
        <div className="ik-leg-wiggle" style={{ animationDuration: '0.55s' }}>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/spider.png"
            alt="Keeda, the Internet Keeda mascot"
            width={420}
            height={420}
            className="block h-[18rem] w-[18rem] sm:h-[24rem] sm:w-[24rem] md:h-[28rem] md:w-[28rem]"
            style={{ filter: 'var(--spider-glow)' }}
            draggable={false}
          />
        </div>
      </div>

      {/* Only real-data chips. The "crawled / latency" pair was invented;
          dropped per spec. Two honest chips for visual balance. */}
      <SpecChip className="left-[8%] top-[18%]" delay="ik-float-y-slow" label="mascot" value="keeda" />
      <SpecChip
        className="right-[6%] top-[40%]"
        delay="ik-float-y"
        label="catalog"
        value={`${toolCount.toLocaleString()} tools`}
      />
      <SpecChip
        className="left-[12%] bottom-[12%]"
        delay="ik-float-y-fast"
        label="rooms"
        value={`${categoryCount}+ categories`}
      />
    </div>
  );
}

function SpecChip({
  className,
  delay,
  label,
  value,
}: {
  className: string;
  delay: string;
  label: string;
  value: string;
}) {
  return (
    <div className={`absolute ${className} ${delay} ik-pill flex flex-col gap-0.5 rounded-xl px-3 py-2 text-left`}>
      <div className="font-mono-display text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div className="font-display-roman text-base italic text-foreground">{value}</div>
    </div>
  );
}

function StatStrip({ toolCount, categoryCount }: { toolCount: number; categoryCount: number }) {
  const stats = [
    { value: toolCount.toLocaleString(), label: 'tools listed' },
    { value: '$10', label: '/mo to list' },
    { value: `${categoryCount}+`, label: 'categories' },
  ];
  return (
    <div
      className="ik-card mx-auto grid w-full max-w-3xl grid-cols-3 overflow-hidden rounded-2xl border bg-card"
      style={{ borderColor: 'hsl(var(--border))' }}
    >
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={`flex flex-col items-center gap-2 px-6 py-7 ${i !== 0 ? 'border-l' : ''}`}
          style={{ borderColor: 'hsl(var(--border))' }}
        >
          <div className="font-display text-4xl italic leading-none sm:text-5xl">{s.value}</div>
          <div className="font-mono-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
