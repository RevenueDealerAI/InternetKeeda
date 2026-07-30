/**
 * Import content/categories/*.md intros into Category.description so
 * qualifying category hubs clear the indexableCategories() gate (>=40
 * word intro AND >=10 tools). Matches a Category by name first, then by
 * slug. Reports what matched and each intro's word count.
 *
 *   npx tsx scripts/import-category-intros.ts          # apply
 *   npx tsx scripts/import-category-intros.ts --dry     # report only
 */
import { readdirSync, readFileSync } from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import mongoose from 'mongoose';

loadEnv({ path: '.env.local' });
loadEnv();

const DIR = path.join(process.cwd(), 'content', 'categories');
const wc = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;

function parse(raw: string): { name?: string; slug?: string; body: string } {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!m) return { body: raw.trim() };
  const fm: any = {};
  for (const line of m[1].split(/\r?\n/)) {
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (kv) fm[kv[1]] = kv[2].trim();
  }
  return { name: fm.name, slug: fm.slug, body: m[2].trim() };
}

async function main() {
  const dry = process.argv.includes('--dry');
  const files = readdirSync(DIR).filter((f) => f.endsWith('.md'));

  await mongoose.connect(process.env.MONGODB_URI as string);
  const cats = mongoose.connection.db!.collection('categories');

  let updated = 0;
  let missing = 0;
  for (const file of files) {
    const { name, slug, body } = parse(readFileSync(path.join(DIR, file), 'utf8'));
    const words = wc(body);
    if (words < 40) {
      console.log(`SKIP ${file} — intro is ${words} words (<40)`);
      continue;
    }
    const query = { $or: [{ name }, { slug }].filter((o) => Object.values(o)[0]) };
    const cat = await cats.findOne(query as any);
    if (!cat) {
      missing++;
      console.log(`MISS ${name || slug} — no Category doc (name/slug not found)`);
      continue;
    }
    if (dry) {
      console.log(`DRY  ${cat.name} (${cat.slug}) ← ${words}-word intro`);
      continue;
    }
    await cats.updateOne({ _id: cat._id }, { $set: { description: body } });
    updated++;
    console.log(`OK   ${cat.name} (${cat.slug}) ← ${words}-word intro`);
  }

  console.log(`\n${updated} updated, ${missing} missing.`);
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
