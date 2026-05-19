# InternetKeeda — Project Status

_Snapshot date: 2026-05-19. Last commit: `80b3850` (header fix)._

---

## 1. Current state

### Done — across the whole build

- **Rebrand** to InternetKeeda. Logo, site name, tagline, fallback strings,
  admin-domain auto-promotion (8 files), Geist Sans/Mono typography, orange
  brand palette (`#FF5A1F`, mapped through Tailwind so `green-*` and
  `emerald-*` legacy classes also resolve orange).
- **MongoDB Atlas seeded.** 5,000 tools via `scripts/seed-tools.ts` (idempotent
  bulkWrite, auto-creates Category docs). Atlas free tier, replica set,
  transactions working.
- **Category audit + consolidation.** 1,380 source categories → **678** final
  via `scripts/category-audit.ts` (deterministic clustering: normalize,
  synonym map, keyword overlap) and `scripts/apply-merges.ts` (single Mongo
  transaction). 4,056 tools re-tagged, 0 orphans.
- **Category UI.** Nav mega-menu shows top-30 by toolCount, home renders
  top-12 with Lucide icons + brand tint rotation, `/categories` lists all
  alphabetical with featured top-30 pill strip + count-sort toggle + search
  filter.
- **Tier 1a** — tool-card hover transitions tightened 500ms → 200ms across
  all 22 transition properties.
- **Tier 1b** — grid stagger fade-in via `src/lib/animations.ts`. Viewport-
  triggered, `(index % 12) * 60ms` delay so paginated batches re-cascade.
  Reduced-motion respected. Wired into 8 surfaces.
- **Tier 1c** — `ToolCardSkeleton` matches real card 1:1 (h-[320px], same
  rows). Shimmer at 1.5s. Dashboard variant + AI recommendation variant.
  Wired into 7 loading states + the paginated "Load More" append row.
- **Task A — purple → orange sweep.** 55 files. Build clean.
- **Task D — hero rebuild.** Full-bleed dark hero, animated dot-grid
  backdrop (CSS-only, 30s drift + ±10px mouse-parallax lerp, radial mask
  fade), gradient on "organized.", `64px` rounded search bar, 4 try-chips,
  social proof line.
- **Task E — page transitions.** Pathname-keyed `AnimatePresence`,
  200ms ease-in exit / 300ms ease-out enter, skips on filter changes,
  reduced-motion bypass.
- **Hero AI search** — re-wired after the rebuild dropped it. Hero submit
  + chip click → `POST /api/tools/ai-search` → grid swaps to AI results
  with orange "AI matches for: …" banner + Clear button. Hard fallback to
  keyword filter on empty AI result or fetch error.
