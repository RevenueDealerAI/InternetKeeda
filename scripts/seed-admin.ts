/**
 * Flip `isAdmin: true` on a user record by email. Idempotent — re-
 * running on an already-admin user is a no-op.
 *
 * Usage:
 *   ADMIN_EMAIL=ai@revenuedealer.com npx tsx scripts/seed-admin.ts
 *
 * Or pass the email as an argument:
 *   npx tsx scripts/seed-admin.ts ai@revenuedealer.com
 *
 * Requires:
 *   - MONGODB_URI in .env.local
 *   - The user must have signed in at least once so a Mongo User row
 *     exists (the Clerk webhook creates it on first sign-in).
 */

import { config as loadEnv } from "dotenv";
import mongoose from "mongoose";

loadEnv({ path: ".env.local" });
loadEnv();

import { User } from "../src/app/api/models/User";

async function main() {
  const email = process.env.ADMIN_EMAIL || process.argv[2];
  if (!email) {
    console.error(
      "Set ADMIN_EMAIL env var or pass the email as the first argument.",
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
      `No user with email ${email}. They must sign in at least once first ` +
        `so the Clerk webhook creates their User row.`,
    );
    await mongoose.disconnect();
    process.exit(2);
  }

  if (user.isAdmin) {
    console.log(`User ${email} already has isAdmin=true. Nothing to do.`);
  } else {
    user.isAdmin = true;
    await user.save();
    console.log(`Flipped isAdmin=true on ${email} (clerkId: ${user.clerkId}).`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
