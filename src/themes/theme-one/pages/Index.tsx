'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { useTools } from '@/lib/api/tools';
import { useCategories } from '@/hooks/useCategories';
import type { Tool } from '@/types/tool';
import { Hero } from '@/components/nexus/Hero';
import { SponsoredTools } from '@/components/nexus/SponsoredTools';
import { Launches } from '@/components/nexus/Launches';
import { ToolLogo } from '@/components/nexus/ToolLogo';

// Below-fold sections — split into separate chunks so they don't
// block the hero + above-fold paint. ssr:false because every one
// of them is client-driven (data fetches, animations, IntersectionObserver).
const TrendingTools = dynamic(() => import('@/components/nexus/TrendingTools').then(m => m.TrendingTools), { ssr: false });
const AgentSection  = dynamic(() => import('@/components/nexus/AgentSection').then(m => m.AgentSection), { ssr: false });
const CtaCard       = dynamic(() => import('@/components/nexus/CtaCard').then(m => m.CtaCard), { ssr: false });
const BottomCtaBar  = dynamic(() => import('@/components/nexus/BottomCtaBar').then(m => m.BottomCtaBar), { ssr: false });
// Keeda Labs store spotlight — owned by src/features/store, mounted
// here LOWER on the page (between AgentSection and CtaCard) so the
// store stays surgical to the homepage and a theme update can't
// break it. Self-hides when there are no published products.
const FeaturedWorkflowsSection = dynamic(() => import('@/features/store/components/FeaturedWorkflowsSection').then(m => m.FeaturedWorkflowsSection), { ssr: false });
// Nav + Footer are mounted globally in NextRouterAdapter.

const GLYPHS: Record<string, string> = {
  writing: '✦', design: '◆', code: '⌘', image: '◐', audio: '♪',
  video: '▶', research: '?', agents: '△', automation: '⚙',
  voice: '◊', '3d': '▣', vision: '◉', marketing: '$',
};

export default function Index() {
  const urlSearchParams = useSearchParams();

  const { data: toolsData } = useTools({ limit: 60, status: 'published' });
  const { data: categoriesData } = useCategories(true, 80);

  const totalToolCount = useMemo(
    () => toolsData?.pagination?.totalCount ?? toolsData?.data?.length ?? 0,
    [toolsData?.pagination?.totalCount, toolsData?.data?.length],
  );
  const categoryCount = useMemo(
    () => categoriesData?.data?.length ?? 0,
    [categoriesData?.data?.length],
  );

  const categories = useMemo(() => {
    return (categoriesData?.data ?? [])
      .slice()
      .sort((a, b) => (b.toolCount ?? 0) - (a.toolCount ?? 0))
      .slice(0, 12)
      .map((c) => {
        const key = (c.name || '').toLowerCase().trim();
        return {
          name: c.name,
          slug: c.slug ?? key.replace(/\s+/g, '-'),
          count: c.toolCount ?? 0,
          glyph: GLYPHS[key] || '✦',
        };
      });
  }, [categoriesData?.data]);

  // AI search — unchanged functionality.
  const [aiQuery, setAiQuery] = useState<string>('');
  const [aiResults, setAiResults] = useState<Tool[]>([]);
  const [aiLoading, setAiLoading] = useState<boolean>(false);

  const handleAiSearch = useCallback(async (query: string) => {
    const trimmed = query.trim();
    if (!trimmed) return;
    setAiQuery(trimmed);
    setAiLoading(true);
    setAiResults([]);
    try {
      const res = await fetch('/api/tools/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ query: trimmed }),
      });
      if (!res.ok) throw new Error(`AI search failed (${res.status})`);
      const data = await res.json();
      const tools = Array.isArray(data?.tools) ? (data.tools as Tool[]) : [];
      setAiResults(tools);
    } catch (err) {
      console.error('AI search error:', err);
      setAiResults([]);
    } finally {
      setAiLoading(false);
    }
  }, []);

  useEffect(() => {
    const q = urlSearchParams?.get('q');
    if (q && q.trim()) handleAiSearch(q.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const onRun = (e: Event) => {
      const detail = (e as CustomEvent<{ query?: string }>).detail;
      const q = (detail?.query || '').trim();
      if (q) handleAiSearch(q);
    };
    window.addEventListener('ik:run-search', onRun as EventListener);
    return () => window.removeEventListener('ik:run-search', onRun as EventListener);
  }, [handleAiSearch]);

  return (
    <main className="relative" style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
      <Hero
        toolCount={totalToolCount || 5247}
        categoryCount={categoryCount || 42}
        onAiSearch={handleAiSearch}
        aiLoading={aiLoading}
        initialQuery={aiQuery}
        categories={categories}
      />

      {(aiQuery || aiLoading) && (
        <AiResults
          query={aiQuery}
          results={aiResults}
          loading={aiLoading}
          onClear={() => {
            setAiQuery('');
            setAiResults([]);
            setAiLoading(false);
          }}
        />
      )}

      {/* Below-fold blocks wrapped in .ik-cv-auto so the browser
          skips layout/paint for the ones currently off-screen. */}
      <div className="ik-cv-auto">
        <SponsoredTools />
      </div>
      <div className="ik-cv-auto">
        <Launches />
      </div>
      <div className="ik-cv-auto">
        <TrendingTools />
      </div>
      <div className="ik-cv-auto">
        <AgentSection />
      </div>
      {/* Keeda Labs spotlight. Lazy-loaded + self-hides when empty
       * so the homepage is unchanged until a product is published. */}
      <div className="ik-cv-auto">
        <FeaturedWorkflowsSection />
      </div>
      {/* Pricing moved to /dashboard so signed-in users see it
       * post-onboarding. The home page now flows AgentSection →
       * CtaCard without the pricing wall between them. */}
      <div className="ik-cv-auto">
        <CtaCard />
      </div>
      <div className="ik-cv-auto">
        <BottomCtaBar />
      </div>
    </main>
  );
}

