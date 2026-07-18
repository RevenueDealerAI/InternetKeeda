/**
 * Seeds the "Automated SEO Research Bot" Keeda Labs n8n product as a DRAFT.
 *
 * Same pipeline as seed-store-workflow-bundle.ts (the 5 business-automation
 * products) and the admin UI:
 *   1. Bundle workflow.json + README.md into a single .zip
 *   2. Inline secret scan (refuses to upload anything that looks like a
 *      real API key)
 *   3. Assert every credential reference is a REPLACE_WITH_* / "(replace
 *      me)" PLACEHOLDER — never a real value
 *   4. Stream the zip to Vercel Blob under store/private/...
 *   5. Upsert the StoreProduct row pointing at the resulting URL
 *   6. status='draft' — admin flips published when ready
 *
 * The workflow.json here is GENERATED — do not hand-edit it. Edit
 * scripts/seed-data/seo-research-bot/build-workflow.js (the source of
 * truth, with its own self-tests + forbidden-string gate) and re-run
 * `node build-workflow.js`, then re-run this seeder with --force.
 *
 * Idempotent on the StoreProduct slug. Re-running:
 *   - If the product exists and HAS a filePath, skip the upload (don't
 *     churn blobs) and only refresh metadata.
 *   - If filePath is missing or you pass --force, re-uploads and
 *     replaces the URL.
 *
 *   npx tsx scripts/seed-store-seo-research-bot.ts
 *   npx tsx scripts/seed-store-seo-research-bot.ts --force
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

// Flat pricing across the workflow catalog: ₹3,999 / $49.
const PRICE_USD_MINOR = 4900; // $49.00
const PRICE_INR_MINOR = 399900; // ₹3,999

const SPEC = {
  dir: 'seo-research-bot',
  slug: 'n8n-seo-research-bot',
  title: 'Automated SEO Research Bot',
  shortDescription:
    'Runs weekly on its own and emails you a Claude-written briefing on the latest SEO + indexing changes — Google updates, GSC changes, algorithm news — pulled from authoritative sources. Set it once, stay ahead without the manual research.',
  description:
    'Keeping up with SEO is a part-time job: Google ships algorithm updates, Search Console changes, and crawling/indexing policy shifts constantly, spread across official blogs and a dozen news sites. Miss the wrong one and you find out from a traffic drop. This n8n workflow does the reading for you: every week it pulls the new articles from authoritative SEO sources (Google Search Central blog plus reputable SEO news — the feed list is yours to edit), fetches the full article text, and has Claude synthesize everything into one clean briefing delivered to your inbox — headline findings each with its source link, plus a short "what changed / why it matters" analysis that separates real changes from noise.\n\nIt is built to run unattended: a recency window plus persistent dedup means the same article is never analyzed twice; a dead feed or slow page is skipped instead of breaking the run; a quiet week produces no email and no API spend; and articles are only marked processed after the email actually sends, so a failed send is retried the next week rather than lost. One Claude call per week on the default claude-sonnet-4-6 keeps the cost to a few cents per run — powered by your own Anthropic API key, supplied as an n8n credential so it never appears in the workflow file. You connect your own n8n, Anthropic, and Gmail accounts; the Config node is the only thing you edit.',
  tags: [
    'seo',
    'indexing',
    'research',
    'digest',
    'claude',
    'anthropic',
    'rss',
    'google-search-central',
    'email',
    'n8n',
  ],
  includes: [
    'Importable n8n workflow JSON (workflow.json)',
    'Step-by-step setup README with the Anthropic + Gmail credential walkthrough',
    'Curated starter feed set — Google Search Central blog + reputable SEO news, editable in one place',
    'Recency filter + persistent dedup so no article is ever analyzed twice',
    'Fail-safe design: quiet no-op weeks, skip-on-slow-page fetching, retry-next-week on failed sends',
    'Lifetime updates — re-download anytime we ship a new revision',
  ],
  priceUsdMinor: PRICE_USD_MINOR,
  priceInrMinor: PRICE_INR_MINOR,
  zipFilename: 'seo-research-bot.zip',
};

const SEED_BASE = path.resolve('scripts/seed-data');

/** Looks for shapes that look like REAL API keys / tokens, refuses to
 *  upload if any are present. Defence in depth on top of the build
 *  script's own forbidden-string gate. */
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
    { label: 'GitHub token',   re: /\bghp_[A-Za-z0-9]{16,}\b/g },
    { label: 'Resend key',     re: /\bre_[A-Za-z0-9_-]{16,}\b/g },
  ];
  for (const { label, re } of patterns) {
    if (re.test(content)) {
      throw new Error(
        `[seed] possible ${label} detected in ${filename}. Refusing to upload.`
      );
    }
  }
}

