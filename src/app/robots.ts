import type { MetadataRoute } from 'next';
import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';

/**
 * /robots.txt — App Router file convention. Allows crawlers on the
 * public surface, blocks admin / API / dashboard / auth flows. Points
 * at the dynamic sitemap. Origin comes from the centralized
 * SITE_ORIGIN so robots, sitemap, canonical tags, and metadataBase
 * never disagree about www vs apex.
 */

// Private / non-indexable surfaces. Shared across every crawler rule.
// NOTE: /items (and the other legacy 410 surfaces) is deliberately NOT
// listed. Those URLs return 410 Gone — Google can only DROP a URL from
// its index if it's allowed to crawl it and see the 410. Disallowing
// them in robots.txt is counterproductive: Googlebot never re-fetches,
// never sees the 410, and the stale URLs linger in the index. Let it
// crawl them so they get dropped.
const PRIVATE_DISALLOW = [
  '/admin',
  '/admin/',
  '/api',
  '/api/',
  '/dashboard',
  '/dashboard/',
  '/sign-in',
  '/sign-up',
  '/sign-out',
  '/verify-email',
  '/sso-callback',
];

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/', disallow: PRIVATE_DISALLOW },
      // Explicitly welcome the AI answer-engine crawlers. They don't
      // render JS, so our SSR tool/category pages are exactly what they
      // can consume — being cited by ChatGPT / Claude / Perplexity is a
      // primary discovery channel for a tools directory. Same private
      // disallow list applies.
      { userAgent: 'GPTBot', allow: '/', disallow: PRIVATE_DISALLOW },
      { userAgent: 'OAI-SearchBot', allow: '/', disallow: PRIVATE_DISALLOW },
      { userAgent: 'ChatGPT-User', allow: '/', disallow: PRIVATE_DISALLOW },
      { userAgent: 'ClaudeBot', allow: '/', disallow: PRIVATE_DISALLOW },
      { userAgent: 'Claude-Web', allow: '/', disallow: PRIVATE_DISALLOW },
      { userAgent: 'PerplexityBot', allow: '/', disallow: PRIVATE_DISALLOW },
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
