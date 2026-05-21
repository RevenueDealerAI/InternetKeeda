/**
 * One-shot migration: flag the existing ~5,000 tools as
 * `seededTool: true` + `listingStatus: 'free-seeded'`.
 *
 * These were imported from the original CodeCanyon JSON dump and are
 * grandfathered free forever. After this script runs, only NEW tools
 * (user submissions through the paid flow) will default to
 * `listingStatus: 'unpaid-pending'`.
 *
 * Usage:
 *   tsx scripts/migrations/2025-mark-seeded.ts          # apply
 *   tsx scripts/migrations/2025-mark-seeded.ts --dry    # report only
 *
 * Idempotent: re-running is safe — it only touches tools that aren't
 * already in a terminal listingStatus.
 */

import { config as loadEnv } from 'dotenv';
import mongoose from 'mongoose';

loadEnv({ path: '.env.local' });
loadEnv();

import { Tool } from '../../src/app/api/models/Tool';

const DRY = process.argv.includes('--dry');

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI missing — set it in .env.local first.');
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`Connected to ${uri.replace(/\/\/[^@]+@/, '//***@')}`);

  // Target: every tool that hasn't been touched by the new payment flow.
  // We identify these as anything without `listingStatus` set, or anything
  // already marked free-seeded (idempotent retouch).
  const filter = {
    $or: [
      { listingStatus: { $exists: false } },
      { listingStatus: 'free-seeded' },
      { seededTool: { $exists: false } },
    ],
  };

  const candidates = await Tool.countDocuments(filter);
  console.log(`Candidates to mark seeded: ${candidates}`);

  if (DRY) {
    console.log('--dry: not writing.');
    await mongoose.disconnect();
    return;
  }

  const res = await Tool.updateMany(filter, {
    $set: {
      seededTool: true,
      listingStatus: 'free-seeded',
    },
  });
  console.log(`Updated ${res.modifiedCount} tools.`);

  // Verify counts after.
  const total = await Tool.countDocuments({});
  const seeded = await Tool.countDocuments({ seededTool: true });
  const unpaidPending = await Tool.countDocuments({ listingStatus: 'unpaid-pending' });
  console.log(
    `Post-migration: total=${total}  seeded=${seeded}  unpaid-pending=${unpaidPending}`,
  );

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
