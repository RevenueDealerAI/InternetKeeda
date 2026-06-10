import Link from 'next/link';
import { ToolCardSSR, type ToolCardData } from './ToolCardSSR';

/**
 * "More tools in {Category}" — 6 to 10 same-category tool cards,
 * server-rendered at the bottom of each /ai-tools/{slug} page.
 *
 * This is the most important addition for crawl-budget flow between
 * sibling tools. Before this, the tool detail page contained zero
 * <a href="/ai-tools/..."> in its initial HTML, so Googlebot had
 * nowhere to walk from one tool to the next.
 *
 * Render rules:
 *   - Card heading links to the category page (extra back-edge).
 *   - 6 minimum, 10 maximum. Below 6 we still render the section to
 *     keep at least some sibling links; above 10 we cap to keep the
 *     anchor budget per page bounded.
 *   - The rail collapses to a single column on phones (no horizontal
 *     scroll — Googlebot's mobile UA renders mobile-first, and we
 *     want every <a> visible without interaction).
 */
export function RelatedToolsRail({
  tools,
  currentCategoryName,
  currentCategorySlug,
}: {
  tools: ToolCardData[];
  currentCategoryName: string;
  currentCategorySlug: string;
}) {
  if (tools.length === 0) return null;

  return (
    <section
      aria-labelledby="related-tools-heading"
      className="mx-auto w-full max-w-[1320px] px-7 py-16"
      style={{ background: 'var(--bg)' }}
    >
      <header className="mb-8 flex flex-col gap-2 sm:flex-row sm:items-baseline sm:justify-between">
        <div>
          <div
            className="text-[10px] uppercase tracking-[0.24em] mb-2"
            style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
          >
            § Related
          </div>
          <h2
            id="related-tools-heading"
            className="m-0 text-[24px] leading-[1.15] font-medium"
            style={{ color: 'var(--ink)', letterSpacing: '-0.025em' }}
          >
            More tools in{' '}
            <Link
              href={`/category/${currentCategorySlug}`}
              style={{ color: 'var(--accent)' }}
              className="underline-offset-4 hover:underline"
            >
              {currentCategoryName}
            </Link>
          </h2>
        </div>
        <Link
          href={`/category/${currentCategorySlug}`}
          className="self-start text-[11px] uppercase tracking-[0.16em] underline-offset-4 hover:underline"
          style={{ color: 'var(--ink-2)', fontFamily: 'var(--mono)' }}
        >
          See all in {currentCategoryName} →
        </Link>
      </header>
      <ul className="grid list-none gap-4 p-0 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5">
        {tools.map((t) => (
          <li key={t.slug}>
            <ToolCardSSR tool={t} />
          </li>
        ))}
      </ul>
    </section>
  );
}
