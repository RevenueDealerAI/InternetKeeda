import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';

/**
 * Server-rendered SoftwareApplication JSON-LD for a single tool.
 *
 * Ships in the INITIAL HTML of every /ai-tools/{slug} page so the two
 * crawler populations that can't run JavaScript still get the tool's
 * real, unique content:
 *   - Googlebot's first (raw-HTML) wave — otherwise it sees only the
 *     nav chrome + an empty client shell for the tool body, which
 *     risks a "Soft 404 / Crawled – not indexed" verdict on a
 *     programmatic page.
 *   - AI crawlers (GPTBot, ClaudeBot, PerplexityBot) that never
 *     render JS — this is the only description of the tool they see.
 *
 * SoftwareApplication is the correct type for a listed AI tool/app.
 * Rating + offers are emitted ONLY when the underlying data is real:
 *   - aggregateRating requires a genuine rating AND a review count,
 *     otherwise Google flags it as spammy structured data.
 *   - offers reflect the tool's own pricing model (free/freemium →
 *     price 0; paid → startingPrice when known).
 *
 * Pure server component — no client hydration, no untrusted eval;
 * every string comes from the DB (sanitised at save time) or a
 * constant origin.
 */

export interface ToolJsonLdInput {
  slug: string;
  name: string;
  category: string;
  description?: string;
  description_ai?: string;
  logo?: string;
  websiteUrl?: string;
  pricing?: { type?: string; startingPrice?: number };
  rating?: number;
  reviews?: number;
  tags?: string[];
}

export function ToolJsonLd({ tool }: { tool: ToolJsonLdInput }) {
  const url = `${SITE_ORIGIN}/ai-tools/${tool.slug}`;
  const rawDesc = (tool.description_ai || tool.description || '')
    .replace(/\s+/g, ' ')
    .trim();
  const description =
    rawDesc.length > 300 ? `${rawDesc.slice(0, 297)}…` : rawDesc;

  const ld: Record<string, unknown> = {
    '@context': 'https://schema.org',
    '@type': 'SoftwareApplication',
    name: tool.name,
    applicationCategory: 'BusinessApplication',
    operatingSystem: 'Web',
    url,
    ...(description ? { description } : {}),
    ...(tool.category ? { applicationSubCategory: tool.category } : {}),
    ...(tool.logo ? { image: tool.logo } : {}),
    ...(Array.isArray(tool.tags) && tool.tags.length
      ? { keywords: tool.tags.slice(0, 12).join(', ') }
      : {}),
  };

  // Offers — only when we can state the price honestly. free/freemium
  // are a genuine $0 entry point; paid needs a known starting price.
  const pType = tool.pricing?.type;
  if (pType === 'free' || pType === 'freemium') {
    ld.offers = {
      '@type': 'Offer',
      price: '0',
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    };
  } else if (
    (pType === 'paid' || pType === 'enterprise') &&
    typeof tool.pricing?.startingPrice === 'number' &&
    tool.pricing.startingPrice > 0
  ) {
    ld.offers = {
      '@type': 'Offer',
      price: String(tool.pricing.startingPrice),
      priceCurrency: 'USD',
      availability: 'https://schema.org/InStock',
    };
  }

  // aggregateRating — only when both a rating AND a review count exist.
  // Emitting a 0/0 rating is invalid structured data and can trigger a
  // manual action, so we gate hard on real signal.
  if (
    typeof tool.rating === 'number' &&
    tool.rating > 0 &&
    typeof tool.reviews === 'number' &&
    tool.reviews > 0
  ) {
    ld.aggregateRating = {
      '@type': 'AggregateRating',
      ratingValue: Number(tool.rating.toFixed(1)),
      reviewCount: tool.reviews,
      bestRating: 5,
      worstRating: 1,
    };
  }

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  );
}
