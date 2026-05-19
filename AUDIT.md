# InternetKeeda — Surface Audit

Audit date: 2026-05-19. Scope: every public-facing surface plus admin entry. Findings only — no fixes applied. Sorted by severity within each surface.

The 3 bugs fixed this session (categories empty, detail-page logos, formatTool consolidation) are **excluded** from this list — they are already resolved on `main` and deployed.

Severity key:
- **HIGH** — broken user-facing functionality, visible regression, or data-integrity issue
- **MED**  — visible inconsistency, polish gap, or degraded UX
- **LOW**  — cosmetic, dev hygiene, dead code

Fix complexity:
- **S** — under 30 min, one file
- **M** — half a day, multiple files or a small refactor
- **L** — non-trivial design or schema work required

---

## 1. Home grid (`Index.tsx`)

| # | Sev | Symptom | Cause | Fix |
|---|---|---|---|---|
| 1.1 | **HIGH** | FOMO toaster shows fabricated activity ("Someone from New York is viewing", "John D. just upvoted"). | `FOMO_ACTIVITIES` hardcoded at `Index.tsx:104-110`. There is no real upvote/view feed driving it. | M — remove the fake feed, or wire it to a real `/api/activity/recent` endpoint and only show real events. |
| 1.2 | MED | Category count display is wrong for non-API categories. | `Index.tsx:263-272` — the inner `if (!categoryMap.has(category))` block sets the count to 1 once and **never increments**. So any category not surfaced by `/api/categories` always shows `(1)` regardless of how many tools it has. | S — remove the `!has` guard so the increment fires. |
| 1.3 | MED | Production console is polluted by `[Image] Successfully loaded logo for: …` on every grid card. | `onLoad` and `onError` handlers `console.log` for every image, including the FOMO toast (`Index.tsx:626, 756, 879`). Same pattern on `AIToolDetail.tsx`. | S — strip all `console.log` calls from image handlers. |
| 1.4 | LOW | Dead "logo cache" utilities (`LOGO_CACHE_KEY`, `getLogoFromCache`, `saveLogoToCache`) are defined at `Index.tsx:65-101` and never called. Same dead pair exists in `AIToolDetail.tsx`. | Leftover from an earlier client-side caching attempt that was abandoned in favor of `getToolLogo()`. | S — delete. |

---

## 2. Trending page (`trending.tsx`)

| # | Sev | Symptom | Cause | Fix |
|---|---|---|---|---|
| 2.1 | **HIGH** | "Today" tab is almost always empty even though tools exist. | `trending.tsx:44-57` requires both `tool.isTrending === true` **and** `createdAt >= startOfToday`. The isTrending flag is editorial — most live tools have it false. Combined with a 24h window, the intersection is near-empty. | M — decide what "trending" means in the absence of editorial curation. Likely: drop the `createdAt` cutoff and rank by recent vote velocity, or auto-mark top-N-by-votes as trending. |
| 2.2 | MED | Logo renders bypass the canonical helper. | `trending.tsx:169` reads `tool.logo \|\| google-favicon-of-websiteUrl \|\| ui-avatars` directly. Doesn't go through `getToolLogo()`, so the clearbit→google-favicon rewrite the rest of the app uses is skipped here. | S — switch to `<Image src={getToolLogo(tool)} … />`. |
| 2.3 | MED | "Paid" pricing pill is green (`getPricingColor` line 92-93) which clashes with the orange brand. | Old palette never updated. | S — change paid/enterprise gradient to an orange or neutral. |

---

## 3. Top Products page (`top-products.tsx`)

| # | Sev | Symptom | Cause | Fix |
|---|---|---|---|---|
| 3.1 | **HIGH** | "Load More" button does nothing. | `top-products.tsx:260` is `onClick={() => console.log('Load more clicked')}` — placeholder never wired up. | S — port the `pageSize` pattern used by `latest-launches.tsx`. |
| 3.2 | **HIGH** | Page is mostly empty even with 5000 tools indexed. | Filters by `tool.isTopRated` (`top-products.tsx:34`). That flag is editorial and almost no live tools have it set. | M — same decision as 2.1: pick a derivation rule (rating > 4.5 AND reviews > N), or build an admin curation flow. |
| 3.3 | MED | Featured tool block (`top-products.tsx:198`) shows the **scraped** seller description, not `description_ai`. | Line reads `featuredTool.description` only — the AI rewrite is bypassed. | S — `featuredTool.description_ai \|\| featuredTool.description`. |
| 3.4 | MED | Featured tool image is rendered in a 16:9 aspect-video container (line 186) with a square logo as `src`. Result: a stretched/letterboxed square logo on a hero block that's meant for a screenshot or banner. | The card was designed for a wider hero image; only logos are in the DB. | M — either store a `heroImage` field on Tool, or change the container to a centered square. |
| 3.5 | MED | Same green-on-paid pricing pill as 2.3. | Same source. | S — see 2.3. |
| 3.6 | MED | Grid `imageUrl` (line 238) bypasses `getToolLogo()`, same as 2.2. | Same pattern. | S — same fix. |

