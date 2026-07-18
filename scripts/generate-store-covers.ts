/**
 * Auto-generates a brand-consistent cover image for each of the 5 Keeda Labs
 * n8n workflow products, using Pollinations.ai (free flux image API), uploads
 * each to Vercel Blob, and writes the resulting URL onto the product's
 * `coverImageUrl` field in MongoDB.
 *
 * (Verified 2026-07-07: the Pollinations flux endpoint is live and free — an
 * earlier revision of this script wrongly assumed it had been paywalled.)
 *
 * Architecture note (why this does NOT use access:'public'):
 *   The store's Blob store is PRIVATE. Covers are served to the browser
 *   through the /api/store/cover/[productId] passthrough (which reads the
 *   blob with access:'private' and only for status:'published' products).
 *   So we reuse the repo's existing uploadPublicCover() helper — it uploads
 *   to the private store under store/covers/ — and store the raw blob URL in
 *   coverImageUrl. The API layer rewrites that to /api/store/cover/{_id}
 *   before it ever reaches the client. See src/app/api/store/products/route.ts
 *   and src/features/store/lib/storage.ts.
 *
 * Idempotent & re-runnable:
 *   - Skips any product that already has a coverImageUrl.
 *   - Pass --force to regenerate (deletes the old blob first, then replaces).
 *   - The Pollinations seed is derived deterministically from the slug, so a
 *     forced re-run reproduces the same image.
 *
 *   npx tsx scripts/generate-store-covers.ts
 *   npx tsx scripts/generate-store-covers.ts --force
 *
 * Env (already in .env.local): MONGODB_URI, BLOB_READ_WRITE_TOKEN
 */
import { config as loadEnv } from 'dotenv';
loadEnv({ path: '.env.local' });
loadEnv();

import mongoose from 'mongoose';
import sharp from 'sharp';
import { StoreProduct } from '../src/features/store/models/StoreProduct';
import {
  uploadPublicCover,
  deletePrivateFile,
  blobExists,
} from '../src/features/store/lib/storage';

// ── Brand style, appended verbatim to every prompt so all 5 read as a set ──
// Realistic, relatable photography: each cover shows the workflow's real-
// world moment (a phone getting an auto-reply, a laptop with drafted posts)
// rather than an abstract diagram. Shared photographic direction keeps the
// warm palette + lighting cohesive across all five.
const STYLE_SUFFIX =
  'realistic professional photograph, warm modern workspace, natural soft ' +
  'window light, shallow depth of field, photorealistic, high detail, clean ' +
  'premium composition, warm inviting color palette, 35mm, no gibberish ' +
  'text, no logos, no watermark.';

// Output size we upscale to before upload. Pollinations' free tier (model
// "sana") caps native output at 1024×576 for 16:9 — we fetch at that native
// size, then upscale + sharpen to this crisper 16:9 asset with sharp so the
// covers look clean on retina cards and the larger detail-page hero.
const OUT_W = 1600;
const OUT_H = 900;

interface CoverSpec {
  slug: string;
  /** Subject clause — specific to what THIS workflow actually does. */
  subject: string;
}

const COVERS: CoverSpec[] = [
  {
    slug: 'n8n-lead-instant-reply',
    subject:
      'A smartphone on a warm wooden desk showing a friendly text-message ' +
      'reply sent to a new website lead, with an open laptop displaying a ' +
      'website contact form softly blurred in the background, a small ' +
      'business office setting.',
  },
  {
    slug: 'n8n-missed-call-text-back',
    subject:
      'A smartphone lying on a warm wooden desk showing a missed call ' +
      'notification and an automatic reply text-message bubble being sent ' +
      'back to the caller, a cozy small-business office softly blurred ' +
      'behind it.',
  },
  {
    slug: 'n8n-review-request-engine',
    subject:
      'A hand holding a smartphone that shows a glowing five-star rating and ' +
      'a friendly message asking a happy customer to leave a review, a warm ' +
      'small shop or cafe counter softly blurred in the background.',
  },
  {
    slug: 'n8n-content-repurposer',
    subject:
      'An open laptop on a content creator’s desk displaying several social ' +
      'media posts arranged side by side on screen, a coffee cup and a ' +
      'notebook nearby, a bright warm home-office setting.',
  },
  {
    slug: 'n8n-rss-ai-draft',
    subject:
      'An open laptop on a tidy editor’s desk showing a draft blog article ' +
      'in a text editor waiting for review, an open notebook and pen beside ' +
      'it, a calm warm morning workspace.',
  },
  {
    slug: 'n8n-seo-research-bot',
    subject:
      'An open laptop on a warm wooden desk showing a clean email briefing ' +
      'with a short list of headline findings and a simple upward trend ' +
      'chart, a fresh morning coffee beside it, a calm sunlit home office ' +
      'suggesting research done automatically overnight.',
  },
];

