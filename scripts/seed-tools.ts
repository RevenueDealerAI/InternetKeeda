/**
 * Seed MongoDB with the bundled AI tools catalog.
 *
 * Reads `extracted/DB/5000tools.json` (MongoDB Extended-JSON dump) and
 * upserts every tool into the `tools` collection. Categories referenced
 * by the tools are auto-created in the `categories` collection.
 *
 * Usage:
 *   1. Fill MONGODB_URI in .env.local
 *   2. npm run seed
 *
 * Flags:
 *   --reset           drop existing tools and categories before seeding
 *   --file <path>     override the JSON source path
 *   --limit <n>       only seed the first n entries (useful for smoke tests)
 */

import { readFileSync, existsSync } from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import mongoose from 'mongoose';

// Load .env.local first (Next.js convention), then fall back to .env
loadEnv({ path: '.env.local' });
loadEnv();

import { Tool } from '../src/app/api/models/Tool';
import { Category } from '../src/app/api/models/Category';

type RawPricing = { type?: string; startingPrice?: number };
type RawTool = {
  _id?: { $oid: string } | string;
  name: string;
  slug?: string;
  description?: string;
  websiteUrl?: string;
  category?: string;
  tags?: string[];
  pricing?: RawPricing;
  features?: string[];
  logo?: string;
  status?: string;
  isTrending?: boolean;
  isNew?: boolean;
  isNewTool?: boolean;
  isUpcoming?: boolean;
  isTopRated?: boolean;
  views?: number;
  votes?: number;
  rating?: number;
  reviews?: number;
  createdAt?: { $date: string } | string;
  updatedAt?: { $date: string } | string;
};

const VALID_PRICING_TYPES = new Set(['free', 'freemium', 'paid', 'enterprise']);
const VALID_STATUS = new Set([
  'draft',
  'published',
  'archived',
  'pending',
  'approved',
  'rejected',
]);

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseDate(input: unknown): Date | undefined {
  if (!input) return undefined;
  if (typeof input === 'string') return new Date(input);
  if (typeof input === 'object' && input !== null && '$date' in input) {
    return new Date((input as { $date: string }).$date);
  }
  return undefined;
}

function normalizeTool(raw: RawTool): Record<string, unknown> | null {
  if (!raw?.name || !raw?.websiteUrl || !raw?.description) return null;

  const pricingType = VALID_PRICING_TYPES.has(raw.pricing?.type ?? '')
    ? (raw.pricing!.type as string)
    : 'free';

  const status = VALID_STATUS.has(raw.status ?? '') ? raw.status! : 'published';

  const slug = (raw.slug && raw.slug.trim()) || slugify(raw.name);

  return {
    name: raw.name,
    slug,
    description: raw.description,
    websiteUrl: raw.websiteUrl,
    category: raw.category || 'Uncategorized',
    tags: Array.isArray(raw.tags) ? raw.tags : [],
    pricing: {
      type: pricingType,
      ...(typeof raw.pricing?.startingPrice === 'number'
        ? { startingPrice: raw.pricing.startingPrice }
        : {}),
    },
    features: Array.isArray(raw.features) ? raw.features : [],
    logo: raw.logo || '',
    status,
    isTrending: !!raw.isTrending,
    isNewTool: !!(raw.isNewTool ?? raw.isNew),
    isUpcoming: !!raw.isUpcoming,
    isTopRated: !!raw.isTopRated,
    views: typeof raw.views === 'number' ? raw.views : 0,
    votes: typeof raw.votes === 'number' ? raw.votes : 0,
    rating: typeof raw.rating === 'number' ? raw.rating : 0,
    reviews: typeof raw.reviews === 'number' ? raw.reviews : 0,
    createdAt: parseDate(raw.createdAt) ?? new Date(),
    updatedAt: parseDate(raw.updatedAt) ?? new Date(),
  };
}

function parseFlags() {
  const args = process.argv.slice(2);
  const flags = {
    reset: false,
    file: 'scripts/seed-data/tools.json',
    limit: undefined as number | undefined,
  };
  for (let i = 0; i < args.length; i++) {
    const arg = args[i];
    if (arg === '--reset') flags.reset = true;
    else if (arg === '--file') flags.file = args[++i];
    else if (arg === '--limit') flags.limit = parseInt(args[++i], 10);
  }
  return flags;
}

async function main() {
  const flags = parseFlags();
  const uri = process.env.MONGODB_URI;

  if (!uri) {
    console.error('❌ MONGODB_URI is not set.');
    console.error('   Add it to .env.local. Get a free one at https://cloud.mongodb.com.');
    process.exit(1);
  }

  const absFile = path.resolve(process.cwd(), flags.file);
  if (!existsSync(absFile)) {
    console.error(`❌ Seed file not found: ${absFile}`);
    process.exit(1);
  }

  console.log('▶  Reading seed file…');
  const raw = readFileSync(absFile, 'utf8');

  console.log('▶  Parsing JSON…');
  const data = JSON.parse(raw) as RawTool[];
  console.log(`   Found ${data.length} entries.`);

  console.log('▶  Connecting to MongoDB…');
  await mongoose.connect(uri);
  console.log('   Connected.');

  if (flags.reset) {
    console.log('▶  --reset: clearing tools + categories…');
    await Tool.deleteMany({});
    await Category.deleteMany({});
  }

  const tools = data
    .map(normalizeTool)
    .filter((t): t is Record<string, unknown> => t !== null);
  const sliced = flags.limit ? tools.slice(0, flags.limit) : tools;

  console.log(`▶  Upserting ${sliced.length} tools (in batches of 500)…`);
  const BATCH = 500;
  let upserted = 0;
  for (let i = 0; i < sliced.length; i += BATCH) {
    const chunk = sliced.slice(i, i + BATCH);
    const ops = chunk.map((doc) => ({
      updateOne: {
        filter: { slug: doc.slug as string },
        update: { $set: doc },
        upsert: true,
      },
    }));
    const res = await Tool.bulkWrite(ops, { ordered: false });
    upserted += (res.upsertedCount ?? 0) + (res.modifiedCount ?? 0);
    process.stdout.write(`   …${Math.min(i + BATCH, sliced.length)} / ${sliced.length}\r`);
  }
  console.log(`\n   Tools done (${upserted} upserted/modified).`);

  console.log('▶  Building Categories from tool data…');
  const categories = new Map<string, { name: string; toolCount: number }>();
  for (const t of sliced) {
    const name = (t.category as string) || 'Uncategorized';
    const slug = slugify(name);
    if (!categories.has(slug)) categories.set(slug, { name, toolCount: 0 });
    categories.get(slug)!.toolCount += 1;
  }

  const catOps = Array.from(categories.entries()).map(([slug, c]) => ({
    updateOne: {
      filter: { slug },
      update: {
        $set: {
          name: c.name,
          slug,
          isActive: true,
          isDefault: false,
          toolCount: c.toolCount,
        },
      },
      upsert: true,
    },
  }));
  if (catOps.length > 0) {
    const res = await Category.bulkWrite(catOps, { ordered: false });
    console.log(
      `   Categories: ${res.upsertedCount ?? 0} created, ${res.modifiedCount ?? 0} updated (${categories.size} total).`,
    );
  }

  await mongoose.disconnect();
  console.log('✅ Seed complete.');
}

main().catch((err) => {
  console.error('❌ Seed failed:', err);
  process.exit(1);
});
