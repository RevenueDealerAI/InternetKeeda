import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';
import { BRAND } from '@/lib/brand';

/**
 * Review JSON-LD for a reviewed tool. Author is our Organization (not a
 * person — these are editorial desk reviews). itemReviewed is the
 * SoftwareApplication. Deliberately NO aggregateRating and NO
 * reviewRating: the site publishes no numeric score, and emitting a
 * fabricated rating on a monetised page invites a structured-data
 * manual action. Ships in the initial HTML.
 */

export interface ReviewJsonLdInput {
  slug: string;
  name: string;
  category?: string;
  author: string;
  reviewedAt: string | Date;
  body: string;
}

export function ReviewJsonLd({ tool }: { tool: ReviewJsonLdInput }) {
  const url = `${SITE_ORIGIN}/ai-tools/${tool.slug}`;
  const datePublished =
    tool.reviewedAt instanceof Date
      ? tool.reviewedAt.toISOString().slice(0, 10)
      : String(tool.reviewedAt).slice(0, 10);
  const snippet = tool.body.replace(/\s+/g, ' ').replace(/##\s*/g, '').trim().slice(0, 500);

  const ld = {
    '@context': 'https://schema.org',
    '@type': 'Review',
    url,
    datePublished,
    reviewBody: snippet,
    author: { '@type': 'Organization', name: BRAND.name, url: SITE_ORIGIN },
    publisher: { '@type': 'Organization', name: BRAND.name, url: SITE_ORIGIN },
    itemReviewed: {
      '@type': 'SoftwareApplication',
      name: tool.name,
      applicationCategory: 'BusinessApplication',
      operatingSystem: 'Web',
      ...(tool.category ? { applicationSubCategory: tool.category } : {}),
      url,
    },
  };

  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{ __html: JSON.stringify(ld) }}
    />
  );
}
