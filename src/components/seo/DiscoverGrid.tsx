import Link from 'next/link';
import { indexableWave, indexableCategories } from '@/lib/seo/wave';
import { ToolCardSSR } from './ToolCardSSR';
import { BrowseByCategory } from './BrowseByCategory';

/**
 * Homepage "Explore the index" section — an ASYNC SERVER component.
 *
 * THE fix for the reported root cause: the homepage HTML served to
 * Googlebot (and to JS-blind AI crawlers) contained only nav + footer
 * links and ZERO links to any tool page, so all ~5,000 tool URLs were
 * orphans discoverable only via the sitemap — and Google never crawled
 * them ("Discovered – currently not indexed").
 *
 * This block ships real `<a href="/ai-tools/{slug}">` (top 48 tools of
 * the current wave) and `<a href="/category/{slug}">` (top 24
 * categories) in the INITIAL server HTML, straight from the site's
 * highest-authority page. It is intentionally NOT inside the
 * `ThemeOneIndex` 'use client' boundary and does NOT fetch in a hook —
 * it renders on the server so the links are in the raw HTML.
 *
 * Rendered at the bottom of the homepage content, directly above the
 * global footer (DOM order in NextRouterAdapter is Nav → children →
 * Footer), so it reads as a natural directory index without disturbing
 * the Nexus hero/sections above it.
 */
export async function DiscoverGrid() {
  // 48 tools for the grid; 24 categories for the chip row. Both come
  // from the same wave/quality source as the sitemap, so the homepage
  // and the sitemap advertise a consistent priority set.
  const [tools, allCategories] = await Promise.all([
    indexableWave(48),
    indexableCategories(),
  ]);
  // Top 24 categories by tool count for the chip row (indexableCategories
  // returns every category clearing the floor, biggest first).
  const categories = allCategories.slice(0, 24);

  if (tools.length === 0 && categories.length === 0) return null;

  return (
    <>
      <section
        aria-labelledby="discover-index-heading"
        className="mx-auto w-full max-w-[1320px] px-7 pt-16 pb-4"
        style={{ background: 'var(--bg)' }}
      >
        <div className="mb-8">
          <div
            className="text-[10px] uppercase tracking-[0.24em] mb-3"
            style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
          >
            § Explore the index
          </div>
          <h2
            id="discover-index-heading"
            className="m-0 text-[28px] leading-[1.1] font-medium"
            style={{
              color: 'var(--ink)',
              letterSpacing: '-0.03em',
              fontFamily: 'var(--sans)',
            }}
          >
            Hand-picked tools,{' '}
            <em style={{ fontFamily: 'var(--serif)', fontStyle: 'italic' }}>
              ranked
            </em>{' '}
            for you.
          </h2>
          <p className="m-0 mt-3 text-[14px]" style={{ color: 'var(--ink-2)' }}>
            A starting slice of the 5,000+ tool atlas. Dig into a category to
            see the full list.
          </p>
        </div>

        {tools.length > 0 && (
          <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {tools.map((t) => (
              <li key={t.slug}>
                <ToolCardSSR
                  tool={{ slug: t.slug, name: t.name, category: t.category, logo: t.logo }}
                />
              </li>
            ))}
          </ul>
        )}

        <div className="mt-8">
          <Link
            href="/categories"
            className="inline-flex items-center rounded-full px-5 py-2.5 text-[12px] font-semibold uppercase tracking-[0.16em] transition-opacity hover:opacity-90"
            style={{
              background: 'var(--accent)',
              color: 'var(--on-accent)',
              fontFamily: 'var(--mono)',
            }}
          >
            Enter the full index →
          </Link>
        </div>
      </section>

      <BrowseByCategory
        categories={categories.map((c) => ({ slug: c.slug, name: c.name }))}
        heading="Browse by category"
      />
    </>
  );
}