---

## 4. Latest Launches (`latest-launches.tsx`)

| # | Sev | Symptom | Cause | Fix |
|---|---|---|---|---|
| 4.1 | MED | Tools with `status: 'approved'` (admin-approved but not yet published) are silently hidden. | `latest-launches.tsx:34` filters strictly to `status === 'published'`. Everywhere else uses `['published','approved']`. | S — align with the rest of the app. |
| 4.2 | MED | Production logs `Debug - …` messages on every render. | `console.log` at lines 43, 61, 66 left in from development. | S — delete. |
| 4.3 | MED | Logo render at line 166 bypasses `getToolLogo()`. | Same as 2.2. | S — same fix. |
| 4.4 | LOW | Hero copy uses the banned-word "cutting-edge" ("Be among the first to explore and try out these cutting-edge solutions" — line 127). The same word is banned in the AI rewrite prompt for being marketing fluff. | Pre-Phase-F copy. | S — rewrite. |

---

## 5. Upcoming (`upcoming.tsx`)

| # | Sev | Symptom | Cause | Fix |
|---|---|---|---|---|
| 5.1 | **HIGH** | Page is empty for almost every visitor. | Filters strictly by `tool.isUpcoming` (line 20). Almost no tools have this set. | M — same editorial-flag problem as 2.1, 3.2. Either curate or drop the page. |
| 5.2 | **HIGH** | `useState(() => { … setSubscriberCounts(…) })` at line 24-33 is a misuse — `useState` only runs its initializer once, and that initializer calls `setSubscriberCounts` mid-render, which throws "Cannot update a component while rendering". Likely caught by the empty-list short-circuit today, but it's a latent crash. | Looks like an attempted `useEffect` written as `useState`. | S — change to `useEffect(() => { … }, [upcomingTools])`. |
| 5.3 | **HIGH** | "Subscribers" count is fake — always 0 unless the user clicks Subscribe locally; never persisted, never aggregated. | `subscriberCounts` is a local `useState` map (line 17); no API for it. | M — either persist (`/api/tools/:id/subscribe`) or remove the count display. |
| 5.4 | MED | Subscribe handler increments/decrements with inverted logic. | Line 46: reads `isSaved(toolId)` **before** `toggleSave` resolves, so it predicts the post-toggle state using the pre-toggle one. | S — flip the ternary or compute after a `await`. |
| 5.5 | MED | Logo render at line 118 bypasses `getToolLogo()`. | Same as 2.2. | S — same fix. |

---

## 6. Categories index (`categories.tsx`)

| # | Sev | Symptom | Cause | Fix |
|---|---|---|---|---|
| 6.1 | LOW | Empty filter state ("No categories match …") doesn't surface in screen readers — no `role="status"` or `aria-live`. | A11y oversight. | S — add `aria-live="polite"`. |

This page is otherwise clean — uses canonical slug, accurate counts, orange brand.

---

## 7. Category page (`category/[id].tsx`)

Just fixed (Bug 1). One remaining nit:

| # | Sev | Symptom | Cause | Fix |
|---|---|---|---|---|
| 7.1 | LOW | While the API fetch is in flight, the page can briefly show "No tools found" before `categoryName` is populated. | Race: `tools` (from `useTools`) often resolves before `/api/categories/:slug`. | S — show a skeleton while `!categoryName && isLoading-ish`. |

---

## 8. Tool detail (`AIToolDetail.tsx`)

Bug 2 (logo) fixed this session. Other observations:

| # | Sev | Symptom | Cause | Fix |
|---|---|---|---|---|
| 8.1 | MED | "Tool rank" badge shows `#{Math.floor(votes/100)}` at line 337 — produces `#0` for any tool with under 100 votes, which is most of them. Looks broken. | Heuristic was tuned for a higher-vote era. | S — hide if votes < 100, or replace with `tool.rating`. |
| 8.2 | LOW | Same dead `LOGO_CACHE_KEY` utilities (`AIToolDetail.tsx:46-82`) as Index — unused since the getToolLogo refactor. | Cleanup. | S — delete. |
| 8.3 | LOW | `console.log` left in the admin-role handler and image error handlers. | Dev noise. | S — delete. |

---

## 9. Hero AI search (`HeroSection.tsx` + `Index.tsx`)

Working end-to-end after Phase F. One ergonomic issue:

| # | Sev | Symptom | Cause | Fix |
|---|---|---|---|---|
| 9.1 | MED | AI search has no error toast — if `/api/tools/ai-search` 500s, the loading state silently flips back to "no results" with no indication something went wrong. | `Index.tsx:207-211` catches and logs but doesn't surface to the user. | S — `toast.error('AI search failed, falling back to keyword.')`. |

---

## 10. Filter Bar / pagination

