/**
 * Apply category merges to MongoDB.
 *
 * Reads scripts/category-audit-v2.json. For each group with is_merge=true:
 *   1. Re-tags every Tool whose category matches a member name → canonical_name.
 *   2. Deletes the old Category documents (members that aren't the canonical).
 *   3. Upserts the canonical Category doc with the correct slug + tool count.
 *
 * Singletons (is_merge=false) are left untouched — they retain their existing
 * Category doc, slug, and toolCount.
 *
 * After the merge pass, all Category.toolCount fields are recomputed from the
 * live Tool collection to ensure consistency.
 *
 * Runs inside a single MongoDB transaction. A failure rolls everything back.
 * Idempotent — re-running on already-merged data is a no-op.
 *
 * Usage:
 *   npm run apply-merges           # do it
 *   npm run apply-merges:dry       # show what would change, write nothing
 *   tsx scripts/apply-merges.ts --audit scripts/category-audit-v2.json --dry-run
 */

import { readFileSync } from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import mongoose from 'mongoose';

loadEnv({ path: '.env.local' });
loadEnv();

import { Tool } from '../src/app/api/models/Tool';
import { Category } from '../src/app/api/models/Category';

type AuditMember = string; // "Name (count)" format
type AuditGroup = {
  canonical_name: string;
  confidence: 'high' | 'medium' | 'low';
  source: 'exact' | 'keyword' | 'normalized';
  is_merge: boolean;
  member_count: number;
  total_tools: number;
  members: AuditMember[];
};
type Audit = {
  generated_at: string;
  source: { categories_in_db: number; tools_attributed: number };
  proposal: unknown;
  groups: AuditGroup[];
};

