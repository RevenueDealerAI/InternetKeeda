/**
 * Seeds the 5 "business automation" Keeda Labs n8n products as DRAFTS.
 *
 * Same pipeline the admin UI + seed-store-starter-pack.ts use:
 *   - uploadPrivateFile()  (from features/store/lib/storage.ts)
 *   - StoreProduct.create() with status='draft'
 *
 * For each product:
 *   1. Bundle workflow.json + README.md into a single .zip
 *   2. Run an inline secret scan (refuses to upload anything that
 *      looks like a real API key)
 *   3. Assert every credential reference is a REPLACE_WITH_* / "(replace
 *      me)" PLACEHOLDER — not a real value. (These workflows reference
 *      credentials by placeholder name on purpose, so the starter-pack's
 *      stricter "must be empty" rule does not apply here.)
 *   4. Stream the zip to Vercel Blob under store/private/...
 *   5. Upsert the StoreProduct row pointing at the resulting URL
 *   6. status='draft' — admin flips published when they're ready
 *
 * Idempotent on the StoreProduct slug. Re-running:
 *   - If a product with the same slug exists and HAS a filePath,
 *     skip the upload (don't churn blobs) and only refresh metadata.
 *   - If filePath is missing or you pass --force, re-uploads and
 *     replaces the URL.
 *
 *   npx tsx scripts/seed-store-workflow-bundle.ts
 *   npx tsx scripts/seed-store-workflow-bundle.ts --force
 */
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import mongoose from 'mongoose';
import JSZip from 'jszip';

loadEnv({ path: '.env.local' });
loadEnv();

import { StoreProduct } from '../src/features/store/models/StoreProduct';
import { uploadPrivateFile } from '../src/features/store/lib/storage';

interface ProductSpec {
  dir: string;
  slug: string;
  title: string;
  shortDescription: string;
  description: string;
  tags: string[];
  includes: string[];
  priceUsdMinor: number; // cents
  priceInrMinor: number; // paise
  zipFilename: string;
}

// Flat pricing across the bundle: ₹3,999 / $49 — matches the existing
// Keeda Labs starter pack so the catalog reads consistently.
const PRICE_USD_MINOR = 4900; // $49.00
const PRICE_INR_MINOR = 399900; // ₹3,999

