---
name: gsc-indexing
description: Get web pages indexed by Google and diagnose why they aren't. Use this skill whenever the user mentions Google Search Console / GSC, getting pages indexed, "discovered – currently not indexed", "crawled – currently not indexed", soft 404s, submitting or validating a sitemap, requesting indexing, why a page isn't showing up in Google, IndexNow, the Indexing API, or indexing a new / relaunched / programmatic site — even if they only say "my pages aren't ranking", "Google can't find my site", or "nothing's getting indexed". Walk the full pre-flight → submit → diagnose → monitor workflow and map every Page Indexing report status to its cause and fix. Especially relevant for Next.js and React/Vite SPA sites where client-side rendering blocks indexing.
---

# Getting Pages Indexed in Google

The goal of this skill is narrow and concrete: take a page from "it exists" to "it's in Google's index." Ranking is a separate, later problem — a page can't rank if it isn't indexed, so fix indexing first.

The order below matters. Most indexing failures are caused by steps 1-8 (the page isn't actually eligible or discoverable), not by anything you do in Search Console. Submitting a broken page to GSC harder does not help. Work top-down and stop spamming "Request Indexing" until the pre-flight passes.

## The one thing that breaks indexing most often

Google indexes in **two waves**: it reads the raw HTML first, then queues the page for JavaScript rendering hours-to-weeks later. If a page renders its real content client-side (a typical React/Vite/Angular SPA, or a Next.js page that fetches data in the browser), the first wave sees an empty shell — and Google frequently indexes it as empty, files it as a **soft 404**, or never promotes it from "Discovered". AI crawlers (GPTBot, ClaudeBot, PerplexityBot, Bytespider) don't render JavaScript at all, so for them client-rendered content simply doesn't exist.

**Test it the way a crawler sees it:** view the page's *source* (not the DevTools "Elements" panel, which shows the post-JS DOM), or fetch it with curl. If the `<body>` is a near-empty `<div id="root">`/`<div id="app">` with no real content, that is the problem, and no amount of GSC submission fixes it. The fix is to put the content in the initial HTML via SSR, SSG, or ISR (Next.js `generateStaticParams` + `revalidate`, or pre-rendering for a Vite SPA). Put JSON-LD in the initial HTML too.

---

## Part A — Pre-flight: is the page actually eligible?

Run every item. Use GSC's **URL Inspection → Test Live URL** to verify most of these against the real Googlebot fetch.

1. **HTTP 200.** The URL returns 200, not a 3xx redirect, 4xx, or 5xx. Live-test confirms the fetched status.
2. **Content in the initial HTML** (see above). The single highest-leverage check for SPA/JS sites.
3. **Not blocked by robots.txt** — and JS/CSS/asset paths (e.g. `/_next/`) are *not* blocked, or Google can't render the page.
4. **No `noindex`** — neither a `<meta name="robots" content="noindex">` in the rendered HTML nor an `X-Robots-Tag: noindex` HTTP header. Check the response headers, not just the source; a leftover staging noindex is a classic post-launch killer.
5. **Canonical is correct** — self-referencing (or pointing to the intended canonical), absolute, on the right host (pick www *or* apex, http*s*), and it does **not** point at a URL that redirects. The canonical must be identical to the URL you put in the sitemap and link internally. Mismatches here produce "Duplicate, Google chose a different canonical" and silent de-indexing.
6. **One host, one trailing-slash convention.** Everything else 301s to it. Serving the page at `www` while the canonical says apex (or vice-versa) is a contradiction Google resolves against you.
7. **Mobile-friendly.** Google indexes mobile-first; if it's broken on mobile it may be excluded.
8. **Real, unique value.** Thin, boilerplate, duplicate, or doorway pages get crawled and then dropped ("Crawled – currently not indexed"). For templated/programmatic pages, each must earn its place — see Part F.

## Part B — Make it discoverable

Google can only index what it can find. Discovery, in order of strength:

9. **Internal links.** The page must be linked from at least one page Google already crawls — ideally its category/hub plus related pages. Orphan pages (zero internal links) are the most common cause of "Discovered – currently not indexed" at scale. This is the strongest, cheapest discovery lever you have.
10. **XML sitemap.** Include the page with its **canonical** URL, an accurate `<lastmod>`, and only 200/indexable URLs. For large sites, use a sitemap **index** pointing to children of ≤50,000 URLs each. Don't list redirects, 404s, noindex pages, or non-canonical variants — a dirty sitemap teaches Google to distrust it.
11. **A few external links / mentions** to genuinely important pages help seed discovery and signal worth, though they're not required.

## Part C — Submit and nudge in Search Console

12. **Verify the property — use a Domain property** if you can (DNS TXT). It covers http/https, www/non-www, and all subdomains in one place, so you see the whole picture.
13. **Submit the sitemap** in GSC → Indexing → **Sitemaps**, and reference it in `robots.txt` (`Sitemap: https://host/sitemap.xml`). Note: Google **retired the public sitemap "ping" endpoint in 2023** — GSC submission (or the robots.txt reference) is now the way to register it.
14. **URL Inspection → Request Indexing** for a *handful* of priority URLs. There's a small daily quota (roughly a dozen per property) and it is **not** a bulk tool. If you have hundreds/thousands of un-indexed pages, requesting them one-by-one is the wrong fix — go back to discovery (internal links, sitemap) and quality (Part F).
15. **IndexNow** for the *other* engines: one ping notifies Bing, Yandex, Naver, and Seznam. **Google does not participate (as of 2026)**, so IndexNow does nothing for Google — but it feeds the Bing index that ChatGPT Search, Copilot, and DuckDuckGo draw from, so it's worth wiring up. Keep the key file reachable (a 404 on it makes submissions fail silently).
16. **Bing Webmaster Tools** — verify and submit the sitemap there too. Cheap, and it's the index behind several AI assistants.
17. **(Optional) Google Indexing API** — officially only for `JobPosting`/`BroadcastEvent`, 200 URLs/day. Some use it as a crawl hint for other page types; treat it as unsupported-but-sometimes-helpful, never as the primary path.

## Part D — Diagnose with the Page Indexing report

GSC → Indexing → **Pages** → "Why pages aren't indexed." Each status has a specific cause and fix. The full mapping is in `references/gsc-status-table.md` — read it when triaging a real report. The short version of the ones that actually mean "you have a problem":

- **Discovered – currently not indexed** → found but not yet crawled. Crawl-budget / low-priority / weak internal linking / slow site. Fix: speed, internal links, prune low-value pages, don't dump thousands of pages at once.
- **Crawled – currently not indexed** → crawled and deliberately not indexed. Quality/thin/duplicate/intent-mismatch. The hardest one; fix by making the page genuinely better and more distinct, or consolidate it away.
- **Soft 404** → 200 status but empty/"not found"-looking content. The SPA empty-shell signature. Fix rendering (Part A #2) or return a real 404 for genuinely missing pages.
- **Duplicate, Google chose a different canonical / Duplicate without user-selected canonical** → canonical conflict. Set an explicit self-canonical and align internal links + sitemap to it.
- **Excluded by 'noindex' tag** → remove the noindex if it's there by mistake.
- **Blocked by robots.txt / Indexed, though blocked by robots.txt** → unblock; fix the mixed signal.

## Part E — Validate and set expectations

18. After fixing a status, click **Validate Fix** in that status panel — it re-checks the affected URLs and tracks the rollout.
19. **Re-test** the key URL in URL Inspection and spot-check with a `site:host/path` search.
20. **Timeline is days to weeks, not hours.** "Indexed in 24h" is marketing fiction. A page passing the live test is *eligible*, not guaranteed — Google still applies quality judgement. Don't re-request the same URL repeatedly; it doesn't help and wastes quota.

## Part F — Programmatic / large sites (directories, location pages, guides)

When you're generating many template pages, indexing is governed by quality and crawl economics, not just submission:

- **Unique value per page.** Pages that only swap a name/city are doorway pages; Google crawls them and drops them. Each needs page-specific substance.
- **Minimum-content floor.** `noindex` thin variants until they're filled, so they don't drag the whole site's quality signal down and waste crawl budget.
- **Launch in waves.** Ship a batch, watch the indexed-vs-discovered ratio in GSC, and only scale the template once Google keeps pace. Dumping 20k thin pages at once invites a site-wide quality demotion and a stuck "Discovered" queue.
- **Strong internal linking** between generated pages and up to hubs, or most of them stay orphaned and never crawled.
- **Keep the sitemap clean and chunked**, regenerated as pages change.

## Part G — Reporting surfaces you may now see in GSC

- **Generative AI performance report** — Google is rolling this out to a select group of owners (opt-out available). It shows **impressions** with page/country/device breakdowns but **no click data**; Google says more metrics will come but hasn't said which or when. Set expectations accordingly: GSC currently gives you AI-feature impressions, not clicks.
- **Platform properties** — a new property type for Instagram, TikTok, X, and YouTube, so creators can see how social/video posts perform on Search and Discover (Performance, Insights, Achievements reports). Add via the property selector → Add property → authorize the platform. This is distinct from indexing your own site and doesn't change any of the pre-flight above.

## Output

When auditing a specific site's indexing, produce: (1) the one-line verdict on whether pages are eligible at all (usually the rendering check), (2) a pass/fail run through Parts A-C for the affected URLs with the actual evidence, (3) the GSC statuses present and their fixes from Part D, and (4) the concrete next action. Lead with the blocker that's suppressing the most pages.

## Changelog
- 2026-07-18: Added Part G (reporting surfaces) — GSC generative AI performance report (impressions only, no clicks, opt-out) per https://www.searchenginejournal.com/google-puts-a-number-on-ai-search-clicks-without-the-data/582755/ ; and GSC platform properties for Instagram/TikTok/X/YouTube per https://developers.google.com/search/blog/2026/07/search-console-social-video-platforms
