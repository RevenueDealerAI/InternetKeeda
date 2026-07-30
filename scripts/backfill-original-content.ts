/**
 * Mark tools as carrying ORIGINAL, hand-written editorial copy so they
 * become eligible for indexing (isIndexable() requires originalContent
 * === true). This is deliberately MANUAL: the seeded catalogue is
 * scraped from taaft.com + AI-paraphrased, so NOTHING is flagged
 * automatically. Flip a tool to true only after a human has written a
 * genuine, unique 120+ word writeup for it.
 *
 * Usage:
 *   # report current state, change nothing
 *   npx tsx scripts/backfill-original-content.ts
 *
 *   # flag specific slugs as original (comma-separated)
 *   npx tsx scripts/backfill-original-content.ts --slugs chatgpt,midjourney
 *
 *   # flag every slug listed in a file (one per line)
 *   npx tsx scripts/backfill-original-content.ts --file original-slugs.txt
 *
 *   # unset (demote back to non-original)
 *   npx tsx scripts/backfill-original-content.ts --slugs foo --value false
 */
import { readFileSync } from 'node:fs';
import { config as loadEnv } from 'dotenv';
import mongoose from 'mongoose';

loadEnv({ path: '.env.local' });
loadEnv();

function arg(name: string): string | undefined {
  const i = process.argv.indexOf(name);
  return i >= 0 ? process.argv[i + 1] : undefined;
}

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const tools = mongoose.connection.db!.collection('tools');

  const value = (arg('--value') || 'true') !== 'false';
  const slugsArg = arg('--slugs');
  const fileArg = arg('--file');

  let slugs: string[] = [];
  if (slugsArg) slugs = slugsArg.split(',').map((s) => s.trim()).filter(Boolean);
  if (fileArg) {
    slugs = slugs.concat(
      readFileSync(fileArg, 'utf8')
        .split(/\r?\n/)
        .map((s) => s.trim())
        .filter(Boolean),
    );
  }

  const currentTrue = await tools.countDocuments({ originalContent: true } as any);
  console.log(`\nCurrently originalContent === true: ${currentTrue}`);

  if (slugs.length === 0) {
    console.log('\nNo --slugs / --file given → report only, nothing changed.');
    console.log('Flip tools to indexable by passing slugs once original copy is written.');
    await mongoose.disconnect();
    return;
  }

  const res = await tools.updateMany(
    { slug: { $in: slugs } } as any,
    { $set: { originalContent: value } },
  );
  console.log(`\nRequested ${slugs.length} slug(s) → ${value ? 'true' : 'false'}`);
  console.log(`Matched: ${res.matchedCount}, modified: ${res.modifiedCount}`);
  const after = await tools.countDocuments({ originalContent: true } as any);
  console.log(`Now originalContent === true: ${after}`);

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