Spot-checked on home; appears functional. Not separately exercised on every list page. The "Load More" pattern is reimplemented per page (some work, top-products doesn't — see 3.1) — worth eventually extracting to a shared hook.

---

## 11. Tag chips

The tag chip below each grid card (`Index.tsx:803-812`) is **not clickable** — it's a `<span>`. Most users will assume clicking a tag filters by it.

| # | Sev | Symptom | Cause | Fix |
|---|---|---|---|---|
| 11.1 | MED | Tag chips on cards look interactive but aren't. | `<span>` instead of `<Link>` or button. | M — make each chip route to `/?tag=<name>` and add a tag filter to the home grid. |

---

## 12. Header / Navigation (`Navigation.tsx`)

| # | Sev | Symptom | Cause | Fix |
|---|---|---|---|---|
| 12.1 | MED | Mobile bottom-nav "Submit" button is green (line 661) — contradicts the orange brand established in Phase D Tier 2. | Old palette. | S — orange-500 to match desktop "Submit Your Tool". |
| 12.2 | MED | Mobile sign-up button (line 588) is green; desktop is orange. Inconsistent. | Same. | S — orange. |
| 12.3 | LOW | A 60-line commented-out "Best Software" mobile menu block (line 506-568) is left in. | Dead. | S — delete. |
| 12.4 | LOW | Avatar fallback colors are green (line 341, 418). | Brand drift. | S — neutral or orange. |

---

## 13. Footer (`Footer.tsx`)

Not deeply inspected this pass — sample read showed it's a static block of links with no API dependency. Click-test it manually before launch; flag anything stale.

---

## 14. Auth flows

`/sign-in` and `/sign-up` are Clerk-hosted catch-all routes (`src/app/sign-in/[[...sign-in]]/page.tsx`). They depend on Clerk env vars (`NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY`, `CLERK_SECRET_KEY`) being set on Vercel. If they aren't, the conditional middleware degrades to pass-through (commit 702474c) so the site still loads, but sign-in itself won't work. **Confirm both env vars are set on Vercel before launch.**

---

## 15. Admin (`/admin`)

Entry page exists at `src/app/admin/page.tsx` and is gated by `user?.publicMetadata?.role === 'admin'`. The "set admin role" affordance in the user dropdown (`Navigation.tsx:141`) calls `useSetAdminRole().mutateAsync(user.id)` — anyone signed in can promote themselves. **This is intended for bootstrapping but must be removed or gated before public launch**, otherwise the first random sign-up can grant themselves admin.

| # | Sev | Symptom | Cause | Fix |
|---|---|---|---|---|
| 15.1 | **HIGH** | Self-promotion to admin is exposed in the user dropdown. | `handleSetAdminRole` at `Navigation.tsx:141-152`. The mutation endpoint should also enforce server-side that only existing admins can promote. | S in the UI (hide), M in the API if not already enforced. |

I didn't open each of the 15 admin sub-pages — most are CRUD over models that exist. Manual click-test before launch.

---

## 16. ProductCard component (`ProductCard.tsx`)

| # | Sev | Symptom | Cause | Fix |
|---|---|---|---|---|
| 16.1 | MED | `getPricingColor` returns identical green styling for Free / Freemium / Paid (lines 50-56). Pricing pill on every card looks the same — no visual distinction. | Function body is dead — all branches return the same string. | S — give each tier a distinct color (matches what `trending.tsx`'s helper attempts). |

---

## 17. Image domain / next.config

`next.config.js` allows `https://**` and `http://**` and sets `unoptimized: true`. That means the whole point of `next/image` (optimization, lazy loading, blur) is disabled — every image is fetched at full resolution. For 152 cards on the homepage that's a real LCP cost.

| # | Sev | Symptom | Cause | Fix |
|---|---|---|---|---|
| 17.1 | MED | `images.unoptimized: true` site-wide, and `<Image unoptimized />` repeated on every render site. | Initial bootstrap config to avoid wrangling Vercel image-CDN allowlists. Never tightened. | M — narrow `remotePatterns` to the 4-5 logo CDNs we actually use (clearbit, google favicon, ui-avatars, the Atlas-hosted submitter uploads) and drop `unoptimized` everywhere. |

---

## What's NOT in this audit

- Visual regression check (no browser session)
- Mobile/responsive sweep (read code only)
- Performance / Lighthouse scores
- SEO / structured-data correctness
- Best-of pages (`/best-ai-*`) — not in the user's surface list and use hardcoded data
- Blog / News / Software pages — depend on data I didn't sample

---

## Recommended launch-blockers (subjective)

If launching this week, fix in this order:
1. **15.1** — self-promotion to admin (security)
2. **1.1** — fake FOMO activity (trust)
3. **3.1** — Top Products "Load More" does nothing (broken feature)
4. **5.1 / 3.2 / 2.1** — three pages mostly empty due to unused editorial flags (one decision, three fixes)
5. **8.1** — "#0" rank badge on detail page (visibly broken)
6. **12.1 / 12.2** — orange/green brand mismatch in mobile nav (visible polish)

Everything else can ship and be cleaned up post-launch.
