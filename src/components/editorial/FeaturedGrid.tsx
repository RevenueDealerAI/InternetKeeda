'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { useTools } from '@/lib/api/tools';
import type { Tool } from '@/types/tool';

const BOOST_LABEL: Record<string, string> = {
  'featured-badge': 'featured',
  'home-rotation': 'boosted',
  'category-top': 'category',
};
const BOOST_WEIGHT: Record<string, number> = {
  'featured-badge': 3,
  'home-rotation': 2,
  'category-top': 1,
};

function boostScore(tool: Tool): number {
  if (!tool.activeBoosts || tool.activeBoosts.length === 0) return 0;
  return Math.max(...tool.activeBoosts.map((b) => BOOST_WEIGHT[b] ?? 0));
}
function pickBoostLabel(tool: Tool): string | null {
  if (tool.activeBoosts && tool.activeBoosts.length > 0) {
    const best = tool.activeBoosts
      .slice()
      .sort((a, b) => (BOOST_WEIGHT[b] ?? 0) - (BOOST_WEIGHT[a] ?? 0))[0];
    return BOOST_LABEL[best] ?? null;
  }
  return null;
}

// Short blood-mono glyph for the icon tile.
const ICON_GLYPHS: Record<string, string> = {
  writing: '✦', design: '◆', code: '⌘', image: '◐', audio: '♪',
  video: '▶', research: '?', agents: '△', automation: '⚙',
  voice: '◊', '3d': '▣', vision: '◉', marketing: '$', business: '$',
  productivity: '⚙', chat: '◐', llm: '◐', data: '▣',
};
function glyphFor(category: string): string {
  return ICON_GLYPHS[category?.toLowerCase()?.trim()] || '✦';
}

const TABS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'all', label: 'All time' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function FeaturedGrid() {
  const [activeTab, setActiveTab] = useState<TabId>('today');
  const { data } = useTools({ limit: 60, status: 'published' });
  const allTools = useMemo(() => data?.data ?? [], [data?.data]);

  // Tab filter — uses createdAt to bucket. Falls back gracefully when
  // the database has no recent rows in a bucket.
  const filtered = useMemo(() => {
    if (allTools.length === 0) return [];
    const now = Date.now();
    const cutoff: Record<TabId, number> = {
      today: now - 1 * 24 * 60 * 60 * 1000,
      week: now - 7 * 24 * 60 * 60 * 1000,
      month: now - 30 * 24 * 60 * 60 * 1000,
      all: 0,
    };
    const limit = cutoff[activeTab];
    const tools = allTools.filter((t) => {
      if (limit === 0) return true;
      const created = t.createdAt ? new Date(t.createdAt).getTime() : 0;
      return created >= limit;
    });
    // Always show at least 6 — if the bucket is empty, fall back to all.
    return (tools.length >= 6 ? tools : allTools)
      .slice()
      .sort((a, b) => {
        const bw = boostScore(b) - boostScore(a);
        if (bw !== 0) return bw;
        return (b.votes ?? 0) - (a.votes ?? 0);
      })
      .slice(0, 9);
  }, [allTools, activeTab]);

  const total = data?.pagination?.totalCount ?? allTools.length;
  const remaining = Math.max(total - filtered.length, 0);

  return (
    <section id="featured" className="px-6 py-24">
      <div className="mx-auto max-w-[var(--maxw,1240px)]">
        {/* Section head */}
        <div className="mb-11 flex flex-wrap items-end justify-between gap-5">
          <div>
            <div className="ik-eyebrow">§ 01 — just released</div>
            <h2
              className="m-0 mt-3 font-medium text-foreground"
              style={{
                fontSize: 'clamp(36px, 5vw, 60px)',
                lineHeight: 1.02,
                letterSpacing: '-0.025em',
              }}
            >
              <span style={{ color: 'var(--blood-color)' }}>✦</span> Just{' '}
              <span
                className="font-display-roman italic"
                style={{ color: 'var(--blood-color)', fontWeight: 400 }}
              >
                released
              </span>
            </h2>
          </div>

          <div className="tab-group ik-glass">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                type="button"
                onClick={() => setActiveTab(tab.id)}
                className={activeTab === tab.id ? 'active' : ''}
              >
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tool grid */}
        <div className="grid grid-cols-1 gap-[18px] md:grid-cols-2 lg:grid-cols-3">
          {filtered.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <ToolRowSkeleton key={i} rank={i + 1} />)
            : filtered.map((tool, i) => (
                <ToolRowCard key={tool._id || tool.slug} tool={tool} rank={i + 1} />
              ))}
        </div>

        {/* Load more */}
        <div className="mt-9 text-center">
          <Link href="/top-products" className="btn-ghost">
            Load {remaining > 0 ? remaining.toLocaleString() : ''} more tools →
          </Link>
        </div>
      </div>
    </section>
  );
}

