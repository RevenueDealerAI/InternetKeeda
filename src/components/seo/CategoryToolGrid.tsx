import Link from 'next/link';
import { ToolCardSSR, type ToolCardData } from './ToolCardSSR';

/**
 * Server-rendered grid of tool cards for /category/{slug} pages. The
 * single biggest crawl-budget unlock in this branch: before, the
 * category page contained zero <a href="/ai-tools/..."> in its
 * initial HTML — Googlebot landed on a category, saw nothing, walked
 * away. After this, every published tool in the category appears as
 * a real anchor in the SSR HTML, and pagination is real <a href> too.
 *
 * Pagination notes:
 *   - Pagination links use ?page=N query strings against the same
 *     category slug, which is canonical and stays self-referencing.
 *   - We cap the visible page-number row at 7 (current ± 3) plus
 *     first/last so the chrome stays bounded on big categories.
 *   - First/last and prev/next links exist on every page so a
 *     crawler can walk forward and backward without state.
 */

export const CATEGORY_TOOLS_PER_PAGE = 24;

export function CategoryToolGrid({
  tools,
  categoryName,
  categorySlug,
  page,
  totalCount,
}: {
  tools: ToolCardData[];
  categoryName: string;
  categorySlug: string;
  /** 1-based current page. */
  page: number;
  /** Total tool count across all pages in this category. */
  totalCount: number;
}) {
  const totalPages = Math.max(1, Math.ceil(totalCount / CATEGORY_TOOLS_PER_PAGE));
  const start = (page - 1) * CATEGORY_TOOLS_PER_PAGE + 1;
  const end = Math.min(totalCount, page * CATEGORY_TOOLS_PER_PAGE);

  const hrefFor = (n: number) =>
    n === 1 ? `/category/${categorySlug}` : `/category/${categorySlug}?page=${n}`;

  // Window of page numbers around the current page. Always include 1
  // and totalPages; show up to 7 surrounding pages in the middle.
  const pageNumbers = buildPageWindow(page, totalPages);

  return (
    <section
      aria-labelledby="category-grid-heading"
      className="mx-auto w-full max-w-[1320px] px-7 pt-10 pb-12"
    >
      <header className="mb-8">
        <div
          className="text-[10px] uppercase tracking-[0.24em] mb-3"
          style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
        >
          § {totalCount.toLocaleString()} tool{totalCount === 1 ? '' : 's'} ·{' '}
          page {page} of {totalPages}
        </div>
        <h1
          id="category-grid-heading"
          className="m-0 text-[40px] leading-[1.05] font-medium"
          style={{
            color: 'var(--ink)',
            letterSpacing: '-0.03em',
            fontFamily: 'var(--sans)',
          }}
        >
          AI tools in <em style={{ fontFamily: 'var(--serif)', fontStyle: 'italic' }}>{categoryName}</em>
        </h1>
        {totalCount > 0 && (
          <p
            className="m-0 mt-3 text-[14px]"
            style={{ color: 'var(--ink-2)' }}
          >
            Showing {start}–{end} of {totalCount.toLocaleString()} hand-curated
            tools in this category.
          </p>
        )}
      </header>

      {tools.length === 0 ? (
        <div
          className="rounded-xl p-8 text-center text-[14px]"
          style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--rule)',
            color: 'var(--ink-2)',
          }}
        >
          No tools published in this category yet. Check{' '}
          <Link href="/latest-launches" style={{ color: 'var(--accent)' }}>
            recent launches
          </Link>{' '}
          or{' '}
          <Link href="/categories" style={{ color: 'var(--accent)' }}>
            browse other categories
          </Link>
          .
        </div>
      ) : (
        <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {tools.map((t) => (
            <li key={t.slug}>
              <ToolCardSSR tool={t} />
            </li>
          ))}
        </ul>
      )}

      {totalPages > 1 && (
        <nav
          aria-label="Category pagination"
          className="mt-10 flex flex-wrap items-center justify-center gap-2"
          style={{ fontFamily: 'var(--mono)' }}
        >
          {page > 1 && (
            <PaginationLink href={hrefFor(page - 1)} rel="prev">
              ← Prev
            </PaginationLink>
          )}
          {pageNumbers.map((n, i) =>
            n === '…' ? (
              <span
                key={`gap-${i}`}
                className="px-2 text-[12px]"
                style={{ color: 'var(--ink-soft)' }}
              >
                …
              </span>
            ) : (
              <PaginationLink
                key={n}
                href={hrefFor(n)}
                aria-current={n === page ? 'page' : undefined}
                active={n === page}
              >
                {n}
              </PaginationLink>
            )
          )}
          {page < totalPages && (
            <PaginationLink href={hrefFor(page + 1)} rel="next">
              Next →
            </PaginationLink>
          )}
        </nav>
      )}
    </section>
  );
}

/** Builds the windowed page-number row: [1, …, p-2, p-1, p, p+1, p+2, …, last]. */
function buildPageWindow(page: number, totalPages: number): Array<number | '…'> {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  const window: Array<number | '…'> = [1];
  const start = Math.max(2, page - 2);
  const end = Math.min(totalPages - 1, page + 2);
  if (start > 2) window.push('…');
  for (let i = start; i <= end; i++) window.push(i);
  if (end < totalPages - 1) window.push('…');
  window.push(totalPages);
  return window;
}

function PaginationLink({
  href,
  children,
  active,
  ...rest
}: {
  href: string;
  children: React.ReactNode;
  active?: boolean;
} & React.AnchorHTMLAttributes<HTMLAnchorElement>) {
  return (
    <Link
      href={href}
      prefetch={false}
      className="inline-flex min-w-[36px] items-center justify-center rounded-full px-3 py-1.5 text-[12px] uppercase tracking-[0.12em] transition-colors hover:opacity-90"
      style={
        active
          ? {
              background: 'var(--accent)',
              color: 'var(--on-accent)',
              fontWeight: 700,
            }
          : {
              background: 'var(--surface)',
              border: '1px solid var(--rule)',
              color: 'var(--ink-2)',
            }
      }
      {...rest}
    >
      {children}
    </Link>
  );
}
