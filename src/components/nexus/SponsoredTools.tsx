'use client';

// § sponsored — paid placement (boost packages from /#pricing).
// Pulls real tools whose activeBoosts is non-empty, ranks by boost
// tier weight (featured > home > category) then by votes. Shows up
// to 6 in a 3-col grid. When nothing is currently boosted, falls
// back to top-rated tools and labels them "Editor's pick" instead
// of "Sponsored" so the section never goes empty.

import Link from 'next/link';
import { useMemo } from 'react';
import { ArrowUp, Sparkles } from 'lucide-react';
import { useTools } from '@/lib/api/tools';
import type { Tool } from '@/types/tool';
import { ToolLogo } from './ToolLogo';

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

function boostScore(t: Tool): number {
  return Math.max(0, ...(t.activeBoosts ?? []).map((b) => BOOST_WEIGHT[b] ?? 0));
}
function boostLabel(t: Tool): string | null {
  const boosts = t.activeBoosts ?? [];
  if (boosts.length === 0) return null;
  const best = boosts.slice().sort((a, b) => (BOOST_WEIGHT[b] ?? 0) - (BOOST_WEIGHT[a] ?? 0))[0];
  return BOOST_LABEL[best] ?? 'boosted';
}

export function SponsoredTools() {
  const { data } = useTools({ limit: 60, status: 'published' });
  const all = useMemo(() => data?.data ?? [], [data?.data]);

  const { tools, isSponsored } = useMemo(() => {
    const boosted = all
      .filter((t) => (t.activeBoosts?.length ?? 0) > 0)
      .slice()
      .sort((a, b) => {
        const bw = boostScore(b) - boostScore(a);
        if (bw !== 0) return bw;
        return (b.votes ?? 0) - (a.votes ?? 0);
      });
    if (boosted.length >= 3) return { tools: boosted.slice(0, 6), isSponsored: true };
    // Fallback so the section never goes empty.
    const fallback = all
      .slice()
      .sort((a, b) => (b.rating ?? 0) - (a.rating ?? 0) || (b.votes ?? 0) - (a.votes ?? 0))
      .slice(0, 6);
    return { tools: fallback, isSponsored: false };
  }, [all]);

  return (
    <section
      id="sponsored"
      style={{ padding: '100px 28px 60px', background: 'var(--bg)', color: 'var(--ink)' }}
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
              {isSponsored ? '§ — sponsored' : "§ — editor's pick"}
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
              {isSponsored ? (
                <>
                  In the{' '}
                  <span style={{ fontWeight: 600, color: 'var(--accent)' }}>spotlight</span>{' '}
                  this week.
                </>
              ) : (
                <>
                  Top{' '}
                  <span style={{ fontWeight: 600, color: 'var(--accent)' }}>rated</span> tools in
                  the catalog.
                </>
              )}
            </h2>
            <p
              className="mt-3 max-w-[560px] text-[15px] leading-[1.6]"
              style={{ color: 'var(--ink-2)' }}
            >
              {isSponsored ? (
                <>
                  Tools we&apos;re putting front-and-center this week. Hand-checked from the
                  catalog so every slot still earns its place.{' '}
                  <Link href="/#pricing" style={{ color: 'var(--accent)' }}>
                    Want yours featured?
                  </Link>
                </>
              ) : (
                <>
                  Nothing in the spotlight right now, so we&apos;re showing the highest-rated
                  tools instead. Want yours here?{' '}
                  <Link href="/#pricing" style={{ color: 'var(--accent)' }}>
                    See pricing
                  </Link>
                  .
                </>
              )}
            </p>
          </div>

          {isSponsored && (
            <span
              className="inline-flex items-center gap-1.5 rounded-full px-3 py-1.5"
              style={{
                background: 'var(--accent-soft)',
                border: '1px solid var(--accent)',
                color: 'var(--accent)',
                fontFamily: 'var(--mono)',
                fontSize: 10,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                fontWeight: 600,
              }}
            >
              <Sparkles className="h-3 w-3" strokeWidth={2.4} />
              Spotlight
            </span>
          )}
        </div>

        <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
          {tools.length === 0
            ? Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} />)
            : tools.map((t) => (
                <SponsoredCard
                  key={t._id || t.slug}
                  tool={t}
                  isSponsored={isSponsored}
                />
              ))}
        </div>
      </div>
    </section>
  );
}

function SponsoredCard({ tool, isSponsored }: { tool: Tool; isSponsored: boolean }) {
  const label = boostLabel(tool) ?? (tool.isTopRated ? 'top rated' : 'featured');
  const cat = (tool.category || 'all').toLowerCase().trim();
  const desc = tool.description_ai || tool.description || '';

  return (
    <Link
      href={`/ai-tools/${tool.slug}`}
      className="group relative block rounded-2xl p-5 transition-all duration-300 hover:-translate-y-1"
      style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--rule)',
        boxShadow: 'var(--shadow-sm)',
      }}
      onMouseEnter={(e) =>
        ((e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-accent)')
      }
      onMouseLeave={(e) =>
        ((e.currentTarget as HTMLElement).style.boxShadow = 'var(--shadow-sm)')
      }
    >
      <span
        className="absolute right-4 top-4 inline-flex items-center gap-1.5 rounded-full px-2.5 py-1"
        style={{
          background: isSponsored
            ? 'linear-gradient(135deg, var(--accent), var(--accent-2))'
            : 'var(--surface-2)',
          color: isSponsored ? 'var(--on-accent)' : 'var(--ink)',
          fontFamily: 'var(--mono)',
          fontSize: 9,
          letterSpacing: '0.18em',
          textTransform: 'uppercase',
          fontWeight: 600,
        }}
      >
        {isSponsored && (
          <span
            className="ik-pulse-dot inline-block h-1 w-1 rounded-full"
            style={{ background: '#fff' }}
            aria-hidden="true"
          />
        )}
        {label}
      </span>

      <div className="flex items-start gap-4">
        <ToolLogo tool={tool} size={52} radius={12} />
        <div className="min-w-0 flex-1 pr-16">
          <div
            className="truncate text-[16px] font-semibold"
            style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}
          >
            {tool.name}
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
            /category/{cat}
          </div>
        </div>
      </div>

      <p
        className="mt-4 line-clamp-2 text-[13px] leading-[1.55]"
        style={{ color: 'var(--ink-2)' }}
      >
        {desc}
      </p>

      <div className="mt-4 flex items-center justify-between">
        <span
          className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
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

function Skeleton() {
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
        <div className="h-13 w-13 rounded-xl" style={{ background: 'var(--surface-2)' }} />
        <div className="flex-1">
          <div className="h-4 w-2/3 rounded" style={{ background: 'var(--surface-2)' }} />
          <div className="mt-2 h-3 w-1/3 rounded" style={{ background: 'var(--surface)' }} />
        </div>
      </div>
      <div className="mt-4 h-3 w-3/4 rounded" style={{ background: 'var(--surface)' }} />
    </div>
  );
}
