# PLAN — Auto-generate store cover images (Pollinations → Vercel Blob → Mongo)

Status: **PHASE 1 complete (discovery). Awaiting your approval before implementing.**

---

## 1. The 5 workflows (live in prod MongoDB)

Data source: **MongoDB**, collection `storeproducts`, model `src/features/store/models/StoreProduct.ts`.
The seed script `scripts/seed-store-workflow-bundle.ts` defines the spec, but the authoritative
records are the Mongo rows below (queried read-only just now via `MONGODB_URI`):

| # | _id | slug | title | status | price | cover |
|---|-----|------|-------|--------|-------|-------|
| 1 | 6a3e5ec5bcd66c23f8efebb3 | `n8n-lead-instant-reply`   | Lead Instant Reply (n8n)        | **published** | $49 / ₹3999 | **(empty)** |
| 2 | 6a3e5ec5bcd66c23f8efebb4 | `n8n-missed-call-text-back`| Missed-Call Text-Back (n8n)     | **published** | $49 / ₹3999 | **(empty)** |
| 3 | 6a3e5ec6bcd66c23f8efebb5 | `n8n-review-request-engine`| Review Request Engine (n8n)     | **published** | $49 / ₹3999 | **(empty)** |
| 4 | 6a3e5ec6bcd66c23f8efebb7 | `n8n-content-repurposer`   | Content Repurposer (n8n)        | **published** | $49 / ₹3999 | **(empty)** |
| 5 | 6a3e5ec7bcd66c23f8efebb8 | `n8n-rss-ai-draft`         | RSS → AI Draft, Review Only (n8n)| **published** | $49 / ₹3999 | **(empty)** |

**All 5 have an empty `coverImageUrl` → nothing to overwrite. `--force` will not be needed for the first run.**
(Note: they are already `published`, not drafts — so covers will render on the live site the moment the DB write lands.)

---

## 2. Data model & cover rendering (IMPORTANT — differs from the task's literal instructions)

**Field:** `StoreProduct.coverImageUrl` (string). It stores the **raw Vercel Blob URL**.

**How it renders — this is the key architectural constraint:**
- The Blob store backing this repo is **PRIVATE**, not public (`src/features/store/lib/storage.ts` uploads with `access: 'private'`; `/api/store/cover/[productId]/route.ts` reads with `access: 'private'`).
- The raw blob URL is **never** sent to the browser. The API layer rewrites `coverImageUrl` → the passthrough route **`/api/store/cover/{_id}`** in both `GET /api/store/products` and `GET /api/store/products/[slug]` / `ProductDetailSSR`.
- `ProductCard.tsx` renders `<img src={product.coverImageUrl}>` where that value is already the `/api/store/cover/{_id}` route (rewritten server-side).
- The passthrough route **only serves covers for `status: 'published'` products** — all 5 qualify.
- Expected aspect ratio: **16:9** on both the card (`aspectRatio: '16/9'`) and the detail page. → matches the requested `1200×675`.

**Consequences for this task — I will deviate from three literal instructions in the brief, because following them would break this repo:**

| Brief says | What this repo requires | Decision |
|---|---|---|
| upload with `access: 'public'` | store is private; `access:'public'` **throws** | Reuse `uploadPublicCover()` → `access: 'private'`. Rendering already works via the passthrough route. |
| `addRandomSuffix: false`, stable path `store/covers/{slug}.jpg` | `uploadPublicCover()` random-suffixes; rendering is keyed by **product _id**, not by URL, so a stable path is unnecessary | Keep the existing util's `store/covers/{slug}` prefix + random suffix. Cover renders regardless of URL. |
| write raw URL and render it directly | raw private URL is not directly viewable | Write raw blob URL to `coverImageUrl`; the passthrough route makes it public. |

If you *specifically* want stable, directly-viewable public URLs, that needs a **separate public Blob store** — a bigger change I'd flag before doing. I recommend reusing the existing private-store + passthrough pattern (zero infra change). **Tell me if you disagree.**

---

## 3. Blob upload approach

