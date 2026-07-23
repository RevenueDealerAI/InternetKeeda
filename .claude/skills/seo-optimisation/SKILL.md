---
name: seo-optimisation
description: Practical SEO and indexing playbook to take a page from "it exists" to "it's in Google" and then improve its chances of ranking. Use this whenever the user works on SEO, getting pages indexed, Google Search Console / GSC, sitemaps, robots.txt, canonical tags, "discovered/crawled – currently not indexed", soft 404s, noindex leaks, on-page optimisation (title, meta, H1, JSON-LD/structured data, Open Graph), Core Web Vitals, internal linking, IndexNow or the Indexing API, or asks why a site isn't ranking or indexing — especially Next.js and React/Vite SPA sites where client-side rendering blocks indexing. Walk the ordered workflow (render → not-blocked → discoverable → submit → on-page code → monitor), map every GSC Page Indexing status to its fix, and be honest about the line between getting indexed and actually ranking.
---

# SEO Optimisation (indexing-first)

Take a page from "it exists" to "it's indexed," then improve its odds of ranking. **Order
matters** — most failures are eligibility/discovery problems (steps 1-4), not anything you do
in Search Console. Work top-down; a perfect title can't save a page Google can't render.

**Scope honesty up front:** this gets a page INDEXED. Ranking and traffic are a separate,
slower game decided by content quality and competition. Indexing is necessary, not sufficient.

---

## The thing that breaks indexing most often
Google indexes in two waves: raw HTML first, JavaScript rendering later. A client-rendered
SPA (React/Vite/CRA, or a Next.js page fetching in the browser) serves an empty
`<div id="root">` in wave one → Google indexes it empty, files a **soft 404**, or never
promotes it past "Discovered." AI crawlers (GPTBot, ClaudeBot, PerplexityBot) don't run JS at
all. **Test like a crawler:** View Source (not the DevTools Elements panel) or `curl` the URL.
No real text in the body = the problem. Fix = put content in the initial HTML via SSR/SSG/ISR
or pre-rendering. **This is an engineering change, not a GSC setting.**

## Part A — Pre-flight (is the page eligible?)
1. **HTTP 200** — not a 3xx/4xx/5xx (confirm with URL Inspection → Test Live URL).
2. **Content in the initial HTML** — highest-leverage check for SPA/JS sites.
3. **Not blocked by robots.txt** — and JS/CSS/`/_next/` assets aren't blocked either.
4. **No `noindex`** — neither a meta tag nor an `X-Robots-Tag` header (check response headers; a
   leftover staging noindex is the classic post-launch killer).
5. **Canonical is correct** — self-referencing/absolute, right host, not pointing at a redirect,
   identical to the sitemap + internal-link URL.
6. **One host, one trailing-slash rule** — everything else 301s to it.
7. **Mobile-friendly** — indexing is mobile-first.
8. **Real, unique value** — thin/duplicate/doorway pages get "Crawled – not indexed."

## Part B — Make it discoverable
9. **Internal links** — link from pages Google already crawls (hub + related). Orphans are the
   #1 cause of "Discovered – not indexed" at scale. Strongest, cheapest lever.
10. **XML sitemap** — canonical URLs only, accurate `<lastmod>`, 200/indexable only; use a
    sitemap index (≤50k URLs each) for large sites. A dirty sitemap teaches Google to distrust it.
11. **A few external mentions** to genuinely important pages help seed discovery.

## Part C — Submit + nudge (Search Console)
12. **Verify a Domain property** (DNS TXT) — covers http/https, www/non-www, subdomains.
13. **Submit the sitemap** in GSC → Sitemaps and reference it in robots.txt
    (`Sitemap: https://host/sitemap.xml`). The public sitemap "ping" endpoint was **retired in
    2023** — GSC submission is the way now.
14. **URL Inspection → Request Indexing** for a *handful* of priority URLs (~a dozen/day quota,
    not a bulk tool). Hundreds un-indexed → fix discovery + quality instead.