const PRODUCTS: ProductSpec[] = [
  {
    dir: 'lead-instant-reply',
    slug: 'n8n-lead-instant-reply',
    title: 'Lead Instant Reply (n8n)',
    shortDescription:
      'Texts every new website lead back in seconds, logs it to a Google Sheet, and emails you to follow up while the lead is still warm. Runs 24/7 — never drop a lead again.',
    description:
      'A website form fill is worth the most in the first five minutes — and a lead that hears nothing back goes cold (or buys from whoever replied first). This n8n workflow closes that gap automatically: the moment a lead submits your form, it saves the lead to a Google Sheet, fires a personalized auto-reply SMS via Twilio, and emails you the full details so a human can call back fast.\n\nThe order is deliberate — save → text → notify — so the durable Sheet row is written first and nothing is ever lost even if the text or email errors. Built for local businesses, agencies, and any solo founder running paid traffic to a form who cannot sit and watch the inbox all day. You connect your own n8n, Twilio, and Google accounts; no coding required beyond pasting a webhook URL into your form.',
    tags: [
      'leads',
      'twilio',
      'sms',
      'google-sheets',
      'webhook',
      'local-business',
      'lead-response',
      'n8n',
    ],
    includes: [
      'Importable n8n workflow JSON (workflow.json)',
      'Step-by-step setup README with credential walkthrough',
      'Recommended Google Sheet column layout you can paste as a header row',
      'Notes for swapping the email alert to Slack',
      'Lifetime updates — re-download anytime we ship a new revision',
    ],
    priceUsdMinor: PRICE_USD_MINOR,
    priceInrMinor: PRICE_INR_MINOR,
    zipFilename: 'lead-instant-reply.zip',
  },
  {
    dir: 'missed-call-text-back',
    slug: 'n8n-missed-call-text-back',
    title: 'Missed-Call Text-Back (n8n)',
    shortDescription:
      'Auto-texts back missed callers so a lost call becomes a captured lead. The DIY version of a paid SaaS feature — built in n8n, runs on your own Twilio number.',
    description:
      'Every unanswered call is a customer who will likely just call the next business on the list. This workflow turns those missed calls into leads: when a call goes unanswered, Twilio reports the status to your n8n webhook, which instantly texts the caller back ("Sorry we missed you…"), logs the missed call to a Google Sheet for follow-up, and can email you to call back.\n\nThe IF node passes only terminal missed statuses (no-answer, busy, failed, canceled), so answered calls are ignored and a single missed call produces exactly one text — no duplicates. Built for service businesses, clinics, salons, trades, and anyone who loses revenue to voicemail. The README walks through the one genuinely fiddly part — wiring Twilio\'s call-status callback correctly — in detail. You bring your own n8n, Twilio, and Google accounts; no coding required.',
    tags: [
      'missed-call',
      'twilio',
      'sms',
      'google-sheets',
      'webhook',
      'local-business',
      'lead-capture',
      'n8n',
    ],
    includes: [
      'Importable n8n workflow JSON (workflow.json)',
      'Step-by-step setup README — including the full Twilio call-status wiring',
      'The exact list of which call statuses count as "missed"',
      'Google Sheet header layout for your follow-up list',
      'Lifetime updates',
    ],
    priceUsdMinor: PRICE_USD_MINOR,
    priceInrMinor: PRICE_INR_MINOR,
    zipFilename: 'missed-call-text-back.zip',
  },
  {
    dir: 'review-request-engine',
    slug: 'n8n-review-request-engine',
    title: 'Review Request Engine (n8n)',
    shortDescription:
      'Auto-asks happy customers for a Google review at the right moment — a couple of hours after the job — with a one-tap review link. More reviews, higher local ranking.',
    description:
      'Reviews are the highest-leverage local-SEO asset most businesses ignore, because asking is awkward and easy to forget. This workflow makes the ask automatic and perfectly timed: when a job or order is marked complete, it captures the customer, waits a couple of hours (so the ask lands when they are happiest), then texts a warm request with your one-tap Google review link.\n\nThe log node uses append-or-update matched on phone number so the same customer is never asked twice, and leaves a "Reviewed?" column you can track. The README includes the exact steps to grab your Google review short-link (g.page/r/…) and an optional spreadsheet trigger if you mark jobs done in a sheet rather than a CRM. Built for local service businesses, e-commerce sellers, and agencies managing reviews for clients. Connect your own n8n, Twilio, and Google Business Profile; no coding required.',
    tags: [
      'reviews',
      'google-reviews',
      'twilio',
      'sms',
      'local-seo',
      'google-sheets',
      'local-business',
      'n8n',
    ],
    includes: [
      'Importable n8n workflow JSON (workflow.json)',
      'Step-by-step setup README with the "get your g.page review link" walkthrough',
      'Append-or-update logging so no customer is asked twice',
      'Optional Google Sheets trigger variant',
      'Lifetime updates',
    ],
    priceUsdMinor: PRICE_USD_MINOR,
    priceInrMinor: PRICE_INR_MINOR,
    zipFilename: 'review-request-engine.zip',
  },
  {
    dir: 'content-repurposer',
    slug: 'n8n-content-repurposer',
    title: 'Content Repurposer (n8n)',
    shortDescription:
      'Turns one content URL into a Twitter/X thread, 3 LinkedIn posts, and a newsletter blurb in your tone — saved to a Sheet you can copy from. Hours of reformatting in one click.',
    description:
      'Writing the content is half the job; reformatting it for every channel is the half nobody has time for. Paste a URL into a hosted form, pick a tone, and this workflow fetches the article, extracts the readable text, asks Claude for a Twitter/X thread + three distinct LinkedIn posts + a newsletter blurb, and saves all of it to a Google Sheet you can copy straight from.\n\nThe AI key is supplied as an n8n credential, so it never appears in the workflow file, and the model output is split on clean delimiters into separate columns. The README is honest about the one real limitation — a plain HTTP fetch cannot read YouTube transcripts or pages behind logins/paywalls — and tells you exactly what to do instead. It is provider-agnostic: a few lines swap Claude for OpenAI. Built for creators, marketers, founders, and content teams. Connect your own n8n, Anthropic, and Google accounts; runs at a few cents per article.',
    tags: [
      'content',
      'repurposing',
      'claude',
      'anthropic',
      'twitter',
      'linkedin',
      'newsletter',
      'creators',
      'n8n',
    ],
    includes: [
      'Importable n8n workflow JSON (workflow.json)',
      'Setup README covering the Anthropic + Google credentials',
      'Hosted intake form (URL + tone dropdown) — no front-end to build',
      'Honest fetch-limitation guide + the OpenAI swap instructions',
      'Lifetime updates',
    ],
    priceUsdMinor: PRICE_USD_MINOR,
    priceInrMinor: PRICE_INR_MINOR,
    zipFilename: 'content-repurposer.zip',
  },
  {
    dir: 'rss-ai-draft',
    slug: 'n8n-rss-ai-draft',
    title: 'RSS → AI Draft, Review Only (n8n)',
    shortDescription:
      'Watches your RSS feeds and AI-drafts an original post into a review folder whenever something new appears. Never auto-publishes — a human approves first. Safety is the feature.',
    description:
      'The appeal of AI blogging is speed; the danger is garbage going live unsupervised. This workflow keeps the speed and removes the risk: it watches an RSS feed of your choice, and when a genuinely new item appears, Claude drafts an original title and body in your voice and drops it into a Google Sheet with Status = NEEDS REVIEW. It stops there. There is intentionally no publish node.\n\nA two-layer dedupe (the RSS trigger plus a static-data backstop keyed on guid) means the same article is not drafted twice across restarts and overlapping polls. The README is candid about the dedupe edge cases and the first-activation batch behavior, and includes the OpenAI swap. Built for editors, blog operators, and small content teams that want a draft pipeline with a mandatory human gate. Connect your own n8n, Anthropic, and Google accounts; cost scales with feed volume and stays low on sonnet.',
    tags: [
      'rss',
      'claude',
      'anthropic',
      'content',
      'ai-drafting',
      'editorial',
      'google-sheets',
      'human-review',
      'n8n',
    ],
    includes: [
      'Importable n8n workflow JSON (workflow.json)',
      'Setup README covering the Anthropic + Google credentials',
      'Two-layer dedupe (RSS trigger + static-data backstop) explained',
      'Review-only by design — no publish node ships, on purpose',
      'Lifetime updates',
    ],
    priceUsdMinor: PRICE_USD_MINOR,
    priceInrMinor: PRICE_INR_MINOR,
    zipFilename: 'rss-ai-draft.zip',
  },
];