/** Deterministic 31-bit seed from the slug (FNV-1a) so re-runs reproduce the
 *  same image from Pollinations. */
function stableSeed(slug: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < slug.length; i++) {
    h ^= slug.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  // Fold to a positive integer within Pollinations' accepted seed range.
  return (h >>> 0) % 2_000_000_000;
}

function sleep(ms: number): Promise<void> {
  return new Promise((r) => setTimeout(r, ms));
}

/** Fetch the Pollinations image with a 60s timeout and up to 3 retries with
 *  exponential backoff on timeout or 5xx. Returns raw image bytes. */
async function fetchCover(prompt: string, seed: number): Promise<Buffer> {
  // Request the native cap (1024×576). Larger width/height are silently
  // clamped by the free tier, so asking for more just wastes bytes.
  const url =
    `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}` +
    `?width=1024&height=576&model=flux&nologo=true&seed=${seed}`;

  // Pollinations runs on shared GPUs and 500s in bursts, so retry generously.
  const maxAttempts = 6;
  let lastErr: unknown;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 60_000);
    try {
      const res = await fetch(url, { signal: controller.signal });
      clearTimeout(timer);
      if (res.status >= 500) throw new Error(`Pollinations ${res.status}`);
      if (!res.ok) throw new Error(`Pollinations non-retryable ${res.status}`);
      const buf = Buffer.from(await res.arrayBuffer());
      if (buf.length < 1024) {
        throw new Error(`suspiciously small image (${buf.length} bytes)`);
      }
      return buf;
    } catch (e) {
      clearTimeout(timer);
      lastErr = e;
      const msg = e instanceof Error ? e.message : String(e);
      const retryable =
        msg.includes('abort') ||
        /Pollinations 5\d\d/.test(msg) ||
        msg.includes('small image');
      if (!retryable || attempt === maxAttempts) break;
      // 2s, 4s, 8s, 16s, 30s (capped) — ride out a GPU burst.
      const backoff = Math.min(2000 * 2 ** (attempt - 1), 30_000);
      console.log(
        `    attempt ${attempt} failed (${msg}) — retrying in ${backoff}ms`
      );
      await sleep(backoff);
    }
  }
  throw new Error(
    `fetchCover failed after ${maxAttempts} attempts: ${
      lastErr instanceof Error ? lastErr.message : String(lastErr)
    }`
  );
}

/** Upscale the native 1024×576 frame to a crisp OUT_W×OUT_H 16:9 JPEG.
 *  lanczos3 for the resize, a light sharpen to counter upscale softening,
 *  and mozjpeg quality 90 for a clean, well-compressed asset. */