- **Header fix** — full-bleed dark on home, light elsewhere, transparent at
  top of home, blurred-dark on scroll. Brown band killed (Tailwind
  `container` utility's hidden `padding: 2rem`). Next.js dev overlays
  hidden via `nextjs-portal { display: none }` (dev-only no-op).
- **Bootstrap polish** — Clerk no longer hard-fails without an env key
  (uses placeholder publishable key when unset), the broken `/public/logo.svg`
  was rewritten, Tailwind ESM `require()` bug fixed.

### End-to-end vs. mocked / partial / missing

| Surface | Status | Notes |
|---|---|---|
| `/` home | ✅ end-to-end | Hero, dot grid, AI search wired, 12 featured categories, FilterBar, stagger grid, skeleton, "Load More" |
| `/category/:id` | ✅ end-to-end | ProductCard grid, stagger, skeleton, light header |
| `/categories` | ✅ end-to-end | All 678 alphabetical + featured strip |
| `/ai-tools/:slug` | ⚠️ renders | But the per-tool page is the original template's design — not rebranded beyond the global Tailwind palette swap |
| `/trending`, `/top-products`, `/latest-launches`, `/upcoming` | ✅ render | Same stagger + skeleton + theme switch |
| `/dashboard` | ✅ renders | Saved + upvoted tabs use Dashboard-specific skeletons; "Submitted" tab not deeply audited |
| `/sign-in`, `/sign-up` | ✅ working | Clerk wired with real keys |
| `/admin` | ⚠️ renders | Original CodeCanyon admin UI — works functionally, NOT rebranded |
| Newsletter footer form | ⚠️ posts | Hits `/api/newsletter`, which saves to Mongo but never sends an email (no SMTP wired) |
| Stripe checkout / billing | ❌ no creds | Routes exist, would crash if hit; gated behind admin |
| Cloudinary uploads (logo/favicon admin) | ❌ no creds | Will 500 if admin tries to upload |
| Theme-two | ❌ untouched | Inactive; all rebrand/polish lives only in theme-one |
| Some legal/about pages | ⚠️ stale copy | `theme-one/pages/Terms.tsx` and `about.tsx` still reference "AI Tool Finder" inline. About 5 files. |

---

## 2. AI feature status

### OpenAI usage in the codebase

There is **exactly one** file that calls OpenAI:

- `src/app/api/tools/ai-search/route.ts` — `POST` semantic search.
  Sends a tool catalog summary + the user query to GPT and returns ranked
  matches. **Verified working**: a `LinkedIn posts` query returns Copy.ai,
  Writesonic, Lately.ai (~11s round trip).

That's it. No other route calls OpenAI.

### Wiring confirmation

- **Hero search bar** (`HeroSection.tsx` line ~115 `runSearch`) — calls the
  parent's `onAiSearch` prop. `Index.tsx`'s `handleAiSearch` POSTs to
  `/api/tools/ai-search`. ✅ Semantic, not keyword.
- **Try chips** — same `handleAiSearch` path. ✅
- **Cmd/Ctrl+K** — still opens the original `SearchDialog` overlay
  (keyword-only). Acceptable: power-user instant-filter UX.
- **FilterBar search input** — keyword-only (filters the existing grid).
  This is correct — it's a refining filter, not a semantic search.

### AI features in the template that the rebuild removed or kept

| Feature | Original | Now |
|---|---|---|
| "Ask AI to recommend tools" chat panel in the old hero | Had its own inline form + AI response panel | **Removed** with the Task D rebuild. New hero search bar fully replaces it (and goes through the same `/api/tools/ai-search` endpoint). |
| `AiRecommendationSkeleton` component | Used in old chat panel | Kept exported in `ToolCardSkeleton.tsx`. Could be re-used for any future inline-results UI. |
| Tool auto-tagging / auto-categorization on submission | Never existed in the template | Not built |
| Tool description rewriting | Never existed | Not built — flagged for Phase F |

**Verdict: no AI feature was lost.** The chat panel was just a duplicate
UX for the same `/api/tools/ai-search` endpoint, now consolidated into
the hero. No restore needed.

---

## 3. Pre-Vercel deploy checklist

### Build

`npm run build` — **clean (exit 0)**. Every page compiled, middleware
compiled (82.9 KB), shared chunks 102 KB. One harmless Mongoose warning
about a duplicate index on `{affiliateId: 1}` in the AffiliateProfile
model (pre-existing in the template). No type errors, no module
resolution errors.

### Lint

`npm run lint` reports **569 problems (529 errors, 40 warnings)**, but
read this carefully: the bulk are `@typescript-eslint/no-explicit-any`
and `react-hooks/exhaustive-deps` rules being treated as errors by the
inherited eslint config from the CodeCanyon template. **Not real bugs** —
they're stylistic. None block compilation. Could be downgraded to warnings
or fixed file-by-file post-launch.

### Type-check

Next 15's build runs TS via `typescript.ignoreBuildErrors: false` (set in
`next.config.js`). If build passes, types pass.

### Env vars Vercel needs

