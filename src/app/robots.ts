import type { MetadataRoute } from 'next';

/**
 * /robots.txt — App Router file convention. Allows crawlers on the
 * public surface, blocks admin / API / dashboard. Points at the
 * dynamic sitemap.
 *
 * `FRONTEND_URL` should be set in production (Vercel env). Falls back
 * to the canonical domain so the rule still serves a usable sitemap
 * line on first deploy.
 */
export default function robots(): MetadataRoute.Robots {
  const baseUrl =
    process.env.FRONTEND_URL?.replace(/\/$/, '') ||
    'https://internetkeeda.com';

  return {
    rules: [
      {
        userAgent: '*',
        allow: '/',
        disallow: ['/admin', '/admin/', '/api', '/api/', '/dashboard'],
      },
    ],
    sitemap: `${baseUrl}/sitemap.xml`,
    host: baseUrl,
  };
}
