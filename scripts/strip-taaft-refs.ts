/**
 * Strip competitor (taaft.com) referral params from outbound tool URLs.
 *
 * The seeded catalogue was scraped from taaft.com and every websiteUrl
 * kept taaft's tracking query — e.g.
 *   https://www.broadn.io/?ref=taaft&utm_source=taaft&utm_medium=referral
 * so every outbound click on OUR site was crediting a competitor's
 * referral codes. This clears the query string (keeps the bare URL).
 *
 * SAFETY: only touches URLs whose query string contains "taaft". Our own
 * affiliate links (src/lib/affiliate/links.ts — pxf.io, ?fpr=, ?ref=
 * Internetkeeda, etc.) never contain "taaft", so they are provably
 * untouched. Dry-run by default.
 *
 *   npx tsx scripts/strip-taaft-refs.ts           # preview, no writes
 *   npx tsx scripts/strip-taaft-refs.ts --apply    # perform the update
 */
import { config as loadEnv } from 'dotenv';
import mongoose from 'mongoose';

loadEnv({ path: '.env.local' });
loadEnv();

/** Remove the query string + fragment, keeping the bare URL. */
function stripQuery(url: string): string {
  return url.split('#')[0].split('?')[0];
}

async function main() {
  const apply = process.argv.includes('--apply');
  await mongoose.connect(process.env.MONGODB_URI as string);
  const tools = mongoose.connection.db!.collection('tools');

  // Only URLs whose *query* carries taaft tracking. The regex also
  // guards against the pathological case of "taaft" in a path (we only
  // strip when there's a '?...taaft').
  const cursor = tools.find(
    { websiteUrl: { $regex: '\\?[^#]*taaft', $options: 'i' } },
    { projection: { slug: 1, websiteUrl: 1 } },
  );

  const ops: { updateOne: { filter: any; update: any } }[] = [];
  const samples: string[] = [];
  let scanned = 0;

  for await (const t of cursor) {
    scanned++;
    const before = t.websiteUrl as string;
    const after = stripQuery(before);
    if (after && after !== before) {
      ops.push({ updateOne: { filter: { _id: t._id }, update: { $set: { websiteUrl: after } } } });
      if (samples.length < 5) samples.push(`  ${before}\n    → ${after}`);
    }
  }

  console.log(`\nMatched (query contains taaft): ${scanned}`);
  console.log(`Will rewrite: ${ops.length}`);
  console.log(`\nSamples:\n${samples.join('\n')}`);

  // Sanity: confirm no affiliate host slipped into the match set.
  const affiliateHit = await tools.countDocuments({
    websiteUrl: { $regex: 'pxf\\.io|fpr=|REFERRALCODE|ref=Internetkeeda|try\\.elevenlabs|callrail|phantombuster', $options: 'i' },
    $and: [{ websiteUrl: { $regex: 'taaft', $options: 'i' } }],
  } as any);
  console.log(`\nAffiliate URLs caught in the taaft filter (must be 0): ${affiliateHit}`);

  if (!apply) {
    console.log('\nDRY RUN — no writes. Re-run with --apply to perform the update.');
    await mongoose.disconnect();
    return;
  }

  if (ops.length === 0) {
    console.log('\nNothing to update.');
  } else {
    const res = await tools.bulkWrite(ops);
    console.log(`\nAPPLIED. Modified: ${res.modifiedCount}`);
    const remaining = await tools.countDocuments({
      websiteUrl: { $regex: 'taaft', $options: 'i' },
    } as any);
    console.log(`Tools still containing "taaft" anywhere in websiteUrl: ${remaining}`);
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
