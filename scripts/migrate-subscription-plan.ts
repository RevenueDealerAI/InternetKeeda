/**
 * Migrate legacy TEST subscriptions off the retired plan.
 *
 * Background: Cashfree PROD was set up with a new plan
 * (`monthly-listing-10`, $10/mo USD, $50 max). The pre-existing rows in
 * Mongo were created against the SANDBOX plan `monthly-listing-499`
 * (₹499/mo) — those rows have a Cashfree subscription_id that no
 * longer exists in PROD, so they will never reconcile, never renew,
 * and any self-heal poll will 404.
 *
 * This script:
 *   1. Counts Subscription docs with planId === 'monthly-listing-499'
 *   2. Prints them (id, userId, toolId, status, createdAt)
 *   3. Default action: DELETE (they're test garbage)
 *   4. Pass `--relabel` instead to set planId='monthly-listing-10'
 *      (does NOT touch Cashfree — only rewrites local rows). Useful
 *      ONLY if you also manually recreated the same subscription on
 *      the PROD plan in Cashfree, which we did NOT do.
 *
 * Usage:
 *   npx tsx scripts/migrate-subscription-plan.ts --dry-run   (default)
 *   npx tsx scripts/migrate-subscription-plan.ts --delete    (commit)
 *   npx tsx scripts/migrate-subscription-plan.ts --relabel   (commit, see above)
 *
 * Never auto-runs on import — the IIFE is gated by `import.meta.main`-
 * equivalent argv check. Safe to dry-run anywhere.
 */

import { config as loadEnv } from 'dotenv';
import mongoose from 'mongoose';

loadEnv({ path: '.env.local' });
loadEnv();

import { Subscription } from '../src/app/api/models/Subscription';

const OLD_PLAN_ID = 'monthly-listing-499';
const NEW_PLAN_ID = 'monthly-listing-10';

type Mode = 'dry-run' | 'delete' | 'relabel';

function parseMode(argv: string[]): Mode {
  if (argv.includes('--delete')) return 'delete';
  if (argv.includes('--relabel')) return 'relabel';
  return 'dry-run';
}

async function main() {
  const mode = parseMode(process.argv.slice(2));
  console.log(`\nmigrate-subscription-plan — mode: ${mode}\n`);

  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI not set in env. Aborting.');
    process.exit(1);
  }

  await mongoose.connect(process.env.MONGODB_URI);

  const count = await Subscription.countDocuments({ planId: OLD_PLAN_ID });
  console.log(`Found ${count} subscription doc(s) with planId = "${OLD_PLAN_ID}".\n`);

  if (count === 0) {
    console.log('Nothing to migrate. Bye.');
    await mongoose.disconnect();
    return;
  }

  const rows = await Subscription.find({ planId: OLD_PLAN_ID })
    .select('_id subscriptionId userId toolId status amount currency createdAt')
    .sort({ createdAt: -1 })
    .lean();

  for (const r of rows) {
    console.log(
      `  ${String(r._id).padEnd(26)} ${(r.subscriptionId || '').padEnd(36)} ` +
        `${r.status.padEnd(12)} ${r.currency} ${r.amount} ${new Date(r.createdAt).toISOString()}`,
    );
  }
  console.log('');

  if (mode === 'dry-run') {
    console.log(
      'Dry-run — no changes applied. Re-run with --delete (default) or --relabel.',
    );
    await mongoose.disconnect();
    return;
  }

  if (mode === 'delete') {
    const result = await Subscription.deleteMany({ planId: OLD_PLAN_ID });
    console.log(`Deleted ${result.deletedCount} row(s).`);
  } else if (mode === 'relabel') {
    console.warn(
      'WARNING: --relabel only rewrites the local planId. The Cashfree ' +
        'subscription_id on these rows still points at the deleted SANDBOX ' +
        'plan, so they will not reconcile. Use this only if you have ' +
        'manually recreated each subscription on the PROD plan in Cashfree.',
    );
    const result = await Subscription.updateMany(
      { planId: OLD_PLAN_ID },
      { $set: { planId: NEW_PLAN_ID } },
    );
    console.log(`Relabeled ${result.modifiedCount} row(s).`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error('migrate-subscription-plan failed:', err);
  process.exit(1);
});
