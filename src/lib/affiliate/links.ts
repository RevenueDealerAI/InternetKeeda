/**
 * SINGLE SOURCE OF TRUTH for affiliate outbound links.
 *
 * How affiliation works on this site (matches the pre-existing
 * pattern from scripts/seed-affiliate-tools.ts): the partner's
 * affiliate URL is stored directly in `Tool.websiteUrl`, and every
 * outbound surface (listing "visit" buttons via window.open, the
 * detail-page Website link) already reads `websiteUrl` — so the
 * click routes through our affiliate link with no per-page wiring.
 *
 * This file is the ONE place the URLs live. To swap a link later:
 *   1. edit the URL here,
 *   2. re-run `npx tsx scripts/seed-affiliate-tools.ts` to push the
 *      new value into every matching Tool.websiteUrl.
 * No page/component edits required.
 *
 * The map is keyed by the tool's `slug` (as it exists in Mongo).
 * `AFFILIATE_SLUGS` / `isAffiliateSlug()` let render code decide
 * whether an outbound link needs rel="sponsored nofollow" + the
 * commission disclosure, WITHOUT hard-coding a list in the UI.
 */

export interface AffiliateLink {
  /** Tool.slug in Mongo. */
  slug: string;
  /** Human brand label (for the seed script / admin reference). */
  brand: string;
  /** The affiliate destination — goes into Tool.websiteUrl. */
  affiliateUrl: string;
  /** The tool's real product domain — used for the favicon logo and
   *  for any "visit <domain>" display label, never as the href. */
  displayDomain: string;
}

export const AFFILIATE_LINKS: AffiliateLink[] = [
  { slug: 'openart',                       brand: 'OpenART',       affiliateUrl: 'https://openartai.pxf.io/dynEzy',                        displayDomain: 'openart.ai' },
  { slug: 'jobscan',                       brand: 'Jobscan',       affiliateUrl: 'https://jobscanco.pxf.io/MA370n',                        displayDomain: 'jobscan.co' },
  { slug: 'phantombuster',                 brand: 'PhantomBuster', affiliateUrl: 'https://phantombuster.com?deal=rajan65&fp_sid=internet', displayDomain: 'phantombuster.com' },
  { slug: 'apify',                         brand: 'Apify',         affiliateUrl: 'https://www.apify.com?fpr=llkl77',                       displayDomain: 'apify.com' },
  { slug: 'hostinger',                     brand: 'Hostinger',     affiliateUrl: 'https://www.hostinger.com/in?REFERRALCODE=CQASUPPORNPY',  displayDomain: 'hostinger.com' },
  { slug: 'mulerun',                       brand: 'MuleRun',       affiliateUrl: 'https://mulerun.pxf.io/k4ZNdv',                          displayDomain: 'mulerun.com' },
  // Two pre-existing ElevenLabs entries share one affiliate link.
  { slug: 'eleven-labs',                   brand: 'ElevenLabs',    affiliateUrl: 'https://try.elevenlabs.io/1l4tf4u9h4r4',                 displayDomain: 'elevenlabs.io' },
  { slug: 'elevenlabs-ai-voice-generator', brand: 'ElevenLabs',   affiliateUrl: 'https://try.elevenlabs.io/1l4tf4u9h4r4',                 displayDomain: 'elevenlabs.io' },
  { slug: 'rork',                          brand: 'Rork',          affiliateUrl: 'https://rork.com/?ref=Internetkeeda',                    displayDomain: 'rork.com' },
  { slug: 'seedance',                      brand: 'Seedance',      affiliateUrl: 'https://seedance.tv?fpr=rajan22&fp_sid=keeeda',          displayDomain: 'seedance.tv' },
  { slug: 'callrail',                      brand: 'CallRail',      affiliateUrl: 'https://partners.callrail.com/8xqpthv34517',             displayDomain: 'callrail.com' },
];

/** Fast membership set of affiliate slugs. */
export const AFFILIATE_SLUGS: ReadonlySet<string> = new Set(
  AFFILIATE_LINKS.map((l) => l.slug),
);

/** True when a tool's outbound link is one of ours (=> needs
 *  rel="sponsored nofollow" + the commission disclosure). */
export function isAffiliateSlug(slug: string | undefined | null): boolean {
  return !!slug && AFFILIATE_SLUGS.has(slug);
}

/** Look up the affiliate URL for a slug, or undefined. */
export function affiliateUrlFor(slug: string | undefined | null): string | undefined {
  if (!slug) return undefined;
  return AFFILIATE_LINKS.find((l) => l.slug === slug)?.affiliateUrl;
}

/** rel value for an outbound tool link. Affiliate links must carry
 *  `sponsored nofollow`; everything else stays as-is elsewhere. */
export function outboundRel(slug: string | undefined | null): string {
  return isAffiliateSlug(slug)
    ? 'sponsored nofollow noopener noreferrer'
    : 'noopener noreferrer';
}

/** Honest, FTC-style commission disclosure shown near affiliate CTAs. */
export const AFFILIATE_DISCLOSURE =
  'We may earn a commission if you sign up through our links — at no cost to you.';
