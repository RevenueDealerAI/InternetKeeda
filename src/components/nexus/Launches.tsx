'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { ArrowUp } from 'lucide-react';
import { useTools } from '@/lib/api/tools';
import type { Tool } from '@/types/tool';

const TABS = [
  { id: 'today', label: 'Today' },
  { id: 'week', label: 'This week' },
  { id: 'month', label: 'This month' },
  { id: 'all', label: 'All time' },
] as const;
type TabId = (typeof TABS)[number]['id'];

const BOOST_WEIGHT: Record<string, number> = {
  'featured-badge': 3,
  'home-rotation': 2,
  'category-top': 1,
};
const BOOST_LABEL: Record<string, string> = {
  'featured-badge': 'featured',
  'home-rotation': 'boosted',
  'category-top': 'category',
};

const GLYPHS: Record<string, string> = {
  writing: '✦', design: '◆', code: '⌘', image: '◐', audio: '♪',
  video: '▶', research: '?', agents: '△', automation: '⚙',
  voice: '◊', '3d': '▣', vision: '◉', marketing: '$',
};

export function Launches() {
  const [tab, setTab] = useState<TabId>('today');
  const { data } = useTools({ limit: 60, status: 'published' });
  const all = useMemo(() => data?.data ?? [], [data?.data]);

  const tools = useMemo(() => {
    const now = Date.now();
    const cutoffs: Record<TabId, number> = {
      today: now - 86_400_000,
      week: now - 7 * 86_400_000,
      month: now - 30 * 86_400_000,
      all: 0,
    };
    const limit = cutoffs[tab];
    const filtered = all.filter((t) => {
      if (limit === 0) return true;
      const created = t.createdAt ? new Date(t.createdAt).getTime() : 0;
      return created >= limit;
    });
    const pool = filtered.length >= 6 ? filtered : all;
    return pool
      .slice()
      .sort((a, b) => {
        const aw = Math.max(0, ...(a.activeBoosts ?? []).map((bt) => BOOST_WEIGHT[bt] ?? 0));
        const bw = Math.max(0, ...(b.activeBoosts ?? []).map((bt) => BOOST_WEIGHT[bt] ?? 0));
        if (bw !== aw) return bw - aw;
        return (b.votes ?? 0) - (a.votes ?? 0);
      })
      .slice(0, 9);
  }, [all, tab]);

  return (
    <section
      id="launches"
      style={{ padding: '120px 28px', background: 'var(--bg)', color: 'var(--ink)' }}
    >
      <div className="mx-auto max-w-[1320px]">
        {/* Section head */}
        <div className="mb-12 flex flex-wrap items-end justify-between gap-5">
          <div>
            <div
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.3em',
                textTransform: 'uppercase',
                color: 'var(--accent)',
              }}
            >
              § 01 — just released
            </div>
            <h2
              className="m-0 mt-3"
              style={{
                fontFamily: 'var(--sans)',
                fontSize: 'clamp(36px, 5vw, 60px)',
                fontWeight: 500,
                lineHeight: 1.02,
                letterSpacing: '-0.025em',
                color: 'var(--ink)',
              }}
            >
              Today&apos;s{' '}
              <span
                style={{
                  fontFamily: 'var(--serif)',
                  fontStyle: 'italic',
                  fontWeight: 400,
                  color: 'var(--accent)',
                }}
              >
                launches
              </span>
              , ranked by humans.
            </h2>
          </div>

          {/* Tabs */}
          <div
            className="inline-flex gap-1 rounded-full p-1"
            style={{
              background: 'var(--surface)',
              border: '1px solid var(--rule)',
            }}
          >
            {TABS.map((t) => {
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTab(t.id)}
                  className="rounded-full px-3.5 py-2 transition-all"
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 11,
                    letterSpacing: '0.14em',
                    textTransform: 'uppercase',
                    color: active ? 'var(--on-accent)' : 'var(--ink-soft)',
                    background: active
                      ? 'linear-gradient(135deg, var(--accent), var(--accent-2))'
                      : 'transparent',
                    boxShadow: active ? 'var(--shadow-accent)' : 'none',
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </div>

        {/* Tool grid */}
        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {tools.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)
            : tools.map((t, i) => <ToolCard key={t._id || t.slug} tool={t} rank={i + 1} />)}
        </div>

        <div className="mt-10 text-center">
          <Link
            href="/top-products"
            className="inline-flex items-center gap-2 rounded-full px-6 py-3.5"
            style={{
              border: '1px solid var(--rule)',
              color: 'var(--ink)',
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            See all launches →
          </Link>
        </div>
      </div>
    </section>
  );
}

function pickBoostLabel(t: Tool): string | null {
  const boosts = t.activeBoosts ?? [];
  if (boosts.length === 0) return null;
  const best = boosts.slice().sort((a, b) => (BOOST_WEIGHT[b] ?? 0) - (BOOST_WEIGHT[a] ?? 0))[0];
  return BOOST_LABEL[best] ?? 'boosted';
}

function ToolCard({ tool, rank }: { tool: Tool; rank: number }) {
  const cat = (tool.category || 'all').toLowerCase().trim();
  const glyph = GLYPHS[cat] || '✦';
  const boost = pickBoostLabel(tool);
  const desc = tool.description_ai || tool.description || '';
  const tags = (tool.tags ?? []).slice(0, 3);

  const onMove = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget;
    const rect = el.getBoundingClientRect();
    const px = (e.clientX - rect.left) / rect.width;
    const py = (e.clientY - rect.top) / rect.height;
    const rx = (0.5 - py) * 8;
    const ry = (px - 0.5) * 8;
    el.style.transform = `perspective(900px) rotateX(${rx}deg) rotateY(${ry}deg) translateZ(0)`;
    el.style.setProperty('--mx', `${px * 100}%`);
    el.style.setProperty('--my', `${py * 100}%`);
  };
  const onLeave = (e: React.MouseEvent<HTMLAnchorElement>) => {
    const el = e.currentTarget;
    el.style.transform = '';
  };

  return (
    <Link
      href={`/ai-tools/${tool.slug}`}
      onMouseMove={onMove}
      onMouseLeave={onLeave}
      className="group relative block overflow-hidden rounded-2xl p-5 transition-all duration-300"
      style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--rule)',
        boxShadow: 'var(--shadow-sm)',
        transformStyle: 'preserve-3d',
      }}
    >
      {/* Radial spotlight inside card following cursor */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            'radial-gradient(circle 180px at var(--mx, 50%) var(--my, 50%), var(--accent-soft), transparent 70%)',
        }}
      />

      {boost && (
        <span
          className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
          style={{
            background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
            color: 'var(--on-accent)',
            fontFamily: 'var(--mono)',
            fontSize: 9,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
          }}
        >
          <span
            className="ik-pulse-dot inline-block h-1 w-1 rounded-full"
            style={{ background: '#fff' }}
            aria-hidden="true"
          />
          {boost}
        </span>
      )}

      <div className="relative flex items-start gap-4">
        <div
          aria-hidden="true"
          className="grid h-12 w-12 shrink-0 place-items-center rounded-xl"
          style={{
            background: 'linear-gradient(135deg, rgba(255,59,59,0.10), rgba(0,0,0,0.4))',
            border: '1px solid var(--rule)',
            color: 'var(--accent)',
            fontFamily: 'var(--mono)',
            fontSize: 18,
          }}
        >
          {glyph}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center justify-between gap-3">
            <div
              className="truncate text-[15px] font-semibold"
              style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}
            >
              {tool.name}
            </div>
            <span
              className="inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5"
              style={{
                border: '1px solid var(--rule)',
                fontFamily: 'var(--mono)',
                fontSize: 10,
                color: 'var(--ink-2)',
              }}
            >
              <ArrowUp className="h-2.5 w-2.5" style={{ color: 'var(--accent)' }} strokeWidth={3} />
              {(tool.votes ?? 0).toLocaleString()}
            </span>
          </div>
          <div
            className="mt-1"
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.12em',
              textTransform: 'uppercase',
              color: 'var(--ink-soft)',
            }}
          >
            /category/{cat}{' '}
            <span style={{ color: 'var(--ink-dim)' }}>
              · #{String(rank).padStart(3, '0')}
            </span>
          </div>
        </div>
      </div>

      <p
        className="relative mt-3 line-clamp-2 text-[13px] leading-[1.55]"
        style={{ color: 'var(--ink-2)' }}
      >
        {desc}
      </p>

      <div className="relative mt-4 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1.5">
          {tags.map((t) => (
            <span
              key={t}
              style={{
                fontFamily: 'var(--mono)',
                fontSize: 9,
                letterSpacing: '0.12em',
                textTransform: 'uppercase',
                padding: '3px 8px',
                borderRadius: 999,
                background: 'var(--surface)',
                border: '1px solid var(--rule)',
                color: 'var(--ink-soft)',
              }}
            >
              {t}
            </span>
          ))}
        </div>
        <span
          className="opacity-0 transition-opacity group-hover:opacity-100"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.18em',
            textTransform: 'uppercase',
            color: 'var(--accent)',
          }}
        >
          visit →
        </span>
      </div>
    </Link>
  );
}

function SkeletonCard() {
  return (
    <div
      className="rounded-2xl p-5"
      style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--rule)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div className="flex gap-4">
        <div
          className="h-12 w-12 shrink-0 rounded-xl"
          style={{ background: 'var(--surface-2)' }}
        />
        <div className="min-w-0 flex-1">
          <div className="h-4 w-2/3 rounded" style={{ background: 'var(--surface-2)' }} />
          <div className="mt-2 h-3 w-1/3 rounded" style={{ background: 'var(--surface)' }} />
        </div>
      </div>
      <div className="mt-4 h-3 w-3/4 rounded" style={{ background: 'var(--surface)' }} />
      <div className="mt-2 h-3 w-2/3 rounded" style={{ background: 'var(--surface)' }} />
    </div>
  );
}
