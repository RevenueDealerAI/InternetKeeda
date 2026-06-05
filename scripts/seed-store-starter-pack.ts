/**
 * Seeds the 3 starter Keeda Labs n8n products as DRAFTS.
 *
 * Same pipeline the admin UI uses:
 *   - uploadPrivateFile()  (from features/store/lib/storage.ts)
 *   - StoreProduct.create() with status='draft'
 *
 * For each product:
 *   1. Bundle workflow.json + README.md into a single .zip
 *   2. Run an inline secret scan (refuses to upload anything that
 *      looks like an API key)
 *   3. Stream the zip to Vercel Blob under store/private/...
 *   4. Insert the StoreProduct row pointing at the resulting URL
 *   5. status='draft' — admin flips published when they're ready
 *
 * Idempotent on the StoreProduct slug. Re-running:
 *   - If a product with the same slug exists and HAS a filePath,
 *     skip the upload (don't churn blobs) and only refresh metadata.
 *   - If filePath is missing or you pass --force, re-uploads and
 *     replaces the URL.
 *
 *   npx tsx scripts/seed-store-starter-pack.ts
 *   npx tsx scripts/seed-store-starter-pack.ts --force
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

const PRODUCTS: ProductSpec[] = [
  {
    dir: 'stripe-invoices-to-sheets',
    slug: 'n8n-stripe-paid-invoices-to-sheets',
    title: 'Stripe Paid Invoices → Google Sheets (n8n)',
    shortDescription:
      'A no-fluff n8n workflow that logs every paid Stripe invoice into a Google Sheet — one clean row per invoice. Solo-founder accounting in 20 minutes.',
    description:
      'Stops you maintaining manual CSVs the moment your Stripe volume crosses "easy to track by hand." The workflow listens for invoice.paid webhooks, normalises every field that matters (currency, tax, totals, hosted invoice URL, paid-at timestamp), and appends a row to the Google Sheet of your choice. The Code node deliberately exposes amounts in both minor (paise/cents) and major units so the same sheet works for both your bookkeeping and a human eyeballing the totals.\n\nBuilt for founders, indie hackers, and small finance ops teams that have outgrown manual export-and-paste but cannot justify the price of a real billing platform yet. Idempotent on stripe_invoice_id so re-played webhooks do not double-insert.',
    tags: [
      'stripe',
      'google-sheets',
      'finance',
      'invoicing',
      'webhook',
      'accounting',
      'n8n',
    ],
    includes: [
      'Importable n8n workflow JSON (workflow.json)',
      'Step-by-step setup README with credential walkthrough',
      'Recommended Google Sheet column layout you can paste as a header row',
      'Lifetime updates — re-download anytime we ship a new revision',
    ],
    priceUsdMinor: 4900, // $49.00 — flat base price across all workflows
    priceInrMinor: 399900, // ₹3,999 — clean fixed INR figure, not an FX calc
    zipFilename: 'stripe-paid-invoices-to-sheets.zip',
  },
  {
    dir: 'rss-ai-summary-to-wordpress',
    slug: 'n8n-rss-ai-summary-to-wordpress',
    title: 'RSS → AI Summary → WordPress Draft (n8n)',
    shortDescription:
      'Polls an RSS feed every two hours, summarises new items with OpenAI, and pushes a clean draft into WordPress. Ready for a human eyeball, never auto-publishes.',
    description:
      'Built for editors, blog operators, and any small content team that wants the leverage of AI summaries without auto-publishing slop. Watches an RSS feed of your choice on a 2-hour cadence, de-dupes already-processed items in workflow static data, calls the OpenAI Chat Completions API with a tuned editorial system prompt, and creates a WordPress draft post — title, body, and a credited source link footer. Nothing goes live without a human flip.\n\nThe OpenAI prompt is intentionally short and opinionated (80-120 words, HTML, no headings) so the output drops cleanly into both Gutenberg and Classic editor. The de-dupe set is capped at 500 entries so the workflow does not grow memory unbounded. At gpt-4o-mini rates, expect under a dollar a month for a typical noisy feed.',
    tags: [
      'rss',
      'openai',
      'wordpress',
      'content',
      'ai-summary',
      'editorial',
      'n8n',
    ],
    includes: [
      'Importable n8n workflow JSON (workflow.json)',
      'Setup README covering OpenAI + WordPress credentials',
      'Tuned editorial system prompt — replaceable in one field',
      'In-memory de-dupe Code node (with notes on scaling to Redis)',
      'Lifetime updates',
    ],
    priceUsdMinor: 4900, // $49.00
    priceInrMinor: 399900, // ₹3,999
    zipFilename: 'rss-ai-summary-to-wordpress.zip',
  },
  {
    dir: 'new-lead-enrich-to-slack',
    slug: 'n8n-new-lead-enrich-to-slack',
    title: 'New Lead → Enrich → Slack Notification (n8n)',
    shortDescription:
      'A drop-in lead-intake endpoint that enriches incoming leads via Clearbit and posts a structured notification to Slack. Replies to the form immediately, enriches in parallel.',
    description:
      'Wire your landing-page form straight at this n8n webhook and get enriched, formatted lead alerts in your team Slack the moment someone submits. The Validate node guards against malformed payloads, the HTTP node calls Clearbit (swap in Apollo, Hunter, or any HTTP-shaped enrichment in 30 seconds), and the Shape Code node merges the original form fields with whatever the enrichment provider returns — including a graceful degrade for emails the enrichment provider does not know about.\n\nThe Slack message includes name, title, company, headcount, industry, LinkedIn, the lead\'s original message, and the source. The webhook responds to the caller in parallel with the enrichment branch, so your landing page never blocks on a slow third-party API.',
    tags: [
      'leads',
      'clearbit',
      'slack',
      'webhook',
      'sales',
      'enrichment',
      'crm',
      'n8n',
    ],
    includes: [
      'Importable n8n workflow JSON (workflow.json)',
      'Setup README with curl test command included',
      'Webhook payload contract documented (required + optional fields)',
      'Notes on swapping Clearbit for Apollo / Hunter / PDL',
      'Lifetime updates',
    ],
    priceUsdMinor: 4900, // $49.00
    priceInrMinor: 399900, // ₹3,999
    zipFilename: 'new-lead-enrich-to-slack.zip',
  },
];

const SEED_BASE = path.resolve('scripts/seed-data');

/** Looks for shapes that look like real API keys / tokens, refuses
 *  to upload if any are present. Defence in depth: the workflows
 *  are reviewed below, but a future contributor might paste a
 *  secret in by accident. */
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
    { label: 'Clearbit key',   re: /\bsk_[a-f0-9]{32,}\b/gi },
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