function ToolRowCard({ tool, rank }: { tool: Tool; rank: number }) {
  const label = pickBoostLabel(tool);
  const cat = (tool.category || 'all').toLowerCase().trim();
  const desc = tool.description_ai || tool.description || '';
  const tags = (tool.tags ?? []).slice(0, 3);
  // If no tags, fall back to pricing type + a couple of inferred labels.
  const fallbackTags: string[] = [];
  if (tags.length === 0) {
    if (tool.pricing?.type) fallbackTags.push(tool.pricing.type);
    if (tool.isTrending) fallbackTags.push('trending');
    if (tool.isNew) fallbackTags.push('new');
  }
  const displayTags = tags.length > 0 ? tags : fallbackTags;

  return (
    <Link href={`/ai-tools/${tool.slug}`} className="tool-row-card ik-glass group">
      {label && (
        <span className="boost-badge">
          <span className="ddot" aria-hidden="true" />
          {label}
        </span>
      )}

      <div className="tool-row-icon">{glyphFor(cat)}</div>

      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2.5">
          <h3
            className="m-0 font-semibold text-foreground"
            style={{ fontSize: 16, letterSpacing: '-0.01em' }}
          >
            {tool.name}
          </h3>
          <span
            className="font-mono-display inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px]"
            style={{
              color: 'var(--muted-color)',
              border: '1px solid var(--border-color)',
            }}
          >
            <span style={{ color: 'var(--blood-color)', fontSize: 9 }}>▲</span>
            {(tool.votes ?? 0).toLocaleString()}
          </span>
        </div>

        <div className="font-mono-display mt-1 text-[10px] uppercase tracking-[0.12em] text-[color:var(--muted-color)]">
          /category/{cat}{' '}
          <span style={{ color: 'var(--fg-dim)' }}>· #{String(rank).padStart(3, '0')}</span>
        </div>

        <p
          className="mt-2.5 line-clamp-2 text-[13px] leading-[1.5]"
          style={{ color: 'var(--fg-dim)' }}
        >
          {desc}
        </p>

        <div className="mt-3 flex flex-wrap items-center justify-between gap-1.5">
          <div className="flex flex-wrap gap-1.5">
            {displayTags.map((t) => (
              <span key={t} className="tool-tag">
                {t}
              </span>
            ))}
          </div>
          <span
            className="font-mono-display text-[10px] uppercase tracking-[0.18em] opacity-0 transition-opacity duration-200 group-hover:opacity-100"
            style={{ color: 'var(--blood-color)' }}
          >
            visit →
          </span>
        </div>
      </div>
    </Link>
  );
}

function ToolRowSkeleton({ rank }: { rank: number }) {
  return (
    <div className="tool-row-card ik-glass">
      <div className="tool-row-icon">·</div>
      <div className="min-w-0 flex-1">
        <div className="h-4 w-1/2 rounded bg-foreground/10" />
        <div className="font-mono-display mt-2 text-[10px] uppercase tracking-[0.12em] text-[color:var(--muted-color)]">
          /category/—  · #{String(rank).padStart(3, '0')}
        </div>
        <div className="mt-3 h-3 w-3/4 rounded bg-foreground/5" />
        <div className="mt-2 h-3 w-2/3 rounded bg-foreground/5" />
      </div>
    </div>
  );
}
