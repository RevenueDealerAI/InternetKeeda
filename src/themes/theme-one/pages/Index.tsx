'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useTools } from '@/lib/api/tools';
import { useCategories } from '@/hooks/useCategories';
import { getToolLogo } from '@/utils/toolHelpers';
import type { Tool } from '@/types/tool';
import { Nav } from '@/components/editorial/Nav';
import { Hero } from '@/components/editorial/Hero';
import { FeaturedGrid } from '@/components/editorial/FeaturedGrid';
import { Sections } from '@/components/editorial/Sections';
import { Pricing } from '@/components/editorial/Pricing';
import { Footer } from '@/components/editorial/Footer';

// Single-route editorial composition matching the design reference.
// Every surface uses theme tokens (var(--bg), var(--fg), var(--blood),
// hsl(var(--card)), etc.) so the light↔dark toggle in the Nav applies
// to the whole page in one click.
export default function Index() {
  const urlSearchParams = useSearchParams();

  // Real catalog counts for the Hero pill + stat strip.
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

  // AI search state — wired to /api/tools/ai-search.
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

  // Mobile FAB hook — keeps the existing floating search button wired
  // into this page's AI search flow.
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
      <Nav />

      <main>
        <Hero
          toolCount={totalToolCount || 5247}
          categoryCount={categoryCount || 42}
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

        <FeaturedGrid />
        <Sections />
        <Pricing />
      </main>

      <Footer />
    </div>
  );
}

// Inline AI search results section — themed cards.
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
    <section className="px-6 py-14">
      <div className="mx-auto max-w-[var(--maxw,1240px)]">
        <div className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-center">
          <div>
            <div className="ik-eyebrow">§ ai search</div>
            <h2
              className="m-0 mt-2 font-medium text-foreground"
              style={{ fontSize: 'clamp(24px, 3vw, 32px)', letterSpacing: '-0.02em' }}
            >
              {loading ? (
                <>
                  Looking up{' '}
                  <span
                    className="font-display-roman italic"
                    style={{ color: 'var(--blood-color)', fontWeight: 400 }}
                  >
                    &ldquo;{query}&rdquo;
                  </span>
                  …
                </>
              ) : results.length > 0 ? (
                <>
                  <span
                    className="font-display-roman italic"
                    style={{ color: 'var(--blood-color)', fontWeight: 400 }}
                  >
                    {results.length}
                  </span>{' '}
                  match{results.length === 1 ? '' : 'es'} for{' '}
                  <span
                    className="font-display-roman italic"
                    style={{ color: 'var(--fg-dim)', fontWeight: 400 }}
                  >
                    &ldquo;{query}&rdquo;
                  </span>
                </>
              ) : (
                <>
                  No AI matches for{' '}
                  <span
                    className="font-display-roman italic"
                    style={{ color: 'var(--fg-dim)', fontWeight: 400 }}
                  >
                    &ldquo;{query}&rdquo;
                  </span>
                </>
              )}
            </h2>
          </div>
          <button type="button" onClick={onClear} className="btn-ghost">
            Clear ×
          </button>
        </div>

        {results.length > 0 && (
          <div className="mt-8 grid grid-cols-1 gap-[18px] md:grid-cols-2 lg:grid-cols-3">
            {results.slice(0, 9).map((tool, i) => (
              <AiResultCard key={tool._id || tool.slug} tool={tool} rank={i + 1} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function AiResultCard({ tool, rank }: { tool: Tool; rank: number }) {
  const cat = (tool.category || 'all').toLowerCase().trim();
  const desc = tool.description_ai || tool.description || '';
  const logoUrl = getToolLogo(tool);

  return (
    <Link href={`/ai-tools/${tool.slug}`} className="tool-row-card ik-glass group">
      <div className="tool-row-icon" style={{ overflow: 'hidden', padding: 8 }}>
        <Image
          src={logoUrl}
          alt={`${tool.name} logo`}
          width={48}
          height={48}
          className="rounded-md object-contain"
          unoptimized
        />
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-2">
          <h3
            className="m-0 font-semibold text-foreground"
            style={{ fontSize: 15, letterSpacing: '-0.01em' }}
          >
            {tool.name}
          </h3>
          {tool.votes ? (
            <span
              className="font-mono-display inline-flex items-center gap-1 rounded-full px-2 py-1 text-[11px]"
              style={{ color: 'var(--muted-color)', border: '1px solid var(--border-color)' }}
            >
              <span style={{ color: 'var(--blood-color)', fontSize: 9 }}>▲</span>
              {tool.votes.toLocaleString()}
            </span>
          ) : null}
        </div>
        <div className="font-mono-display mt-1 text-[10px] uppercase tracking-[0.12em] text-[color:var(--muted-color)]">
          /category/{cat} <span style={{ color: 'var(--fg-dim)' }}>· #{String(rank).padStart(3, '0')}</span>
        </div>
        <p
          className="mt-2.5 line-clamp-2 text-[13px] leading-[1.5]"
          style={{ color: 'var(--fg-dim)' }}
        >
          {desc}
        </p>
      </div>
    </Link>
  );
}
