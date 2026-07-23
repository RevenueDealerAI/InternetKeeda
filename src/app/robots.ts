import type { MetadataRoute } from 'next';
import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';

/**
 * /robots.txt — App Router file convention. Allows crawlers on the
 * public surface, blocks admin / API / dashboard / auth flows. Points
 * at the dynamic sitemap. Origin comes from the centralized
 * SITE_ORIGIN so robots, sitemap, canonical tags, and metadataBase
 * never disagree about www vs apex.
 */
export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: [
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
          // Legacy URL surface — returns 410 Gone. Disallow as well so
          // Googlebot stops re-fetching them and burning crawl budget
          // on a known-permanent dead surface.
          '/items',
          '/items/',
        ],
      },
    ],
    sitemap: `${SITE_ORIGIN}/sitemap.xml`,
    host: SITE_ORIGIN,
  };
}