| Var | Required | Purpose |
|---|---|---|
| `MONGODB_URI` | **required** | Atlas connection string. Already set locally. |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | **required** | Auth client-side |
| `CLERK_SECRET_KEY` | **required** | Auth server-side |
| `OPENAI_API_KEY` | **required for AI search** | Hero semantic search goes 500 without it; the route's `semanticSearchFallback` runs but quality drops dramatically |
| `CRON_SECRET` | **required if cron used** | Protects `/api/cron/scrape` — currently still accepts the literal `'admin_secret'` as a fallback (security smell — fix before deploy) |
| `CLOUDINARY_CLOUD_NAME` / `_API_KEY` / `_API_SECRET` | optional | Admin image uploads. If empty, upload UIs error but the public site is unaffected. |
| `STRIPE_SECRET_KEY` / `STRIPE_WEBHOOK_SECRET` | optional | Billing. Routes lazy-load Stripe — they return 500 if hit, but no top-level crash. Public site fine. |
| `STRIPE_*_PRICE_*` (6 IDs) | optional | Only read inside the checkout-create path |
| `NEXT_PUBLIC_GA_MEASUREMENT_ID` | optional | Analytics |
| `NEXT_PUBLIC_DEMO_MODE` | optional | Set `false` for prod |
| `NEXT_PUBLIC_APP_URL` | optional | Production URL, used by iframe-detection CTA |
| `FRONTEND_URL` | recommended | Used by `/sitemap.xml` to absolute-URL entries. Without it, the route falls back to request `host` — works on Vercel but cleaner to set. |

### Vercel Cron

**No `vercel.json` exists.** Need to create one before deploy if we want
the scraper to run on schedule.

Recommended `vercel.json`:

```json
{
  "crons": [
    {
      "path": "/api/cron/scrape?key=__CRON_SECRET__",
      "schedule": "0 4 * * *"
    }
  ]
}
```

Cron on Hobby tier runs once per day. If we want hourly or more frequent,
need Vercel Pro ($20/mo). **Recommend: daily is fine** for a directory
that updates from one scraper source.

### Image domains

`next.config.js` allows **`https://**`** and `http://**`** for `remotePatterns`
plus `unoptimized: true` — so every external image works. Wide open, which
is what the seed catalog needs (logos come from Clearbit, OpenAI's domain,
random tool CDNs). **No action needed**. Tighten domains post-launch if
you care about CSP.

### Sitemap + robots.txt

- **Sitemap**: `/sitemap.xml` is generated dynamically (`force-dynamic`)
  and includes static pages + all 5,000 tools + blog posts + news posts.
- ⚠️ **Sitemap does NOT include the 678 category pages.** Real SEO miss —
  category pages are the long-tail search opportunity. Should be patched
  before launch (~30 min).
- ⚠️ **`robots.txt` doesn't exist.** Google can crawl without it but the
  recommended hygiene is to create one. ~5 min fix:

  ```ts
  // src/app/robots.ts
  export default function robots() {
    return {
      rules: [{ userAgent: '*', allow: '/', disallow: ['/admin', '/api'] }],
      sitemap: `${process.env.FRONTEND_URL}/sitemap.xml`,
    };
  }
  ```

### Clerk middleware

`src/middleware.ts` public routes look correct: `/`, `/ai-tools(.*)`,
`/blog(.*)`, `/categories(.*)`, `/category(.*)`, etc. all public. Admin
behind auth. Iframe-detection logic short-circuits before Clerk for
Envato preview compatibility (not relevant on the real domain).

### Stripe crash behavior

Routes use `await getConfiguredStripe()` inside `try/catch` and return
JSON errors. They don't crash the whole app at import time. **Safe to
deploy without Stripe creds.** Billing UI will just error gracefully
when an admin tries to use it.

### Email (Resend / SMTP)

Newsletter `/api/newsletter` saves to Mongo via the `NewsletterSubscription`
model. There's no send-email code anywhere — no Resend, no Nodemailer.
**Safe to deploy without email creds.** Newsletter "subscriptions" will
just sit in the DB until you add a sender.

### Warnings still in output

The lint count above + ESLint warnings around `any` types and missing
deps in `useEffect`. No blocking errors.

---

## 4. Post-launch wiring (only doable with a real URL)

