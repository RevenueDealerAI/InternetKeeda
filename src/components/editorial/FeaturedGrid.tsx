'use client';

import Link from 'next/link';
import { useMemo } from 'react';
import { useTools } from '@/lib/api/tools';
import type { Tool } from '@/types/tool';

const BOOST_LABEL: Record<string, string> = {
  'featured-badge': 'featured',
  'home-rotation': 'home',
  'category-top': 'category',
};

function pickBoostLabel(tool: Tool): string {
  const b = tool.activeBoosts?.[0];
  if (b && BOOST_LABEL[b]) return BOOST_LABEL[b];
  if (tool.isTrending) return 'trending';
  if (tool.isNew) return 'new';
  return 'listed';
}

function formatVotes(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString();
}

export function FeaturedGrid() {
  const { data } = useTools({ limit: 60, status: 'published' });
  const allTools = useMemo(() => data?.data ?? [], [data?.data]);

  // Prefer boosted/featured tools; fall back to top-voted.
  const featured = useMemo(() => {
    const boosted = allTools.filter((t) => (t.activeBoosts?.length ?? 0) > 0);
    const ranked = (boosted.length >= 6 ? boosted : allTools)
      .slice()
      .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
      .slice(0, 6);
    return ranked;
  }, [allTools]);

  const total = data?.pagination?.totalCount ?? data?.data?.length ?? 0;

  return (
    <section id="featured" className="px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          marker="§ 01 — boosted this week"
          title={
            <>
              The <span className="font-display italic">featured</span> grid
            </>
          }
          rightLink={{
            href: '/top-products',
            label: total > 0 ? `view all ${total.toLocaleString()} →` : 'view all →',
          }}
        />

        <div className="mt-12 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {featured.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <CardSkeleton key={i} rank={i + 1} />)
            : featured.map((tool, i) => (
                <FeaturedCard key={tool._id || tool.slug} tool={tool} rank={i + 1} />
              ))}
        </div>
      </div>
    </section>
  );
}

function FeaturedCard({ tool, rank }: { tool: Tool; rank: number }) {
  const label = pickBoostLabel(tool);
  const letter = (tool.name?.[0] || '?').toUpperCase();
  const path = `/category/${(tool.category || 'all').toLowerCase().replace(/\s+/g, '-')}`;
  const rankStr = `#${String(rank).padStart(3, '0')}`;

  return (
    <Link
      href={`/ai-tools/${tool.slug}`}
      className="ik-card group block overflow-hidden rounded-2xl border bg-card"
      style={{ borderColor: 'hsl(var(--border))' }}
    >
      {/* 16:10 thumb with huge ghost letter */}
      <div
        className="relative flex items-center justify-center overflow-hidden bg-muted"
        style={{ aspectRatio: '16 / 10' }}
      >
        <span className="ik-ghost-letter text-[14rem] leading-none">{letter}</span>
        {/* boost badge */}
        <div className="absolute left-3 top-3 flex items-center">
          <span className="ik-pill font-mono-display flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] text-foreground">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-foreground" />
            {label}
          </span>
        </div>
        {/* rank */}
        <div className="absolute right-3 top-3">
          <span className="font-mono-display text-[10px] uppercase tracking-[0.2em] text-foreground/60">
            {rankStr}
          </span>
        </div>
      </div>

      {/* Body */}
      <div className="px-5 pb-5 pt-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-2xl italic leading-tight text-foreground">
            {tool.name}
          </h3>
          <div className="font-mono-display shrink-0 pt-1 text-[12px] tabular-nums text-foreground/70">
            ▲ {formatVotes(tool.votes ?? 0)}
          </div>
        </div>

        <div className="font-mono-display mt-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {path}
        </div>

        <div className="ik-hairline mt-4 h-px w-full" />

        <div className="mt-4 flex items-center justify-between">
          <div className="flex -space-x-1.5">
            <span className="h-5 w-5 rounded-full border-2 border-card bg-foreground/80" />
            <span className="h-5 w-5 rounded-full border-2 border-card bg-foreground/60" />
            <span className="h-5 w-5 rounded-full border-2 border-card bg-foreground/40" />
          </div>
          <span className="font-mono-display text-[10px] uppercase tracking-[0.2em] text-foreground/60 opacity-0 transition-opacity group-hover:opacity-100">
            visit →
          </span>
        </div>
      </div>
    </Link>
  );
}

function CardSkeleton({ rank }: { rank: number }) {
  return (
    <div
      className="ik-card overflow-hidden rounded-2xl border bg-card"
      style={{ borderColor: 'hsl(var(--border))' }}
    >
      <div className="relative bg-muted" style={{ aspectRatio: '16 / 10' }} />
      <div className="px-5 pb-5 pt-4">
        <div className="h-6 w-2/3 rounded bg-muted" />
        <div className="mt-3 h-3 w-1/3 rounded bg-muted" />
        <div className="ik-hairline mt-4 h-px w-full" />
        <div className="mt-4 flex items-center justify-between">
          <span className="font-mono-display text-[10px] uppercase tracking-[0.2em] text-foreground/40">
            #{String(rank).padStart(3, '0')}
          </span>
        </div>
      </div>
    </div>
  );
}

export function SectionHeader({
  marker,
  title,
  rightLink,
}: {
  marker: string;
  title: React.ReactNode;
  rightLink?: { href: string; label: string };
}) {
  return (
    <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
      <div>
        <div className="font-mono-display text-[11px] uppercase tracking-[0.3em] text-muted-foreground">
          {marker}
        </div>
        <h2 className="mt-4 text-4xl font-medium tracking-tight sm:text-5xl md:text-6xl">
          {title}
        </h2>
      </div>
      {rightLink && (
        <Link
          href={rightLink.href}
          className="font-mono-display text-[11px] uppercase tracking-[0.2em] text-foreground/70 hover:text-foreground"
        >
          {rightLink.label}
        </Link>
      )}
    </div>
  );
}
