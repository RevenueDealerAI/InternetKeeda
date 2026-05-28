'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTools } from '@/lib/api/tools';
import { useCategories } from '@/hooks/useCategories';
import { getToolLogo } from '@/utils/toolHelpers';
import type { Tool } from '@/types/tool';
import { Hero as EditorialHero } from '@/components/editorial/Hero';
import { FeaturedGrid as EditorialFeaturedGrid } from '@/components/editorial/FeaturedGrid';
import { Sections as EditorialSections } from '@/components/editorial/Sections';
import { Pricing as EditorialPricing } from '@/components/editorial/Pricing';

// Single-route editorial composition. Every surface in this page uses
// the theme tokens (--background, --foreground, --card, --blood, etc.)
// so the toggle between light and dark applies to the whole layout
// with no per-page work.
export default function Index() {
  const router = useRouter();
  const urlSearchParams = useSearchParams();

  // -- Data: real catalog counts feed the Hero pill + stat strip.
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
  const marqueeWords = useMemo(() => {
    const sorted = (categoriesData?.data ?? [])
      .slice()
      .sort((a, b) => (b.toolCount ?? 0) - (a.toolCount ?? 0))
      .map((c) => c.name)
      .filter((n): n is string => typeof n === 'string' && n.length > 0)
      .slice(0, 14);
    return sorted.length >= 6 ? sorted : undefined;
  }, [categoriesData?.data]);

  // -- AI search — same handler the OG homepage used, just wired into
  // the editorial Hero search input + inline results section.
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
      const res = await fetch('/api/tools/ai-search', {
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

  const clearAiSearch = useCallback(() => {
    setAiQuery('');
    setAiResults([]);
    setAiLoading(false);
  }, []);

  // URL ?q= deep-link auto-runs AI search on mount.
  useEffect(() => {
    const q = urlSearchParams?.get('q');
    if (q && q.trim()) handleAiSearch(q.trim());
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mobile FAB hooks — keeps the floating search button on every page
  // wired into this page's AI search flow.
  useEffect(() => {
    const onRunSearch = (e: Event) => {
      const detail = (e as CustomEvent<{ query?: string }>).detail;
      const q = (detail?.query || '').trim();
      if (q) handleAiSearch(q);
    };
    window.addEventListener('ik:run-search', onRunSearch as EventListener);
    return () => window.removeEventListener('ik:run-search', onRunSearch as EventListener);
  }, [handleAiSearch]);

  return (
    <div className="relative min-h-screen">
      <EditorialHero
        toolCount={totalToolCount || 5247}
        categoryCount={categoryCount || 42}
        marqueeWords={marqueeWords}
        onAiSearch={handleAiSearch}
        aiLoading={aiLoading}
        initialQuery={aiQuery}
      />

      {(aiQuery || aiLoading) && (
        <AiResultsSection
          query={aiQuery}
          results={aiResults}
          loading={aiLoading}
          onClear={clearAiSearch}
        />
      )}

      <EditorialFeaturedGrid />

      <EditorialSections />

      <EditorialPricing />
    </div>
  );
}

// Inline AI results — appears between Hero and FeaturedGrid when a
// search is active. Uses the same card surface as FeaturedGrid so the
// look is cohesive in both themes.
function AiResultsSection({
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
    <section className="px-4 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="font-mono-display text-[10px] uppercase tracking-[0.3em] text-muted-foreground">
              § ai search
            </div>
            <h2 className="mt-2 text-2xl font-medium tracking-tight sm:text-3xl">
              {loading ? (
                <>
                  Looking up matches for{' '}
                  <span className="font-display italic text-blood">&ldquo;{query}&rdquo;</span>…
                </>
              ) : results.length > 0 ? (
                <>
                  <span className="font-display italic text-blood">{results.length}</span>{' '}
                  match{results.length === 1 ? '' : 'es'} for{' '}
                  <span className="font-display italic">&ldquo;{query}&rdquo;</span>
                </>
              ) : (
                <>
                  No AI matches for{' '}
                  <span className="font-display italic">&ldquo;{query}&rdquo;</span>
                </>
              )}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClear}
            className="ik-pill font-mono-display rounded-full px-3.5 py-1.5 text-[11px] uppercase tracking-[0.2em] text-foreground hover:text-blood"
          >
            Clear ×
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
            {results.slice(0, 9).map((tool) => (
              <AiResultCard key={tool._id || tool.slug} tool={tool} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function AiResultCard({ tool }: { tool: Tool }) {
  const letter = (tool.name?.[0] || '?').toUpperCase();
  const path = `/category/${(tool.category || 'all').toLowerCase().replace(/\s+/g, '-')}`;
  const logoUrl = getToolLogo(tool);

  return (
    <Link
      href={`/ai-tools/${tool.slug}`}
      className="ik-card group block overflow-hidden rounded-2xl"
    >
      <div
        className="relative flex items-center justify-center overflow-hidden bg-muted"
        style={{ aspectRatio: '16 / 10' }}
      >
        <span
          aria-hidden="true"
          className="absolute inset-0 flex items-center justify-center ik-ghost-letter text-[10rem] leading-none"
        >
          {letter}
        </span>
        <div
          className="relative z-10 flex h-20 w-20 items-center justify-center overflow-hidden rounded-2xl border bg-card shadow-sm"
          style={{ borderColor: 'hsl(var(--card-edge))' }}
        >
          <Image
            src={logoUrl}
            alt={`${tool.name} logo`}
            fill
            sizes="80px"
            className="object-contain p-2.5"
            unoptimized
          />
        </div>
      </div>
      <div className="px-5 pb-5 pt-4">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl italic leading-tight text-foreground">
            {tool.name}
          </h3>
          {tool.votes ? (
            <div className="font-mono-display shrink-0 pt-1 text-[12px] tabular-nums text-foreground/70">
              ▲ {tool.votes.toLocaleString()}
            </div>
          ) : null}
        </div>
        <div className="font-mono-display mt-2 text-[10px] uppercase tracking-[0.18em] text-muted-foreground">
          {path}
        </div>
        <p className="mt-3 line-clamp-2 text-sm text-foreground/75">
          {tool.description_ai || tool.description}
        </p>
      </div>
    </Link>
  );
}