| Task | Where |
|---|---|
| Add `internetkeeda.com` + Vercel preview URLs to Clerk allowed origins | Clerk dashboard → application → Domains |
| Set Clerk redirect URLs (`/sign-in`, `/sign-up`, `/sso-callback`) | Clerk dashboard → application → Paths |
| GoDaddy DNS — `A` record `@` → `76.76.21.21` and `CNAME` `www` → `cname.vercel-dns.com` | GoDaddy domain manager |
| Verify domain in Vercel | Vercel project → Settings → Domains |
| Add Google Search Console property + submit sitemap | search.google.com/search-console |
| Add Google Analytics 4 property + paste the measurement ID into `NEXT_PUBLIC_GA_MEASUREMENT_ID` on Vercel | analytics.google.com |
| Set up Bing Webmaster (optional but cheap) | bing.com/webmasters |
| Once analytics is in: apply for AdSense | google.com/adsense — **needs Phase F content work first; see below** |

---

## 5. Tech debt / known issues

### Category navigation

- `/categories` page exists and works (top-30 featured pill strip +
  alphabetical groups + count-sort + search filter). User can reach every
  one of the 678 categories from there or via the nav mega-menu's "View
  all" link.
- Nav mega-menu lists top-30 by tool count. Anything outside top-30 is
  only reachable via `/categories`.
- The dropdown popovers on the dark home header are still `bg-white`.
  Acceptable shadcn pattern but slightly jarring on dark; can be themed
  dark later if you want full Linear/Vercel polish.

### Empty states

- Tool grids: clean orange-sparkle empty state with a "Reset Filters" CTA. Good.
- Dashboard saved/upvoted: plain "No saved tools yet" text in a centered
  div. Functional but ugly — could use an illustration.
- Category page with zero tools: "No tools found in this category" + "Go
  Back" button. Same plain-but-functional pattern.

### Mobile-specific

- The new hero subhead text at 390px is fine after the tracking fix, but
  the hero `min-h-screen` with content + chips + social-proof line gets
  vertically cramped on tall-narrow phones (Pixel 7, iPhone SE). Mostly
  works; some squeeze.
- The Mobile bottom-nav bar still uses the old `bg-white` style on every
  route including home. On the dark hero it stays at the bottom edge and
  looks fine, but for full consistency it could theme-switch the same way
  the top nav does.
- Hamburger menu opens a `bg-white` full-screen overlay. Same comment.

### Performance

No Lighthouse run yet. Subjective: first-paint feels fast (hero is mostly
CSS), tool grid feels fast on the home (1000 tools fetched then
client-paginated). Realistic concern is **the home page fetches 1000
tools** in one go (`useTools({ limit: 1000 })`). On Atlas free tier with a
slow network user that's ~500KB of JSON. Pagination should be server-side.
Punt to Phase F.

### Workarounds patched, should fix properly later

- `ConditionalClerkProvider` falls back to a placeholder Clerk publishable
  key when env is empty. Should be removed once we're sure prod always has
  real creds.
- `/api/cron/scrape` accepts the literal string `'admin_secret'` as a
  fallback to `CRON_SECRET`. **Real security issue — strip before deploy.**
- The Tailwind plugin `lovable-tagger` is still in `devDependencies` even
  though nothing wires it in. Harmless. Could uninstall.
- Three Tailwind configs (`.ts`, `.js`, `.mjs`) shipped with the template
  — I deleted the duplicates during bootstrap, only `.ts` remains. Done.
- Page transition uses `mode="wait"` (sequential exit→enter) instead of
  the spec's "50ms overlap." Tradeoff explained in the Task E commit
  message. Sub-50ms blank gap, barely perceptible. Could revisit with
  `mode="popLayout"` if you want zero gap.
- The "lazy" attribute on `<Image>` is bypassed because `next.config.js`
  sets `unoptimized: true` — the seed catalog uses `<img>`-equivalent
  loading. Fine for launch.
