'use client';

import Link from 'next/link';
import Image from 'next/image';
import { useMemo } from 'react';
import { useTools } from '@/lib/api/tools';
import { getToolLogo } from '@/utils/toolHelpers';
import type { Tool } from '@/types/tool';

const BOOST_LABEL: Record<string, string> = {
  'featured-badge': 'featured',
  'home-rotation': 'home',
  'category-top': 'category',
};

// Higher weight = sits higher in the featured grid.
// Matches the price tiers — Featured Badge ($60/30d) > Home Rotation
// ($30/7d) > Category Top ($12/7d) — so paying more puts you higher.
const BOOST_WEIGHT: Record<string, number> = {
  'featured-badge': 3,
  'home-rotation': 2,
  'category-top': 1,
};

function boostScore(tool: Tool): number {
  if (!tool.activeBoosts || tool.activeBoosts.length === 0) return 0;
  // Use the highest-tier boost on the tool.
  return Math.max(...tool.activeBoosts.map((b) => BOOST_WEIGHT[b] ?? 0));
}

function pickBoostLabel(tool: Tool): string {
  if (tool.activeBoosts && tool.activeBoosts.length > 0) {
    const best = tool.activeBoosts
      .slice()
      .sort((a, b) => (BOOST_WEIGHT[b] ?? 0) - (BOOST_WEIGHT[a] ?? 0))[0];
    return BOOST_LABEL[best] ?? 'boosted';
  }
  if (tool.isTrending) return 'trending';
  if (tool.isNew) return 'new';
  if (tool.isTopRated) return 'top rated';
  return 'listed';
}

function formatVotes(v: number): string {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(1)}K`;
  return v.toLocaleString();
}

export function FeaturedGrid() {
  // Pull a larger pool so we can rank-then-take-6 instead of taking
  // the first 6 the API gave us.
  const { data } = useTools({ limit: 60, status: 'published' });
  const allTools = useMemo(() => data?.data ?? [], [data?.data]);

  // Sort: boost weight DESC (paid tiers first), then votes DESC.
  // If nobody has bought a boost yet, the top 6 by votes still surface.
  const featured = useMemo(() => {
    return allTools
      .slice()
      .sort((a, b) => {
        const bw = boostScore(b) - boostScore(a);
        if (bw !== 0) return bw;
        return (b.votes ?? 0) - (a.votes ?? 0);
      })
      .slice(0, 6);
  }, [allTools]);

  const total = data?.pagination?.totalCount ?? allTools.length;

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
  const logoUrl = getToolLogo(tool);

  return (
    <Link
      href={`/ai-tools/${tool.slug}`}
      className="ik-card group block overflow-hidden rounded-2xl border bg-card"
      style={{ borderColor: 'hsl(var(--border))' }}
    >
      {/* 16:10 thumb — real logo centered on muted paper, with the
          ghost-letter as a faint backdrop so the card still feels
          editorial even when the logo is just a 128px favicon. */}
      <div
        className="relative flex items-center justify-center overflow-hidden bg-muted"
        style={{ aspectRatio: '16 / 10' }}
      >
        {/* Faint serif letter behind the logo — editorial signature */}
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center ik-ghost-letter text-[14rem] leading-none"
        >
          {letter}
        </span>

        {/* Real tool logo — getToolLogo always returns a usable URL
            (favicon / clearbit / ui-avatars fallback). */}
        <div className="relative z-10 flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl border bg-card shadow-sm sm:h-28 sm:w-28"
             style={{ borderColor: 'hsl(var(--border))' }}>
          <Image
            src={logoUrl}
            alt={`${tool.name} logo`}
            fill
            sizes="(max-width: 768px) 96px, 112px"
            className="object-contain p-3"
            unoptimized
          />
        </div>

        {/* Boost badge — paid tier label or fallback */}
        <div className="absolute left-3 top-3 z-20 flex items-center">
          <span className="ik-pill font-mono-display flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[9px] uppercase tracking-[0.2em] text-foreground">
            <span aria-hidden="true" className="h-1.5 w-1.5 rounded-full bg-foreground" />
            {label}
          </span>
        </div>

        {/* Rank */}
        <div className="absolute right-3 top-3 z-20">
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
      <div className="relative bg-muted" style={{ aspectRatio: '16 / 10' }}>
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="h-24 w-24 animate-pulse rounded-2xl bg-foreground/5" />
        </div>
      </div>
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