/** Confirms credential blocks are empty placeholders, not values. */
function assertCredentialsEmpty(jsonText: string, slug: string): void {
  const parsed = JSON.parse(jsonText) as {
    nodes?: Array<{ credentials?: Record<string, { id?: string; name?: string }> }>;
  };
  for (const node of parsed.nodes ?? []) {
    for (const [credType, cred] of Object.entries(node.credentials ?? {})) {
      if ((cred.id && cred.id.length > 0) || (cred.name && cred.name.length > 0)) {
        throw new Error(
          `[seed] product ${slug}: credential ${credType} on node ${(node as { name?: string }).name} has a non-empty id/name. Strip it.`
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
  assertCredentialsEmpty(workflowJson, spec.slug);

  // Sanity: make sure the workflow JSON parses + at least one node.
  const parsed = JSON.parse(workflowJson);
  if (!Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
    throw new Error(`[seed] ${spec.dir}/workflow.json has no nodes`);
  }

  const zip = new JSZip();
  zip.file('workflow.json', workflowJson);
  zip.file('README.md', readme);
  const buffer = await zip.generateAsync({ type: 'nodebuffer', compression: 'DEFLATE' });
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
  console.log(`Connected. Seeding ${PRODUCTS.length} starter products (force=${force})…`);

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
      const uploaded = await uploadPrivateFile(blob as unknown as File, spec.zipFilename);
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
      coverImageUrl: '',
      previewImages: [],
      filePath,
      fileName,
      fileSizeBytes,
      priceUsdMinor: spec.priceUsdMinor,
      priceInrMinor: spec.priceInrMinor,
      status: 'draft' as const,
      createdBy: existing?.createdBy || 'seed-starter-pack',
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
    console.log(`  ${action}  status=draft  $${(spec.priceUsdMinor / 100).toFixed(2)} / ₹${(spec.priceInrMinor / 100).toFixed(0)}`);
  }

  await mongoose.disconnect();
  console.log('\nDone. Open /store/admin to review the drafts.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
