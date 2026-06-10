import Link from 'next/link';

/**
 * "Browse by category" chip cloud — a server-rendered set of category
 * links. Goal: every category sits within 2 clicks of any page that
 * embeds this block (Home / Tool detail / Category detail).
 *
 * Crawl-graph math (after this ships across tool + category pages):
 *   - Home → /categories: existing link.
 *   - Any tool page → 24 category chips below the related-tools rail
 *     (so a crawler walking from /ai-tools/A can directly reach a
 *      different category without going back through home).
 *   - Any category page → 24 chips to sibling categories.
 *   - Plus a "See all categories →" link to /categories so the
 *     remaining ~654 (since there are 678 total) are one extra hop.
 */

export interface BrowseCategoryRef {
  slug: string;
  name: string;
}

export function BrowseByCategory({
  categories,
  heading = 'Browse by category',
}: {
  categories: BrowseCategoryRef[];
  heading?: string;
}) {
  if (categories.length === 0) return null;

  return (
    <section
      aria-labelledby="browse-by-category-heading"
      className="mx-auto w-full max-w-[1320px] px-7 py-16"
      style={{ background: 'var(--bg)' }}
    >
      <div className="mb-6">
        <div
          className="text-[10px] uppercase tracking-[0.24em] mb-2"
          style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
        >
          § Categories
        </div>
        <h2
          id="browse-by-category-heading"
          className="m-0 text-[22px] leading-[1.15] font-medium"
          style={{ color: 'var(--ink)', letterSpacing: '-0.025em' }}
        >
          {heading}
        </h2>
      </div>
      <ul className="flex list-none flex-wrap gap-2 p-0">
        {categories.map((c) => (
          <li key={c.slug}>
            <Link
              href={`/category/${c.slug}`}
              prefetch={false}
              className="inline-flex items-center rounded-full px-3.5 py-1.5 text-[12px] transition-colors hover:opacity-80"
              style={{
                background: 'var(--surface)',
                border: '1px solid var(--rule)',
                color: 'var(--ink-2)',
              }}
            >
              {c.name}
            </Link>
          </li>
        ))}
        <li>
          <Link
            href="/categories"
            className="inline-flex items-center rounded-full px-3.5 py-1.5 text-[12px] font-semibold uppercase tracking-[0.16em] transition-opacity hover:opacity-90"
            style={{
              background: 'var(--accent)',
              color: 'var(--on-accent)',
              fontFamily: 'var(--mono)',
            }}
          >
            See all categories →
          </Link>
        </li>
      </ul>
    </section>
  );
}
