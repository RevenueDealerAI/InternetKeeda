import Link from 'next/link';
import { slugifyCategoryName } from '@/lib/seo/slugify';
import { formatTextIntoParagraphs } from '@/utils/textFormatter';
import {
  isAffiliateSlug,
  outboundRel,
  AFFILIATE_DISCLOSURE,
} from '@/lib/affiliate/links';

/**
 * Server-rendered article for /ai-tools/{slug}.
 *
 * WHY THIS EXISTS — the soft-404 fix. The interactive tool detail
 * (AIToolDetail, a client component) fetches its data in the browser,
 * so the tool's real prose — name, description, features, pricing —
 * only exists AFTER JavaScript runs. Google's first (raw-HTML) wave
 * and JS-blind AI crawlers (GPTBot/ClaudeBot) saw an empty "Loading…"
 * shell and filed the page as "Soft 404 / not indexable".
 *
 * This component renders that same core content as real HTML in the
 * INITIAL server response. It is handed to <AIToolDetailClient/> as
 * the `isLoading` fallback, so:
 *   - No-JS crawler  → sees this article, permanently. Real content.
 *   - Real visitor   → sees this for the frame(s) before the theme
 *     provider resolves, then the client swaps in the full
 *     interactive UI. The two never render at once (one replaces the
 *     other via the isLoading branch), so there is no visible
 *     double-render and no duplicated DOM.
 *
 * Pure server component — no hooks, no client JS, deterministic
 * output (safe for hydration). Every string comes from the DB
 * (sanitised at save) or a constant.
 */

export interface ToolArticleData {
  slug: string;
  name: string;
  category: string;
  description?: string;
  description_ai?: string;
  logo?: string;
  websiteUrl?: string;
  pricing?: { type?: string; startingPrice?: number };
  features?: string[];
  tags?: string[];
  rating?: number;
  reviews?: number;
}

function pricingLabel(pricing?: { type?: string; startingPrice?: number }): string | null {
  if (!pricing?.type) return null;
  const t = pricing.type;
  if (t === 'free') return 'Free';
  if (t === 'freemium') return 'Freemium';
  if (t === 'enterprise') return 'Enterprise';
  if (t === 'paid') {
    return typeof pricing.startingPrice === 'number' && pricing.startingPrice > 0
      ? `Paid · from $${pricing.startingPrice}`
      : 'Paid';
  }
  return null;
}

export function ToolArticleSSR({ tool }: { tool: ToolArticleData }) {
  const categorySlug = slugifyCategoryName(tool.category);
  const rawDesc = (tool.description_ai || tool.description || '').trim();
  const paragraphs = formatTextIntoParagraphs(rawDesc);
  const price = pricingLabel(tool.pricing);
  const features = (tool.features || []).filter((f) => f && f.trim().length > 0);
  const tags = (tool.tags || []).filter((t) => t && t.trim().length > 0);
  const hasRating =
    typeof tool.rating === 'number' &&
    tool.rating > 0 &&
    typeof tool.reviews === 'number' &&
    tool.reviews > 0;

  return (
    <article
      className="mx-auto w-full max-w-[1320px] px-7 py-8"
      style={{ color: 'var(--ink)' }}
    >
      <header className="flex items-start gap-4">
        {tool.logo && (
          // Plain <img> (not next/image) — this is fallback HTML that
          // the client view replaces on hydration; no need to pull it
          // through the image optimiser.
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={tool.logo}
            alt={`${tool.name} logo`}
            width={56}
            height={56}
            className="h-14 w-14 rounded-xl object-contain"
            style={{ background: 'var(--surface)' }}
          />
        )}
        <div>
          <h1
            className="text-3xl font-semibold tracking-tight sm:text-4xl"
            style={{ letterSpacing: '-0.03em' }}
          >
            {tool.name}
          </h1>
          <p
            className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm"
            style={{ color: 'var(--ink-2)' }}
          >
            <Link
              href={`/category/${categorySlug}`}
              className="hover:underline"
              style={{ color: 'var(--ink-2)' }}
            >
              {tool.category}
            </Link>
            {price && (
              <>
                <span aria-hidden="true" style={{ color: 'var(--ink-dim)' }}>
                  ·
                </span>
                <span>{price}</span>
              </>
            )}
            {hasRating && (
              <>
                <span aria-hidden="true" style={{ color: 'var(--ink-dim)' }}>
                  ·
                </span>
                <span>
                  ★ {tool.rating!.toFixed(1)} ({tool.reviews} reviews)
                </span>
              </>
            )}
          </p>
        </div>
      </header>

      <div
        className="prose prose-neutral mt-6 max-w-3xl"
        style={{ color: 'var(--ink-2)' }}
      >
        {paragraphs.length > 0 ? (
          paragraphs.map((p, i) => (
            <p key={i} className="mb-4 leading-relaxed">
              {p}
            </p>
          ))
        ) : rawDesc ? (
          <p className="mb-4 leading-relaxed">{rawDesc}</p>
        ) : null}
      </div>

      {features.length > 0 && (
        <section className="mt-8 max-w-3xl">
          <h2 className="text-xl font-semibold" style={{ color: 'var(--ink)' }}>
            Key features
          </h2>
          <ul className="mt-3 list-disc space-y-1 pl-5" style={{ color: 'var(--ink-2)' }}>
            {features.map((f, i) => (
              <li key={i}>{f}</li>
            ))}
          </ul>
        </section>
      )}

      {tags.length > 0 && (
        <p className="mt-6 text-sm" style={{ color: 'var(--ink-soft)' }}>
          <span style={{ fontFamily: 'var(--mono)' }}>Tags: </span>
          {tags.join(', ')}
        </p>
      )}

      {tool.websiteUrl && (
        <p className="mt-8">
          <a
            href={tool.websiteUrl}
            target="_blank"
            rel={outboundRel(tool.slug)}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
          >
            Visit {tool.name} →
          </a>
        </p>
      )}

      {isAffiliateSlug(tool.slug) && (
        <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          {AFFILIATE_DISCLOSURE}
        </p>
      )}
    </article>
  );
}
