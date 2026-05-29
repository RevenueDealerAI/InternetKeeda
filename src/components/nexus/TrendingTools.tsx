'use client';

// § trending this week — organic ranking from real votes.
// Pulls tools, prefers ones flagged isTrending, then sorts by votes
// DESC. Compact 2-col list layout so it reads as a leaderboard,
// not just another grid.

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowUp, TrendingUp } from 'lucide-react';
import { useTools } from '@/lib/api/tools';
import type { Tool } from '@/types/tool';
import { ToolLogo } from './ToolLogo';

export function TrendingTools() {
  const { data } = useTools({ limit: 60, status: 'published' });
  const all = useMemo(() => data?.data ?? [], [data?.data]);

  const tools = useMemo(() => {
    const trendingPool = all.filter((t) => t.isTrending);
    const pool = trendingPool.length >= 8 ? trendingPool : all;
    return pool
      .slice()
      .sort((a, b) => (b.votes ?? 0) - (a.votes ?? 0))
      .slice(0, 10);
  }, [all]);

  return (
    <section
      id="trending"
      style={{ padding: '60px 28px 100px', background: 'var(--bg)', color: 'var(--ink)' }}
    >
      <div className="mx-auto max-w-[1320px]">
        <div className="mb-10 flex flex-wrap items-end justify-between gap-5">
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
              § — trending this week
            </div>
            <h2
              className="m-0 mt-3"
              style={{
                fontFamily: 'var(--sans)',
                fontSize: 'clamp(32px, 4.5vw, 52px)',
                fontWeight: 500,
                lineHeight: 1.05,
                letterSpacing: '-0.025em',
                color: 'var(--ink)',
              }}
            >
              What everyone is{' '}
              <span style={{ fontWeight: 600, color: 'var(--accent)' }}>upvoting</span>.
            </h2>
            <p
              className="mt-3 max-w-[560px] text-[15px] leading-[1.6]"
              style={{ color: 'var(--ink-2)' }}
            >
              Live ranking from real votes — no paid placement here. Refreshed continuously.
            </p>
          </div>
          <Link
            href="/trending"
            className="inline-flex items-center gap-2 rounded-full px-4 py-2.5"
            style={{
              border: '1px solid var(--rule)',
              color: 'var(--ink)',
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            <TrendingUp className="h-3.5 w-3.5" style={{ color: 'var(--accent)' }} strokeWidth={2.5} />
            See full ranking →
          </Link>
        </div>

        <div
          className="grid grid-cols-1 overflow-hidden rounded-2xl md:grid-cols-2"
          style={{
            background: 'var(--rule)',
            gap: 1,
            border: '1px solid var(--rule)',
            boxShadow: 'var(--shadow-sm)',
          }}
        >
          {tools.length === 0
            ? Array.from({ length: 6 }).map((_, i) => <RowSkeleton key={i} rank={i + 1} />)
            : tools.map((t, i) => <TrendingRow key={t._id || t.slug} tool={t} rank={i + 1} />)}
        </div>
      </div>
    </section>
  );
}

function TrendingRow({ tool, rank }: { tool: Tool; rank: number }) {
  const cat = (tool.category || 'all').toLowerCase().trim();
  const desc = tool.description_ai || tool.description || '';
  return (
    <Link
      href={`/ai-tools/${tool.slug}`}
      className="group flex items-center gap-4 p-5 transition-colors"
      style={{ background: 'var(--bg-2)' }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLElement).style.background =
          'color-mix(in oklab, var(--accent-soft) 100%, transparent)')
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLElement).style.background = 'var(--bg-2)')
      }
    >
      <span
        className="grid h-9 w-9 shrink-0 place-items-center rounded-full"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--rule)',
          fontFamily: 'var(--mono)',
          fontSize: 12,
          fontWeight: 600,
          color: rank <= 3 ? 'var(--accent)' : 'var(--ink-soft)',
        }}
      >
        {String(rank).padStart(2, '0')}
      </span>

      <ToolLogo tool={tool} size={44} radius={10} />

      <div className="min-w-0 flex-1">
        <div
          className="truncate text-[15px] font-semibold"
          style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}
        >
          {tool.name}
        </div>
        <div
          className="truncate text-[12px]"
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 10,
            letterSpacing: '0.12em',
            textTransform: 'uppercase',
            color: 'var(--ink-soft)',
          }}
        >
          /category/{cat}
        </div>
        <p
          className="m-0 mt-1.5 line-clamp-1 text-[12px]"
          style={{ color: 'var(--ink-2)' }}
        >
          {desc}
        </p>
      </div>

      <span
        className="inline-flex shrink-0 items-center gap-1 rounded-full px-2.5 py-1"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--rule)',
          fontFamily: 'var(--mono)',
          fontSize: 11,
          color: 'var(--ink-2)',
        }}
      >
        <ArrowUp className="h-3 w-3" style={{ color: 'var(--accent)' }} strokeWidth={3} />
        {(tool.votes ?? 0).toLocaleString()}
      </span>
    </Link>
  );
}

function RowSkeleton({ rank }: { rank: number }) {
  return (
    <div className="flex items-center gap-4 p-5" style={{ background: 'var(--bg-2)' }}>
      <span
        className="grid h-9 w-9 place-items-center rounded-full"
        style={{
          background: 'var(--surface)',
          border: '1px solid var(--rule)',
          fontFamily: 'var(--mono)',
          fontSize: 12,
          color: 'var(--ink-soft)',
        }}
      >
        {String(rank).padStart(2, '0')}
      </span>
      <div
        className="h-11 w-11 shrink-0 rounded-lg"
        style={{ background: 'var(--surface-2)' }}
      />
      <div className="min-w-0 flex-1">
        <div className="h-4 w-2/3 rounded" style={{ background: 'var(--surface-2)' }} />
        <div className="mt-2 h-3 w-1/3 rounded" style={{ background: 'var(--surface)' }} />
      </div>
    </div>
  );
}
