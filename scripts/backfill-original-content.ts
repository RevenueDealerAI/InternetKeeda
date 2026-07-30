/**
 * Import validated reviews and flip originalContent → true so a tool
 * becomes eligible for indexing (isIndexable() requires it).
 *
 * This is the ONLY path that sets originalContent. It runs the SAME
 * hard validator as scripts/validate-review.ts FIRST and REFUSES any
 * tool whose review fails — no review, no index. The seeded catalogue's
 * scraped `description` / `description_ai` never qualify a tool; only a
 * passing content/reviews/<slug>.md does.
 *
 *   npx tsx scripts/backfill-original-content.ts           # all reviews
 *   npx tsx scripts/backfill-original-content.ts openart   # one slug
 *   npx tsx scripts/backfill-original-content.ts --dry      # validate only
 */
import { readdirSync, existsSync } from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import mongoose from 'mongoose';
import { readReview, validateReview } from './review-lib';

loadEnv({ path: '.env.local' });
loadEnv();

const REVIEWS_DIR = path.join(process.cwd(), 'content', 'reviews');

async function main() {
  const args = process.argv.slice(2);
  const dry = args.includes('--dry');
  const slugArg = args.find((a) => !a.startsWith('--'));

  if (!existsSync(REVIEWS_DIR)) {
    console.error(`No reviews directory at ${REVIEWS_DIR}`);
    process.exit(1);
  }

  const files = readdirSync(REVIEWS_DIR)
    .filter((f) => f.endsWith('.md'))
    .filter((f) => !slugArg || f === `${slugArg}.md`);

  await mongoose.connect(process.env.MONGODB_URI as string);
  const tools = mongoose.connection.db!.collection('tools');

  let passed = 0;
  let failed = 0;
  const passedSlugs: string[] = [];

  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    const parsed = readReview(path.join(REVIEWS_DIR, file));
    const tool = (await tools.findOne(
      { slug },
      { projection: { description: 1, description_ai: 1 } },
    )) as any;

    if (!tool) {
      failed++;
      console.log(`SKIP ${slug} — no matching Tool in DB`);
      continue;
    }

    const errors = validateReview({
      bodyMain: parsed.bodyMain,
      sources: parsed.frontmatter.sources,
      description: tool.description,
      description_ai: tool.description_ai,
    });

    if (errors.length) {
      failed++;
      console.log(`FAIL ${slug} — NOT indexed:`);
      for (const e of errors) console.log(`   - ${e}`);
      continue;
    }

    passed++;
    passedSlugs.push(slug);
    if (dry) {
      console.log(`PASS ${slug} (dry — not written)`);
      continue;
    }

    const fm = parsed.frontmatter;
    await tools.updateOne(
      { slug },
      {
        $set: {
          originalContent: true,
          review: {
            author: fm.author,
            reviewedAt: new Date(fm.reviewedAt),
            pricingCheckedAt: new Date(fm.pricingCheckedAt),
            ...((fm as any).pricingNote ? { pricingNote: (fm as any).pricingNote } : {}),
            sources: fm.sources,
            body: parsed.bodyMain,
          },
        },
      },
    );
    console.log(`OK   ${slug} — review imported, originalContent=true`);
  }

  console.log(`\n${passed} passed, ${failed} failed.`);
  if (passed) console.log(`Indexable slugs: ${passedSlugs.join(', ')}`);
  const totalTrue = await tools.countDocuments({ originalContent: true } as any);
  console.log(`Total originalContent === true in DB: ${totalTrue}`);

  await mongoose.disconnect();
  process.exit(failed > 0 && passed === 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