async function upscale(input: Buffer): Promise<Buffer> {
  return sharp(input)
    .resize(OUT_W, OUT_H, { fit: 'cover', kernel: 'lanczos3' })
    .sharpen({ sigma: 0.8 })
    .jpeg({ quality: 90, mozjpeg: true })
    .toBuffer();
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN not set. Pull it with `vercel env pull .env.local` ' +
        'or paste it into .env.local before running.'
    );
  }
  const force = process.argv.includes('--force');

  await mongoose.connect(uri);
  if (mongoose.connection.name !== 'internetkeeda') {
    throw new Error(
      `Refusing to run: connected to "${mongoose.connection.name}", expected "internetkeeda".`
    );
  }
  console.log(
    `Connected to "${mongoose.connection.name}". Generating covers for ` +
      `${COVERS.length} products (force=${force})…\n`
  );

  const results: Array<{
    slug: string;
    id: string;
    blobUrl: string;
    status: string;
  }> = [];

  for (const spec of COVERS) {
    console.log(`──── ${spec.slug} ────`);
    const product = await StoreProduct.findOne({ slug: spec.slug });
    if (!product) {
      console.log(`  SKIP — no product row found for slug ${spec.slug}\n`);
      results.push({ slug: spec.slug, id: '', blobUrl: '', status: 'MISSING' });
      continue;
    }
    const id = String(product._id);
    const prompt = `${spec.subject} ${STYLE_SUFFIX}`;
    const seed = stableSeed(spec.slug);

    console.log(`  ${product.title}`);
    console.log(`  prompt -> ${prompt}`);

    if (product.coverImageUrl && !force) {
      console.log(`  SKIP (has cover) -> ${product.coverImageUrl}`);
      console.log(`    pass --force to regenerate.\n`);
      results.push({
        slug: spec.slug,
        id,
        blobUrl: product.coverImageUrl,
        status: 'SKIP (has cover)',
      });
      continue;
    }

    // Generate → upload → point the DB at the NEW blob, and only THEN delete
    // the old one. This ordering matters: if generation fails we must never
    // have already deleted the live cover (which would leave the product
    // pointing at a dead blob). Wrap per-product so one failure doesn't abort
    // the batch — a re-run picks up whatever is still missing.
    const oldUrl = product.coverImageUrl;
    try {
      const raw = await fetchCover(prompt, seed);
      const bytes = await upscale(raw);
      console.log(
        `  fetched -> ${raw.length.toLocaleString()}B native, upscaled -> ` +
          `${bytes.length.toLocaleString()}B @ ${OUT_W}×${OUT_H} (seed=${seed})`
      );

      const blob = new Blob([bytes], { type: 'image/jpeg' });
      const uploaded = await uploadPublicCover(
        blob as unknown as File,
        `${spec.slug}.jpg`
      );
      console.log(`  blob URL -> ${uploaded.url}`);

      await StoreProduct.updateOne(
        { _id: product._id },
        { $set: { coverImageUrl: uploaded.url } }
      );
      console.log(`  write status -> UPDATED coverImageUrl in Mongo`);

      // Old blob is now safe to remove (random suffix → URLs never collide).
      if (oldUrl && oldUrl !== uploaded.url) {
        await deletePrivateFile(oldUrl);
        console.log(`  cleaned up old blob -> ${oldUrl}\n`);
      } else {
        console.log('');
      }
      results.push({ slug: spec.slug, id, blobUrl: uploaded.url, status: 'UPDATED' });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      console.log(`  FAILED — ${msg}\n    (old cover left intact; re-run to retry)\n`);
      results.push({ slug: spec.slug, id, blobUrl: product.coverImageUrl, status: `FAILED: ${msg}` });
    }
  }

  // ── Verification ──
  console.log('════ VERIFICATION ════');
  const base = process.env.STORE_BASE_URL?.replace(/\/$/, '') || '';
  for (const r of results) {
    if (!r.blobUrl) {
      console.log(`  ${r.slug}: ${r.status}`);
      continue;
    }
    // The raw blob is private; confirm it exists via an authenticated head().
    const ok = await blobExists(r.blobUrl);
    const passthrough = `/api/store/cover/${r.id}`;
    console.log(
      `  ${r.slug}: blob ${ok ? 'OK (head 200)' : 'MISSING'} | render -> ${passthrough}`
    );
    if (base) {
      try {
        const res = await fetch(`${base}${passthrough}`);
        console.log(`    ${base}${passthrough} -> HTTP ${res.status}`);
      } catch (e) {
        console.log(
          `    ${base}${passthrough} -> unreachable (${
            e instanceof Error ? e.message : e
          })`
        );
      }
    }
  }
  if (!base) {
    console.log(
      '\n  (Set STORE_BASE_URL=http://localhost:3000 with the dev server ' +
        'running to also HTTP-200-check the public passthrough URLs.)'
    );
  }

  await mongoose.disconnect();
  console.log('\nDone.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
