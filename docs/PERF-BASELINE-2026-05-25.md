# Performance baseline — 2026-05-25

Recorded after the P6 commit chain landed on `main`, but **before**
those commits were deployed to www.internetkeeda.com. So these scores
reflect what users currently see, not what the just-merged work
should produce.

## Lighthouse — production (live site)

Run with `npx lighthouse https://www.internetkeeda.com --output=json
--chrome-flags=--headless --only-categories=performance --quiet`.
Desktop adds `--preset=desktop`.

| URL                                                | Form factor | Perf | LCP   | FCP  | TBT     | CLS | SI   |
|----------------------------------------------------|-------------|------|-------|------|---------|-----|------|
| `/`                                                | desktop     | 79   | 2.2 s | 0.4s | 100 ms  | 0   | 4.0s |
| `/`                                                | mobile      | 51   | 5.8 s | 1.1s | 1290 ms | 0   | 4.5s |
| `/category/image-generation`                       | mobile      | 43   | 9.2 s | 1.1s | 1200 ms | 0   | 9.1s |

Raw JSON archived in repo root: `lh-p6-prod-*.json`.

## What the P6 chain should move

| Lever                                  | Where it lands               |
|----------------------------------------|------------------------------|
| `images.unoptimized: true` → off       | LCP (mobile especially)      |
| AVIF/WebP via `formats` config         | LCP, byte size               |
| CDN `Cache-Control` on /api/{blog,news,faq,categories,tools/stats} | TTFB |
| `.lean()` on hot read paths            | TTFB                         |
| Compound indexes on Payment/Subscription | TTFB on admin + tool pages |
| 172 transitive packages dropped        | Cold-install only (no runtime) |

LCP and TTFB should move materially on the next deploy. TBT requires
client-bundle reduction work that this chain didn't tackle — it's
the residual gap to ≥85 on mobile.

## What's left if mobile is still <85 after deploy

In rough order of expected payoff:

1. Convert `/` and `/category/[id]` from `'use client'` shells to
   server components with data prefetched server-side. Lets us add
   `export const revalidate = N` and ship the HTML cached at the
   edge. Currently the client has to round-trip /api/tools before
   anything paints, which is most of the TBT.
2. Split the `Navigation.tsx` (730 LOC) — the desktop nav menu is
   a heavy NavigationMenu tree that mobile users never see. Lazy
   the desktop nav behind a viewport check.
3. Defer `react-helmet-async`. It's loaded synchronously in the
   root layout; meta-tags can be set declaratively via Next 13+'s
   `metadata` API at the page level instead.
4. Audit `framer-motion`. Index.tsx claims motion was removed from
   the home critical path; verify against a webpack-bundle-analyzer
   build (`@next/bundle-analyzer` is still installed).