const SEED_BASE = path.resolve('scripts/seed-data');

/** Looks for shapes that look like REAL API keys / tokens, refuses to
 *  upload if any are present. Defence in depth: the workflows are
 *  reviewed below, but a future contributor might paste a secret in by
 *  accident. */
function scanForSecrets(filename: string, content: string): void {
  const patterns: Array<{ label: string; re: RegExp }> = [
    { label: 'OpenAI key',     re: /sk-(?:proj-)?[A-Za-z0-9_-]{16,}/g },
    { label: 'Anthropic key',  re: /sk-ant-[A-Za-z0-9_-]{16,}/g },
    { label: 'Stripe live key',re: /\bsk_live_[A-Za-z0-9]{16,}/g },
    { label: 'Stripe test key',re: /\bsk_test_[A-Za-z0-9]{16,}/g },
    { label: 'Stripe webhook secret', re: /\bwhsec_[A-Za-z0-9]{16,}/g },
    { label: 'AWS access key', re: /\bAKIA[0-9A-Z]{16}\b/g },
    { label: 'Slack bot token',re: /\bxox[bp]-[A-Za-z0-9-]{10,}/g },
    { label: 'Google API key', re: /\bAIza[0-9A-Za-z_-]{20,}/g },
    { label: 'Twilio SID',     re: /\bAC[a-f0-9]{32}\b/g },
    { label: 'Twilio auth token', re: /\bSK[a-f0-9]{32}\b/g },
    { label: 'Generic Bearer', re: /\bBearer\s+[A-Za-z0-9._-]{24,}\b/g },
  ];
  for (const { label, re } of patterns) {
    if (re.test(content)) {
      throw new Error(
        `[seed] possible ${label} detected in ${filename}. Refusing to upload.`
      );
    }
  }
}

/** These workflows reference credentials by PLACEHOLDER on purpose so
 *  the buyer can see which node needs which account. We assert that
 *  every credential id/name is a recognisable placeholder — never a
 *  real-looking value. This is the right safety check for placeholder-
 *  style templates (the starter-pack's "must be empty" rule does not
 *  apply here). */