**Reuse the existing util** — `uploadPublicCover(file, fileName)` from `src/features/store/lib/storage.ts`.
- Uploads to `store/covers/{safeFileName}` on the private store, `access: 'private'`, explicit `BLOB_READ_WRITE_TOKEN`.
- Returns `{ url, fileName, sizeBytes }`. The `url` is what we write to `coverImageUrl`.
- **No new dependencies.** `@vercel/blob`, `mongoose`, `dotenv`, `tsx` are all already installed.

Idempotency: since the util random-suffixes, re-running with `--force` creates a *new* blob and leaves the old orphaned. I'll `deletePrivateFile(oldUrl)` (also already in storage.ts) before replacing on `--force`, so we don't churn orphans.

---

## 4. Write path

Direct MongoDB update (same client/model the seed script uses):
```
StoreProduct.updateOne({ slug }, { $set: { coverImageUrl: blobUrl } })
```
No data-file edit — covers are not stored in any seed/config file, only in Mongo.
Skip logic: if `existing.coverImageUrl` is non-empty and `--force` not passed → **skip** (log `SKIP (has cover)`).

---

## 5. Pollinations prompts (one matched brand style)

Endpoint per image:
```
https://image.pollinations.ai/prompt/{encodeURIComponent(fullPrompt)}?width=1200&height=675&model=flux&nologo=true&seed={stableSeed}
```
- `stableSeed` = deterministic FNV-1a hash of the slug → same image every re-run.
- 60s timeout, up to 3 retries with exponential backoff (1s→2s→4s) on timeout/5xx.

**Shared style suffix appended to every prompt (verbatim from brief):**
> `editorial ivory/paper background, warm muted palette, clean minimal isometric illustration representing the workflow's function, soft studio lighting, no text, no words, no logos.`

**Per-workflow subject (specific to what each actually does):**

1. **Lead Instant Reply** — `An isometric illustration of a website contact form instantly sending a text-message reply to a smartphone, with a spreadsheet row and an email envelope beside it, connected by soft flowing lines showing an automated lead-response flow.`

2. **Missed-Call Text-Back** — `An isometric illustration of a smartphone showing a missed call that automatically sends a text message back to the caller, with a small spreadsheet logging the missed call beside it.`

3. **Review Request Engine** — `An isometric illustration of a completed-job checkmark triggering a timed text message that politely requests a five-star review, with review stars and a one-tap review link floating nearby.`

4. **Content Repurposer** — `An isometric illustration of a single article document splitting into multiple social outputs — a short thread, a set of post cards, and a newsletter — arranged as branching outputs from one source.`

5. **RSS → AI Draft** — `An isometric illustration of an RSS feed feeding into a document being drafted by an AI pen, the finished draft landing in a review tray marked for human approval, with no publish step.`

Final prompt = `{subject} {styleSuffix}`.

---

## 6. Deliverable in Phase 2 (after approval)

`scripts/generate-store-covers.ts` — re-runnable, idempotent:
1. Loop the 5 slugs → build prompt → fetch Pollinations (timeout+retry) → `uploadPublicCover(store/covers/{slug}.jpg)` → `StoreProduct.updateOne` on `coverImageUrl`.
2. Skip any with an existing cover unless `--force` (and on `--force`, delete the old blob first).
3. Per-workflow log line: `title -> prompt -> blob URL -> write status`.
4. Verification: print the 5 `/api/store/cover/{_id}` URLs, HTTP-200 check each, show the before/after Mongo values.

**Run command & env:**
```
npx tsx scripts/generate-store-covers.ts          # first run (all 5, since covers empty)
npx tsx scripts/generate-store-covers.ts --force  # regenerate/overwrite
```
Env (already in `.env.local`): `MONGODB_URI`, `BLOB_READ_WRITE_TOKEN`.

Then start the store: `pnpm dev` → visit `/store` (cards) and a detail page e.g. `/store/n8n-lead-instant-reply`.

**Guardrails honored:** idempotent, never overwrite without `--force`, no new deps, reuse existing Blob util + Mongo model, **no commit — changes left staged.**

---

## STOP — awaiting your approval

Please confirm, especially: **OK to reuse the private-store + `/api/store/cover` passthrough pattern** (my recommendation) rather than the literal `access:'public'` / stable-path approach in the brief? Then I'll implement Phase 2.
