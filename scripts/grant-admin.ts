/**
 * Elevate an existing Mongo User row to admin by setting
 * `isAdmin: true`. Idempotent — re-running on a user who already
 * has the flag is a no-op.
 *
 * The fallback admin guard (src/app/api/lib/admin.ts) honours BOTH
 * Clerk `publicMetadata.role === 'admin'` AND `User.isAdmin === true`,
 * so flipping this DB flag is sufficient to unlock /admin and every
 * /api/admin/* route — no Clerk dashboard click required.
 *
 * Usage:
 *   npx tsx scripts/grant-admin.ts <email>
 *   npx tsx scripts/grant-admin.ts ai@revenuedealer.com
 *
 * Or via env var:
 *   ADMIN_EMAIL=ai@revenuedealer.com npx tsx scripts/grant-admin.ts
 *
 * Exit codes:
 *   0  success (or already-admin no-op)
 *   1  bad invocation / env missing
 *   2  user not found in Mongo (they must sign in at least once first
 *      so the Clerk webhook upserts their User row)
 *
 * Note: scripts/seed-admin.ts predates this and does the same thing
 * — kept around to not break any docs that reference it.
 */

import { config as loadEnv } from "dotenv";
import mongoose from "mongoose";

loadEnv({ path: ".env.local" });
loadEnv();

import { User } from "../src/app/api/models/User";

async function main() {
  const email = process.argv[2] || process.env.ADMIN_EMAIL;
  if (!email) {
    console.error(
      "Usage: npx tsx scripts/grant-admin.ts <email>\n" +
        "Or set ADMIN_EMAIL in env.",
    );
    process.exit(1);
  }

  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI missing — set it in .env.local first.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`Connected to ${uri.replace(/\/\/[^@]+@/, "//***@")}`);

  const user = await User.findOne({ email });
  if (!user) {
    console.error(
      `No user with email "${email}" in Mongo. They must sign in to ` +
        `the site at least once first — the Clerk webhook upserts the ` +
        `User row on first sign-in.`,
    );
    await mongoose.disconnect();
    process.exit(2);
  }

  console.log(
    `Found user: ${email} (clerkId: ${user.clerkId}, isAdmin BEFORE: ${user.isAdmin})`,
  );

  if (user.isAdmin) {
    console.log(`Already admin — nothing to do.`);
  } else {
    user.isAdmin = true;
    await user.save();
    console.log(`isAdmin AFTER: true. Saved.`);
  }

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("grant-admin failed:", err);
  process.exit(1);
});