function assertCredentialsArePlaceholders(jsonText: string, slug: string): void {
  const isPlaceholder = (v: string | undefined): boolean => {
    if (!v) return true; // empty is fine
    return /REPLACE_WITH_|replace me/i.test(v);
  };
  const parsed = JSON.parse(jsonText) as {
    nodes?: Array<{
      name?: string;
      credentials?: Record<string, { id?: string; name?: string }>;
    }>;
  };
  for (const node of parsed.nodes ?? []) {
    for (const [credType, cred] of Object.entries(node.credentials ?? {})) {
      if (!isPlaceholder(cred.id) || !isPlaceholder(cred.name)) {
        throw new Error(
          `[seed] product ${slug}: credential ${credType} on node ${node.name} ` +
            `has a non-placeholder id/name (id=${JSON.stringify(cred.id)}, ` +
            `name=${JSON.stringify(cred.name)}). Strip the real value before seeding.`
        );
      }
    }
  }
}

async function bundle(spec: ProductSpec): Promise<{ buffer: Buffer; size: number }> {
  const dir = path.join(SEED_BASE, spec.dir);
  const workflowJson = readFileSync(path.join(dir, 'workflow.json'), 'utf8');
  const readme = readFileSync(path.join(dir, 'README.md'), 'utf8');

  scanForSecrets(`${spec.dir}/workflow.json`, workflowJson);
  scanForSecrets(`${spec.dir}/README.md`, readme);
  assertCredentialsArePlaceholders(workflowJson, spec.slug);

  // Sanity: make sure the workflow JSON parses + has at least one node.
  const parsed = JSON.parse(workflowJson);
  if (!Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
    throw new Error(`[seed] ${spec.dir}/workflow.json has no nodes`);
  }

  const zip = new JSZip();
  zip.file('workflow.json', workflowJson);
  zip.file('README.md', readme);
  const buffer = await zip.generateAsync({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });
  return { buffer, size: buffer.length };
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  if (!process.env.BLOB_READ_WRITE_TOKEN) {
    throw new Error(
      'BLOB_READ_WRITE_TOKEN not set. Pull it down with `vercel env pull .env.local` or paste it into .env.local before running.'
    );
  }
  const force = process.argv.includes('--force');

  await mongoose.connect(uri);
  console.log(
    `Connected. Seeding ${PRODUCTS.length} workflow products (force=${force})…`
  );

  for (const spec of PRODUCTS) {
    console.log(`\n──── ${spec.slug} ────`);

    const existing = await StoreProduct.findOne({ slug: spec.slug });

    let filePath = existing?.filePath || '';
    let fileSizeBytes = existing?.fileSizeBytes || 0;
    let fileName = existing?.fileName || spec.zipFilename;

    if (!filePath || force) {
      const { buffer, size } = await bundle(spec);
      console.log(`  zipped → ${size.toLocaleString()} bytes`);
      const blob = new Blob([buffer], { type: 'application/zip' });
      const uploaded = await uploadPrivateFile(
        blob as unknown as File,
        spec.zipFilename
      );
      filePath = uploaded.url;
      fileSizeBytes = size;
      fileName = uploaded.fileName;
      console.log(`  uploaded → ${uploaded.url}`);
    } else {
      console.log(`  reuse existing filePath → ${filePath}`);
    }

    const doc = {
      title: spec.title,
      slug: spec.slug,
      description: spec.description,
      shortDescription: spec.shortDescription,
      category: 'n8n-workflow' as const,
      tags: spec.tags,
      includes: spec.includes,
      coverImageUrl: existing?.coverImageUrl || '',
      previewImages: existing?.previewImages || [],
      filePath,
      fileName,
      fileSizeBytes,
      priceUsdMinor: spec.priceUsdMinor,
      priceInrMinor: spec.priceInrMinor,
      status: 'draft' as const,
      createdBy: existing?.createdBy || 'seed-workflow-bundle',
    };

    const result = await StoreProduct.updateOne(
      { slug: spec.slug },
      {
        $set: doc,
        $setOnInsert: { salesCount: 0, createdAt: new Date() },
      },
      { upsert: true }
    );
    const action = result.upsertedCount ? 'INSERTED' : 'UPDATED';
    console.log(
      `  ${action}  status=draft  $${(spec.priceUsdMinor / 100).toFixed(2)} / ₹${(spec.priceInrMinor / 100).toFixed(0)}`
    );
  }

  await mongoose.disconnect();
  console.log('\nDone. Open /store/admin to review the drafts and publish them.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
