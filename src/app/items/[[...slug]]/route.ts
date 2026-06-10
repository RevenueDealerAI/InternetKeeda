/**
 * Legacy `/items/*` URL handler — returns HTTP 410 Gone.
 *
 * Why this exists:
 * `internetkeeda.com` previously hosted a WordPress + marketplace
 * theme (CodeCanyon-style) that used `/items/{slug}` as the
 * permalink for digital downloads. When the site migrated to this
 * Next.js codebase that whole URL surface was dropped. Google still
 * has 64+ of those URLs in its index from past crawls and keeps
 * retrying them.
 *
 * The default behaviour was a generic 404, which tells Google "the
 * URL might come back" — so it keeps re-crawling, eating crawl
 * budget that should go to the real `/ai-tools/{slug}` pages
 * (which is why only 1 page is currently indexed of ~5,000).
 *
 * 410 Gone is the explicit "permanently gone, drop it" signal. The
 * optional catch-all `[[...slug]]` matches:
 *   - /items                        (bare)
 *   - /items/events-calendar-pro    (single segment)
 *   - /items/a/b/c                  (any depth)
 *
 * Single file, no DB calls, fully static body cached at the edge.
 */

import { NextRequest } from 'next/server';

const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://www.internetkeeda.com';

// Built once at module load — never rebuilt per request. The body is
// intentionally minimal: Google reads the 410 status code and the
// `noindex` X-Robots-Tag; the canonical + the human text are for
// search engines that ignore 410 and for the rare human who clicks
// through from a cached SERP link.
const BODY = `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex, nofollow">
<link rel="canonical" href="${BASE_URL}/">
<title>Gone · Internet Keeda</title>
<style>
  html, body { background:#0a0a0c; color:#f4f3f0; margin:0; padding:0; }
  body { font-family: ui-sans-serif, system-ui, -apple-system, "Segoe UI", Roboto, sans-serif; }
  main { max-width: 560px; margin: 0 auto; padding: 120px 24px 80px; text-align: center; }
  .label { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 11px; letter-spacing: 0.24em; text-transform: uppercase; color:#ff3b3b; }
  h1 { font-size: 30px; letter-spacing: -0.025em; font-weight: 600; margin: 12px 0 16px; }
  p { color: rgba(244,243,240,0.7); line-height: 1.6; margin: 0 0 28px; font-size: 15px; }
  a.pill { display:inline-flex; align-items:center; padding: 14px 28px; border-radius: 999px; background:#ff3b3b; color:#fff; font-family: ui-monospace, monospace; font-size: 12px; letter-spacing: 0.16em; text-transform: uppercase; font-weight: 700; text-decoration: none; }
  a.pill:hover { transform: translateY(-1px); }
</style>
</head>
<body>
<main>
  <div class="label">§ 410 · gone</div>
  <h1>This page no longer exists.</h1>
  <p>The URL you tried isn't part of Internet Keeda. It looks like leftover content from a previous occupant of this domain.</p>
  <a class="pill" href="/">Browse 5,000+ AI tools →</a>
</main>
</body>
</html>`;

function gone() {
  return new Response(BODY, {
    status: 410,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      // The 410 status will never change for these URLs — cache at
      // the edge so we don't burn function invocations on Googlebot.
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      // Belt-and-suspenders for crawlers that prefer the header form
      // of the noindex directive over the meta tag.
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}

export async function GET(_req: NextRequest) {
  return gone();
}

// Some crawlers (Googlebot included) probe with HEAD before GET. If
// we don't answer HEAD, the framework returns 405, which would log
// noise without changing the index outcome — answer it explicitly
// with the same 410 + headers but no body.
export async function HEAD(_req: NextRequest) {
  return new Response(null, {
    status: 410,
    headers: {
      'Content-Type': 'text/html; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
      'X-Robots-Tag': 'noindex, nofollow',
    },
  });
}