function AiResults({
  query,
  results,
  loading,
  onClear,
}: {
  query: string;
  results: Tool[];
  loading: boolean;
  onClear: () => void;
}) {
  return (
    <section
      style={{ padding: '60px 28px', background: 'var(--bg)', color: 'var(--ink)' }}
    >
      <div className="mx-auto max-w-[1320px]">
        <div className="flex flex-wrap items-end justify-between gap-4">
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
              § ai keeda · search
            </div>
            <h2
              className="m-0 mt-3"
              style={{
                fontFamily: 'var(--sans)',
                fontSize: 'clamp(28px, 3.4vw, 40px)',
                fontWeight: 500,
                letterSpacing: '-0.02em',
                color: 'var(--ink)',
              }}
            >
              {loading ? (
                <>
                  Routing{' '}
                  <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
                    &ldquo;{query}&rdquo;
                  </span>
                  …
                </>
              ) : results.length > 0 ? (
                <>
                  <span
                    className="tabular-nums"
                    style={{ fontWeight: 700, color: 'var(--accent)' }}
                  >
                    {results.length}
                  </span>{' '}
                  match{results.length === 1 ? '' : 'es'} for{' '}
                  <span style={{ color: 'var(--ink-soft)' }}>&ldquo;{query}&rdquo;</span>
                </>
              ) : (
                <>
                  No matches for{' '}
                  <span style={{ color: 'var(--ink-soft)' }}>&ldquo;{query}&rdquo;</span>
                </>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="rounded-full px-4 py-2"
            style={{
              border: '1px solid var(--rule)',
              color: 'var(--ink)',
              fontFamily: 'var(--mono)',
              fontSize: 11,
              letterSpacing: '0.18em',
              textTransform: 'uppercase',
            }}
          >
            Clear ×
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-7 grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {results.slice(0, 9).map((t, i) => (
              <Link
                key={t._id || t.slug}
                href={`/ai-tools/${t.slug}`}
                className="rounded-2xl p-5 transition-transform hover:-translate-y-1"
                style={{
                  background: 'var(--bg-2)',
                  border: '1px solid var(--rule)',
                  boxShadow: 'var(--shadow-sm)',
                }}
              >
                <div className="flex items-start gap-4">
                  <div className="shrink-0">
                    <ToolLogo tool={t} size={44} radius={10} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div
                      className="truncate text-[15px] font-semibold"
                      style={{ color: 'var(--ink)' }}
                    >
                      {t.name}
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
                      /category/{(t.category || 'all').toLowerCase()}{' '}
                      <span style={{ color: 'var(--ink-dim)' }}>
                        · #{String(i + 1).padStart(3, '0')}
                      </span>
                    </div>
                  </div>
                </div>
                <p
                  className="mt-3 line-clamp-2 text-[13px] leading-[1.55]"
                  style={{ color: 'var(--ink-2)' }}
                >
                  {t.description_ai || t.description || ''}
                </p>
              </Link>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