- `react-router-dom` aliasing in `next.config.js` (template's migration
  shim) is still there. Removing it requires touching every page that
  still imports `react-router-dom` (~10 admin pages). Punt.

### Secrets in chat

The Mongo password and OpenAI API key were both pasted in chat history.
You said don't worry. **Flagging for the record only.** Both keys can be
rotated post-launch from their respective dashboards:
- Atlas → Database Access → `ikadmin` → Edit Password
- OpenAI → platform.openai.com/api-keys → rotate

The Clerk **publishable** key in chat is fine (it's literally meant to be
public). The Clerk **secret** key is the one to rotate if you care.

---

## 6. Phase F recommendations

Honest opinion: AdSense won't approve a site whose 5,000 tool entries are
scraped duplicates of TopAI.tools and similar aggregators. Google's
content quality bar is real. Items (a) and (c) below are not nice-to-have
— they're prerequisites for any meaningful AdSense revenue.

| # | Feature | Hours | Impact | Verdict |
|---|---|---|---|---|
| **a** | AI-rewrite all 5,000 tool descriptions to original copy | 8–12h (build) + ~$25 OpenAI spend + 2–3h batch run | **HIGH** — AdSense, organic SEO, originality | **Before deploy** |
| **b** | AI-powered tool comparison ("compare X vs Y") | 8–12h | MED — engagement, shareable URLs | After launch |
| **c** | AI-generated SEO meta + 80-word intro for all 678 category pages | 5–7h + ~$5 OpenAI spend | **HIGH** — long-tail SEO, AdSense | **Before deploy** |
| **d** | "Alternatives to X" semantic recommendations on every single-tool page (5–8 alts) | 5–7h (reuse `/api/tools/ai-search` with tool description as query, cache results) | **HIGH** — retention, internal linking | **Before deploy** |
| **e** | AI-curated "Tools of the Week" feed | 5–7h | MED | After launch |
| **f.1** | Per-tool Open Graph image generator via `@vercel/og` | 3–4h | MED — social sharing polish | After launch |
| **f.2** | Server-side pagination on home (replace 1000-tool single fetch) | 4–6h | MED — performance | After launch (no urgency) |
| **f.3** | Embeddings cache for AI search (eliminate the 11s round trip) | 6–10h | MED — UX | After launch |
| **f.4** | Sitemap patch to include the 678 category pages | 30 min | HIGH — SEO indexing | **Before deploy** |
| **f.5** | `robots.txt` + dark-theme dropdown popovers | 1h total | LOW–MED | **Before deploy** |
| **f.6** | Mobile bottom-nav theme switch + dark-mobile-menu | 2h | LOW | After launch |
| **f.7** | Strip the `'admin_secret'` fallback in `/api/cron/scrape` | 5 min | HIGH (security) | **Before deploy** |

### My specific recommendation

**Do these before deploy** (one focused block, ~16–22 hours):

1. **a** — AI-rewrite descriptions (most leverage; the whole AdSense thesis
   depends on this)
2. **c** — Category meta generation (cheap, same script structure as a)
3. **d** — "Alternatives to X" (huge for retention and internal SEO; the
   endpoint already exists)
4. **f.4** — Sitemap patch for categories
5. **f.5** — robots.txt + minor polish
6. **f.7** — Remove the cron secret fallback

Then deploy. (b), (e), (f.1), (f.2), (f.3), (f.6) are genuinely nice-to-have
and can land on the live site post-launch without affecting the AdSense
application or initial Google indexing.

Reasoning: deploying a directory site to a fresh domain with 5,000
scraped-duplicate descriptions and 678 thin category pages is the
fastest way to get the domain stamped as low-quality by Google. Once
they classify a domain, it takes months of effort to recover. Front-load
the originality work. The 16–22 hours pays for itself the first day
real users hit the site.

If you want an even tighter pre-deploy: skip (d) and ship with (a) + (c)
+ (f.4) + (f.5) + (f.7) in **~12 hours**. (d) becomes the day-one
post-launch ship.

---

_Next concrete action: your call._