/** Every credential id/name in the workflow must be a recognisable
 *  placeholder — never a real-looking value. Same rule as the bundle
 *  seeder. */
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

async function bundle(): Promise<{ buffer: Buffer; size: number }> {
  const dir = path.join(SEED_BASE, SPEC.dir);
  const workflowJson = readFileSync(path.join(dir, 'workflow.json'), 'utf8');
  const readme = readFileSync(path.join(dir, 'README.md'), 'utf8');

  scanForSecrets(`${SPEC.dir}/workflow.json`, workflowJson);
  scanForSecrets(`${SPEC.dir}/README.md`, readme);
  assertCredentialsArePlaceholders(workflowJson, SPEC.slug);

  // Sanity: the workflow JSON parses + has nodes.
  const parsed = JSON.parse(workflowJson);
  if (!Array.isArray(parsed.nodes) || parsed.nodes.length === 0) {
    throw new Error(`[seed] ${SPEC.dir}/workflow.json has no nodes`);
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
  console.log(`Connected. Seeding ${SPEC.slug} (force=${force})…`);

  const existing = await StoreProduct.findOne({ slug: SPEC.slug });

  let filePath = existing?.filePath || '';
  let fileSizeBytes = existing?.fileSizeBytes || 0;
  let fileName = existing?.fileName || SPEC.zipFilename;

  if (!filePath || force) {
    const { buffer, size } = await bundle();
    console.log(`  zipped → ${size.toLocaleString()} bytes`);
    const blob = new Blob([buffer], { type: 'application/zip' });
    const uploaded = await uploadPrivateFile(
      blob as unknown as File,
      SPEC.zipFilename
    );
    filePath = uploaded.url;
    fileSizeBytes = size;
    fileName = uploaded.fileName;
    console.log(`  uploaded → ${uploaded.url}`);
  } else {
    console.log(`  reuse existing filePath → ${filePath}`);
  }

  const doc = {
    title: SPEC.title,
    slug: SPEC.slug,
    description: SPEC.description,
    shortDescription: SPEC.shortDescription,
    category: 'n8n-workflow' as const,
    tags: SPEC.tags,
    includes: SPEC.includes,
    coverImageUrl: existing?.coverImageUrl || '',
    previewImages: existing?.previewImages || [],
    filePath,
    fileName,
    fileSizeBytes,
    priceUsdMinor: SPEC.priceUsdMinor,
    priceInrMinor: SPEC.priceInrMinor,
    status: 'draft' as const,
    createdBy: existing?.createdBy || 'seed-seo-research-bot',
  };

  const result = await StoreProduct.updateOne(
    { slug: SPEC.slug },
    {
      $set: doc,
      $setOnInsert: { salesCount: 0, createdAt: new Date() },
    },
    { upsert: true }
  );
  const action = result.upsertedCount ? 'INSERTED' : 'UPDATED';
  console.log(
    `  ${action}  status=draft  $${(SPEC.priceUsdMinor / 100).toFixed(2)} / ₹${(SPEC.priceInrMinor / 100).toFixed(0)}`
  );

  await mongoose.disconnect();
  console.log('\nDone. Open /store/admin to review the draft and publish it.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
