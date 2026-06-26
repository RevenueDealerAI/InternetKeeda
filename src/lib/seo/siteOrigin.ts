/**
 * Canonical site origin — single source of truth.
 *
 * Every SEO-sensitive surface (sitemap, robots, canonical tags,
 * metadataBase, BreadcrumbList JSON-LD, OpenGraph URLs, the legacy
 * /items/* 410 page) must resolve to the SAME origin string. If
 * sitemap advertises `https://internetkeeda.com/x` while the page
 * canonical tag says `https://www.internetkeeda.com/x`, Google logs
 * "Duplicate, Google chose a different canonical" and silently
 * de-indexes one of the variants.
 *
 * Resolution order:
 *   1. process.env.NEXT_PUBLIC_SITE_URL (trailing slash stripped)
 *   2. hardcoded `https://www.internetkeeda.com` (www form)
 *
 * The hardcoded fallback intentionally uses the www subdomain to
 * match the production DNS + the previously hardcoded value in
 * src/app/layout.tsx and src/components/seo/BreadcrumbSSR.tsx. Apex
 * (internetkeeda.com) 301s to www in production, so listing www in
 * the sitemap follows the "canonical is the destination of the
 * redirect, not the source" rule.
 *
 * Never falls back to req.headers.host, vercel.app, or localhost —
 * those would advertise non-canonical hosts to Googlebot if a
 * crawler accidentally reaches a preview deploy.
 */
export const SITE_ORIGIN: string =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://www.internetkeeda.com';

/** Build an absolute URL from a site-relative path. */
export function siteUrl(path: string = '/'): string {
  const p = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_ORIGIN}${p}`;
}
