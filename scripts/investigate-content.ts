/**
 * READ-ONLY investigation for the SEO content audit.
 *   npx tsx scripts/investigate-content.ts
 */
import { config as loadEnv } from 'dotenv';
import mongoose from 'mongoose';

loadEnv({ path: '.env.local' });
loadEnv();

const PUBLIC = {
  status: { $in: ['published', 'approved'] },
  deletedAt: null,
  listingStatus: { $nin: ['unpaid-pending', 'unpaid-hidden'] },
};

const wc = (s?: string | null) => (s ? s.trim().split(/\s+/).filter(Boolean).length : 0);

async function main() {
  await mongoose.connect(process.env.MONGODB_URI as string);
  const db = mongoose.connection.db!;
  const tools = db.collection('tools');
  const cats = db.collection('categories');

  const totalPublic = await tools.countDocuments(PUBLIC as any);

  // ---- TOOL BODY WORD FLOOR ----
  const rows = await tools
    .aggregate([
      { $match: PUBLIC },
      {
        $project: {
          name: 1,
          websiteUrl: 1,
          hasAi: { $cond: [{ $ifNull: ['$description_ai', false] }, 1, 0] },
          d: { $ifNull: ['$description_ai', { $ifNull: ['$description', ''] }] },
          origFlag: { $ifNull: ['$originalContent', null] },
        },
      },
    ])
    .toArray();

  const words = rows.map((r) => wc(r.d));
  const maxWords = Math.max(...words);
  const clear = (n: number) => words.filter((w) => w >= n).length;
  const withAi = rows.filter((r) => r.hasAi).length;
  const withOrigTrue = rows.filter((r) => r.origFlag === true).length;
  const origFieldExists = rows.filter((r) => r.origFlag !== null).length;

  console.log(`\n=== TOOLS (public: ${totalPublic}) ===`);
  console.log(`max body words (description_ai||description): ${maxWords}`);
  for (const n of [40, 60, 80, 100, 120, 150]) {
    console.log(`  >= ${n} words: ${clear(n)} (${((clear(n) / totalPublic) * 100).toFixed(1)}%)`);
  }
  console.log(`tools with description_ai set: ${withAi} (${((withAi / totalPublic) * 100).toFixed(1)}%)`);
  console.log(`tools with originalContent field present: ${origFieldExists}`);
  console.log(`tools with originalContent === true: ${withOrigTrue}`);

  // ---- 10 RANDOM SAMPLES (desc vs desc_ai) ----
  const samples = await tools
    .aggregate([{ $match: PUBLIC }, { $sample: { size: 10 } }])
    .toArray();
  console.log(`\n=== 10 RANDOM SAMPLES (name | url | desc words / ai words) ===`);
  for (const s of samples) {
    const desc = (s.description || '').replace(/\s+/g, ' ').trim();
    const ai = (s.description_ai || '').replace(/\s+/g, ' ').trim();
    console.log(`\n• ${s.name}  <${s.websiteUrl}>`);
    console.log(`  desc(${wc(desc)}w): ${desc.slice(0, 200)}`);
    if (ai) console.log(`  ai  (${wc(ai)}w): ${ai.slice(0, 200)}`);
    else console.log(`  ai  : (none)`);
  }

  // ---- CATEGORIES ----
  const catDocs = await cats.find({ isActive: { $ne: false } }).toArray();
  const counts = await tools
    .aggregate([{ $match: PUBLIC }, { $group: { _id: '$category', n: { $sum: 1 } } }])
    .toArray();
  const countBy = new Map<string, number>();
  for (const c of counts) if (c._id) countBy.set(c._id, c.n);

  let cGte3 = 0, cGte10 = 0, cIntro40 = 0, cBoth = 0;
  for (const cat of catDocs) {
    const n = (countBy.get(cat.name) || 0) + (countBy.get(cat.slug) || 0);
    const introW = wc(cat.description);
    if (n >= 3) cGte3++;
    if (n >= 10) cGte10++;
    if (introW >= 40) cIntro40++;
    if (n >= 10 && introW >= 40) cBoth++;
  }
  console.log(`\n=== CATEGORIES (active: ${catDocs.length}) ===`);
  console.log(`  count >= 3:                 ${cGte3}`);
  console.log(`  count >= 10:                ${cGte10}`);
  console.log(`  intro >= 40 words:          ${cIntro40}`);
  console.log(`  count >= 10 AND intro>=40:  ${cBoth}   <-- survives new gate`);
  console.log(`  avg tools/category:         ${(totalPublic / catDocs.length).toFixed(1)}`);

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
