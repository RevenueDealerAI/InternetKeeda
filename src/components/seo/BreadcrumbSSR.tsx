import Link from 'next/link';

/**
 * Server-rendered breadcrumb + schema.org BreadcrumbList JSON-LD.
 *
 * Two purposes:
 *   1. Adds 1-2 crawlable internal links per tool/category page back
 *      to parents (Home, /categories, /category/{slug}).
 *   2. Emits BreadcrumbList structured data so Google can render the
 *      breadcrumb in SERP results, which lifts CTR.
 *
 * Pure server component — links are in the initial HTML, no client
 * hydration needed.
 */

export interface BreadcrumbItem {
  /** Display label. */
  label: string;
  /** Absolute or absolute-path href. Omit for the current page (last
   *  item is non-linked by convention). */
  href?: string;
}

export function BreadcrumbSSR({
  items,
  origin = 'https://www.internetkeeda.com',
}: {
  items: BreadcrumbItem[];
  /** Absolute origin used to build the JSON-LD `item` URLs. Defaults
   *  to the canonical prod origin. */
  origin?: string;
}) {
  if (items.length === 0) return null;

  const ldJson = {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((it, i) => ({
      '@type': 'ListItem',
      position: i + 1,
      name: it.label,
      ...(it.href
        ? {
            item: it.href.startsWith('http')
              ? it.href
              : `${origin.replace(/\/$/, '')}${it.href}`,
          }
        : {}),
    })),
  };

  return (
    <>
      <nav
        aria-label="Breadcrumb"
        className="mx-auto w-full max-w-[1320px] px-7 pt-6 pb-2"
        style={{ fontFamily: 'var(--mono)' }}
      >
        <ol
          className="flex flex-wrap items-center gap-2 text-[11px] uppercase tracking-[0.18em]"
          style={{ color: 'var(--ink-soft)' }}
        >
          {items.map((it, i) => (
            <li key={`${i}-${it.label}`} className="flex items-center gap-2">
              {i > 0 && (
                <span aria-hidden="true" style={{ color: 'var(--ink-dim)' }}>
                  ›
                </span>
              )}
              {it.href ? (
                <Link
                  href={it.href}
                  className="transition-colors hover:underline"
                  style={{ color: 'var(--ink-2)' }}
                >
                  {it.label}
                </Link>
              ) : (
                <span style={{ color: 'var(--ink)' }} aria-current="page">
                  {it.label}
                </span>
              )}
            </li>
          ))}
        </ol>
      </nav>
      <script
        type="application/ld+json"
        // Server-rendered JSON-LD. The shape is fully controlled by us
        // and contains no untrusted strings — labels come from the DB
        // (sanitized at save time) and the origin is a constant.
        dangerouslySetInnerHTML={{ __html: JSON.stringify(ldJson) }}
      />
    </>
  );
}