15. **IndexNow** notifies Bing/Yandex/Naver/Seznam → feeds ChatGPT Search, Copilot, DuckDuckGo.
    **Google does not participate (2026)** — IndexNow does nothing for Google. Keep the key file
    reachable (a 404 on it fails submissions silently).
16. **Bing Webmaster Tools** — verify + submit there too; cheap, and it's the index behind several
    AI assistants.
17. **(Optional) Google Indexing API** — officially only JobPosting/BroadcastEvent, 200/day;
    treat as unsupported-but-sometimes-helpful, never the primary path.

## Part D — On-page code each page needs
- unique `<title>` (~≤60 chars) + `<meta name="description">` (~140-160 chars)
- exactly one `<h1>`, logical H2/H3, scannable, with a TL;DR / key-takeaways block
- `<link rel="canonical">`, Open Graph + Twitter tags
- JSON-LD (Article, BreadcrumbList, FAQPage, Organization) **in the initial HTML**
- mobile-friendly + good Core Web Vitals (LCP, INP, CLS)
- robots.txt with a `Sitemap:` line; clean, canonical sitemap.xml
(See the PDF for copy-able `<head>`, robots.txt, sitemap.xml, Next.js `metadata`, and JSON-LD.)

## Part E — Diagnose with the Page Indexing report
Sort "Why pages aren't indexed" by affected-page count; fix the biggest bucket first; Inspect a
sample to confirm cause; apply fix; click **Validate Fix**; recheck in days-to-weeks.

| Status | Means | Fix |
|---|---|---|
| Discovered – not indexed | found, not crawled (budget/weak links/low value) | internal links, speed, prune thin, don't dump pages |
| Crawled – not indexed | crawled, judged not worth it (thin/dupe) | make it better + distinct, or consolidate |
| Soft 404 | 200 but empty — SPA shell | render server-side; real 404s should return 404 |
| Excluded by 'noindex' | noindex tag/header present | remove it from pages you want indexed |
| Blocked by robots.txt | a Disallow hits a wanted page | unblock; robots blocks crawl, noindex blocks index |
| Duplicate, wrong canonical | Google chose a different canonical | explicit self-canonical; align links + sitemap |
| Redirect / 404 / 5xx | URL redirects or errors | submit the final URL; fix or 301 |

**Usually fine (don't "fix"):** Alternate page with proper canonical; intentional noindex on
tag/admin/thank-you; intentional 301s; intentional robots blocks on search/faceted params.

## Part F — Programmatic / large sites
Unique value per page (no doorway pages); `noindex` thin variants until filled; launch in waves
watching the indexed-vs-discovered ratio; strong internal linking; clean, chunked, regenerated
sitemap.

## Measuring AI-surface performance
Google now offers a **generative AI performance report in Search Console** (rolling out to
selected owners, opt-out available). It reports **impressions** with page/country/device
breakdowns but **no click data** — Google says it will add metrics over time but hasn't said
which or when. Don't promise clients AI-Overview click numbers from GSC; they aren't there yet.
Separately, if the user manages presence on Instagram/TikTok/X/YouTube, note that GSC now has
**platform properties** (a new property type) to see how those social/video posts perform on
Search and Discover — verify by authorizing the platform in the property selector.

## After indexing — what actually moves ranking
Indexing is the floor. Ranking depends on: genuinely useful, distinct content that matches
intent; E-E-A-T signals; internal + earned external links; speed/CWV; and freshness. None of it
matters if the page isn't indexed first — but indexing alone won't rank a thin page. Treat this
playbook as the prerequisite, not the finish line.

## Output when auditing a real site
(1) one-line verdict on eligibility (usually the rendering check), (2) pass/fail run through
Parts A-C with evidence, (3) the GSC statuses present + fixes, (4) the concrete next action.
Lead with the blocker suppressing the most pages.

## Changelog
- 2026-07-18: Added "Measuring AI-surface performance" note — GSC generative AI performance report (impressions only, no clicks, opt-out) per https://www.searchenginejournal.com/google-puts-a-number-on-ai-search-clicks-without-the-data/582755/ ; and GSC platform properties for Instagram/TikTok/X/YouTube per https://developers.google.com/search/blog/2026/07/search-console-social-video-platforms
