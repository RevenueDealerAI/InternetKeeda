/**
 * Hard-fail validator for content/reviews/*.md. Exit code is non-zero if
 * ANY review fails, so it can gate a build/backfill.
 *
 *   npx tsx scripts/validate-review.ts            # validate all
 *   npx tsx scripts/validate-review.ts openart    # validate one slug
 *
 * Fails a review on: <120 body words, <3 sources, no numeric pricing,
 * any first-person phrase, any placeholder/TODO, or any 40+ char run
 * copied from the tool's DB description / description_ai.
 */
import { readdirSync } from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import mongoose from 'mongoose';
import { readReview, validateReview } from './review-lib';

loadEnv({ path: '.env.local' });
loadEnv();

const REVIEWS_DIR = path.join(process.cwd(), 'content', 'reviews');

export async function run(slugArg?: string): Promise<boolean> {
  const files = readdirSync(REVIEWS_DIR)
    .filter((f) => f.endsWith('.md'))
    .filter((f) => !slugArg || f === `${slugArg}.md`);

  if (files.length === 0) {
    console.error(`No review files found${slugArg ? ` for "${slugArg}"` : ''}.`);
    return false;
  }

  await mongoose.connect(process.env.MONGODB_URI as string);
  const tools = mongoose.connection.db!.collection('tools');

  let allPass = true;
  for (const file of files) {
    const slug = file.replace(/\.md$/, '');
    const parsed = readReview(path.join(REVIEWS_DIR, file));
    // Read the OFF-LIMITS scraped fields ONLY to prove non-plagiarism.
    const tool = (await tools.findOne(
      { slug },
      { projection: { description: 1, description_ai: 1 } },
    )) as any;
    const errors = validateReview({
      bodyMain: parsed.bodyMain,
      sources: parsed.frontmatter.sources,
      description: tool?.description,
      description_ai: tool?.description_ai,
    });
    if (errors.length) {
      allPass = false;
      console.log(`FAIL ${slug}`);
      for (const e of errors) console.log(`   - ${e}`);
    } else {
      const w = parsed.bodyMain.trim().split(/\s+/).filter(Boolean).length;
      console.log(`PASS ${slug} (${w} words, ${parsed.frontmatter.sources.length} sources)`);
    }
  }

  await mongoose.disconnect();
  return allPass;
}

// Run when invoked directly.
run(process.argv[2])
  .then((ok) => {
    console.log(ok ? '\nAll reviews passed.' : '\nSome reviews FAILED.');
    process.exit(ok ? 0 : 1);
  })
  .catch((e) => {
    console.error(e);
    process.exit(1);
  });
