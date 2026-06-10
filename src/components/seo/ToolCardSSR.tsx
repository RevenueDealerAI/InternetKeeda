import Link from 'next/link';

/**
 * Minimal server-rendered tool card. Read-only: no upvote, save, or
 * interactive bits — those live on the tool detail page itself. The
 * card's job here is ONE thing: a real `<a href="/ai-tools/{slug}">`
 * in the initial HTML so Google can follow it.
 *
 * Used by RelatedToolsRail (5-up grid) and CategoryToolGrid
 * (3/4-up grid). Layout-neutral — the parent grid controls the
 * columns + gap.
 */

export interface ToolCardData {
  slug: string;
  name: string;
  category?: string;
  description?: string;
  logo?: string;
}

function initials(name: string): string {
  return name
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0]?.toUpperCase() || '')
    .join('');
}

export function ToolCardSSR({ tool }: { tool: ToolCardData }) {
  const href = `/ai-tools/${tool.slug}`;
  const desc =
    (tool.description || '').length > 110
      ? `${(tool.description || '').slice(0, 107)}…`
      : tool.description || '';

  return (
    <article
      className="group relative h-full overflow-hidden rounded-xl transition-transform"
      style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--rule)',
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <Link
        href={href}
        className="block h-full p-5"
        style={{ color: 'var(--ink)' }}
        // No prefetch — these grids can render 24 cards per page.
        // Prefetching all of them would cost ~24 HTTP HEAD requests
        // on hover; we'd rather conserve crawl budget than warm
        // every card.
        prefetch={false}
      >
        <div className="flex items-start gap-3">
          {tool.logo ? (
            // Plain <img> on purpose — these cards sit below the
            // viewport on most loads (related rail at end of tool
            // page; below the fold on category page after card #6).
            // next/image's mandatory layout/sizes ceremony isn't
            // worth it for this surface. Native loading="lazy" is
            // honoured by every modern browser.
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={tool.logo}
              alt=""
              width={40}
              height={40}
              loading="lazy"
              className="h-10 w-10 shrink-0 rounded-md object-cover"
              style={{ background: 'var(--surface)' }}
            />
          ) : (
            <div
              aria-hidden="true"
              className="grid h-10 w-10 shrink-0 place-items-center rounded-md text-[12px] font-semibold"
              style={{
                background: 'var(--surface-2)',
                color: 'var(--ink-2)',
                fontFamily: 'var(--mono)',
              }}
            >
              {initials(tool.name) || '·'}
            </div>
          )}
          <div className="min-w-0">
            <h3
              className="m-0 truncate text-[14px] font-semibold leading-snug"
              style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}
            >
              {tool.name}
            </h3>
            {tool.category && (
              <div
                className="mt-0.5 truncate text-[10px] uppercase tracking-[0.16em]"
                style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
              >
                {tool.category}
              </div>
            )}
          </div>
        </div>
        {desc && (
          <p
            className="mt-3 text-[13px] leading-[1.5]"
            style={{ color: 'var(--ink-2)' }}
          >
            {desc}
          </p>
        )}
      </Link>
    </article>
  );
}