function slugify(name: string): string {
  return name
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function parseMemberName(s: AuditMember): string {
  // "Some Name (123)" → "Some Name". Only strips the final "(<digits>)".
  return s.replace(/\s+\(\d+\)\s*$/, '');
}

function parseFlags() {
  const args = process.argv.slice(2);
  const flags = {
    dryRun: false,
    audit: 'scripts/category-audit-v2.json',
  };
  for (let i = 0; i < args.length; i++) {
    const a = args[i];
    if (a === '--dry-run') flags.dryRun = true;
    else if (a === '--audit') flags.audit = args[++i];
  }
  return flags;
}

async function main() {
  const flags = parseFlags();
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not set in .env.local');
    process.exit(1);
  }

  const auditPath = path.resolve(process.cwd(), flags.audit);
  console.log(`▶  Loading audit: ${flags.audit}`);
  const audit = JSON.parse(readFileSync(auditPath, 'utf8')) as Audit;
  const merges = audit.groups.filter((g) => g.is_merge);
  console.log(`   ${merges.length} merge groups, ${audit.groups.length - merges.length} singletons.`);

  console.log('▶  Connecting to MongoDB…');
  await mongoose.connect(uri);

  // ----- Before snapshot -----
  const beforeCategoryCount = await Category.countDocuments();
  const beforeToolCount = await Tool.countDocuments();
  console.log(`   Before: ${beforeCategoryCount} categories, ${beforeToolCount} tools.`);

  // ----- Build operation plan -----
  type Plan = {
    canonical: string;
    canonicalSlug: string;
    toMove: string[]; // old category names whose tools need re-tagging
    totalTools: number;
  };
  const plan: Plan[] = [];
  let estToolUpdates = 0;
  let estCategoryDeletes = 0;
  let estCategoryUpserts = merges.length;

  for (const g of merges) {
    const canonical = g.canonical_name;
    const canonicalSlug = slugify(canonical);
    const memberNames = g.members.map(parseMemberName);
    const toMove = memberNames.filter((n) => n !== canonical);
    plan.push({ canonical, canonicalSlug, toMove, totalTools: g.total_tools });
    estCategoryDeletes += toMove.length;
  }

  // Pre-count how many tools each merge will actually touch
  for (const p of plan) {
    if (p.toMove.length === 0) continue;
    const n = await Tool.countDocuments({ category: { $in: p.toMove } });
    estToolUpdates += n;
  }

  console.log('▶  Plan summary:');
  console.log(`   • Tool re-tags:     ${estToolUpdates} documents will move`);
  console.log(`   • Category deletes: ${estCategoryDeletes} old categories will be removed`);
  console.log(`   • Category upserts: ${estCategoryUpserts} canonicals will be created/updated`);

  if (flags.dryRun) {
    console.log('\n▶  --dry-run: top 10 merges that would run:');
    plan
      .sort((a, b) => b.totalTools - a.totalTools)
      .slice(0, 10)
      .forEach((p, i) => {
        console.log(`   ${i + 1}. ${p.canonical}  (absorbs ${p.toMove.length} categories, ~${p.totalTools} tools)`);
      });
    console.log('\n   No DB writes performed.');
    await mongoose.disconnect();
    return;
  }

  // ----- Transactional execution -----
  console.log('▶  Starting MongoDB transaction…');
  const session = await mongoose.startSession();
  try {
    await session.withTransaction(async () => {
      for (const p of plan) {
        if (p.toMove.length > 0) {
          // Re-tag tools
          await Tool.updateMany(
            { category: { $in: p.toMove } },
            { $set: { category: p.canonical } },
            { session }
          );
          // Delete the displaced Category docs
          await Category.deleteMany(
            { name: { $in: p.toMove } },
            { session }
          );
        }
        // Upsert canonical Category — toolCount refreshed below
        await Category.updateOne(
          { slug: p.canonicalSlug },
          {
            $set: {
              name: p.canonical,
              slug: p.canonicalSlug,
              isActive: true,
            },
            $setOnInsert: {
              isDefault: false,
              toolCount: 0,
            },
          },
          { upsert: true, session }
        );
        // If a Category doc with the canonical name (but different slug) existed,
        // remove that legacy duplicate so we don't end up with two docs.
        await Category.deleteMany(
          { name: p.canonical, slug: { $ne: p.canonicalSlug } },
          { session }
        );
      }
    });
    console.log('   Transaction committed.');
  } catch (err) {
    console.error('❌ Transaction failed — rolling back.');
    throw err;
  } finally {
    await session.endSession();
  }

  // ----- Recompute toolCount for every category from live Tool data -----
  console.log('▶  Recomputing toolCount for all categories…');
  const liveCounts = await Tool.aggregate<{ _id: string; count: number }>([
    { $match: { status: { $in: ['published', 'approved'] } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);

  // Build category ops in chunks
  const countOps = liveCounts.map((row) => ({
    updateOne: {
      filter: { name: row._id },
      update: { $set: { toolCount: row.count } },
      upsert: false,
    },
  }));
  if (countOps.length > 0) {
    await Category.bulkWrite(countOps);
  }
  // Categories with zero tools: explicitly set to 0
  const activeNames = new Set(liveCounts.map((r) => r._id));
  await Category.updateMany(
    { name: { $nin: Array.from(activeNames) } },
    { $set: { toolCount: 0 } }
  );

  // ----- After snapshot -----
  const afterCategoryCount = await Category.countDocuments();
  const afterToolCount = await Tool.countDocuments();
  const orphanTools = await Tool.countDocuments({
    $or: [{ category: { $exists: false } }, { category: '' }, { category: null }],
  });

  console.log('\n✅ Done.\n');
  console.log('SUMMARY');
  console.log('───────────────────────────────────────────────');
  console.log(`  Categories  before:  ${beforeCategoryCount}`);
  console.log(`  Categories  after:   ${afterCategoryCount}`);
  console.log(`  Tools       before:  ${beforeToolCount}`);
  console.log(`  Tools       after:   ${afterToolCount}`);
  console.log(`  Orphan tools (no category): ${orphanTools}`);
  console.log('───────────────────────────────────────────────');

  // Top 15 final categories
  const top = await Category.find().sort({ toolCount: -1 }).limit(15).select('name toolCount').lean();
  console.log('\n  Top 15 categories by toolCount:');
  top.forEach((c, i) => {
    console.log(`    ${(i + 1).toString().padStart(2)}. ${c.toolCount?.toString().padStart(4)}  ${c.name}`);
  });

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('❌ Apply-merges failed:', err);
  process.exit(1);
});
