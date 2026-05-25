# Internet Keeda — engineering notes

Single-line facts that don't fit anywhere else. Add new ones at the top.

## 2026-05-25 (session 2)

- **P4 user-dashboard redesign + P5 design-system / 3D worm**:
  deferred from this polish chain. Reasoning: the visual lock
  established 2026-05-21 requires a reference URL before broad
  aesthetic edits land, and neither of these has one. The existing
  surfaces (1600-line Dashboard.tsx, mature ProductCard / Sidebar /
  AdminLayout) are already functional. P3's single substantive gap
  (pending-submissions panel) shipped; P5 typography/animation/3D
  remains gated on a reference URL or explicit "ignore the lock"
  from the user.

- **P6 Lighthouse**: target was ≥85 mobile. Production baseline
  before this chain deploys: 79 desktop / 51 mobile home / 43
  mobile category. The chain (image-optimization-on, AVIF/WebP,
  Cache-Control on /api/{blog,news,faq,categories,tools/stats},
  .lean() on hot reads, Payment+Subscription compound indexes,
  172 transitive deps removed) targets LCP and TTFB. TBT is the
  residual gap and needs a server-component refactor of /,
  /category/[id] — out of scope this session. Full punchlist in
  docs/PERF-BASELINE-2026-05-25.md.

## 2026-05-25

- **n8n**: confirmed absent in Internet Keeda repo. Source-grep returns
  zero matches across `src/`, `public/`, `app/`, `components/`,
  `package.json`, `README.md`, env files. The only `n8n` byte
  sequences in the tree are inside binary blobs (original CodeCanyon
  ZIP, PNG/GIF assets) — false-positive byte coincidences, not
  references. Nothing to remove.

- **Categories dropdown** (carry-over from Area 7): verified live via
  `GET /api/categories` — returns 678 categories alphabetised
  (`360 images, 3D & Modeling, AI Agents, AI Art & Design, …`).
  Submit-tool server-side category validation in
  `src/app/api/tools/submit/route.ts` rejects unknown slugs with 400
  *after* the auth gate (anon submissions hit 401 first).
