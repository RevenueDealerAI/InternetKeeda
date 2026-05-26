/**
 * Mirror Mongo `User.isAdmin` into Clerk `publicMetadata.isAdmin` for
 * every user with `isAdmin: true`. Idempotent. Run this once after
 * `scripts/grant-admin.ts` to make the client-side admin checks pick
 * up the change without an /api/users/me roundtrip, and any time the
 * Mongo source of truth changes.
 *
 * Usage:
 *   npx tsx scripts/sync-admin-to-clerk.ts
 *
 * Requires:
 *   - MONGODB_URI in .env.local
 *   - CLERK_SECRET_KEY in .env.local
 */
import { config as loadEnv } from "dotenv";
import mongoose from "mongoose";
import { createClerkClient } from "@clerk/backend";

loadEnv({ path: ".env.local" });
loadEnv();

import { User } from "../src/app/api/models/User";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI missing — set it in .env.local first.");
    process.exit(1);
  }

  const clerkSecret = process.env.CLERK_SECRET_KEY;
  if (!clerkSecret) {
    console.error("CLERK_SECRET_KEY missing — set it in .env.local first.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`Connected to ${uri.replace(/\/\/[^@]+@/, "//***@")}`);

  const clerk = createClerkClient({ secretKey: clerkSecret });

  const admins = await User.find({ isAdmin: true }).select("clerkId email").lean();
  console.log(`Found ${admins.length} admin(s) in Mongo.`);

  let ok = 0;
  let failed = 0;
  for (const u of admins) {
    if (!u.clerkId) {
      console.warn(`  skip: user with no clerkId (email=${u.email})`);
      continue;
    }
    try {
      const existing = await clerk.users.getUser(u.clerkId);
      const existingMeta = (existing.publicMetadata || {}) as Record<string, unknown>;
      await clerk.users.updateUserMetadata(u.clerkId, {
        publicMetadata: {
          ...existingMeta,
          isAdmin: true,
        },
      });
      console.log(`  ok:   ${u.email} (${u.clerkId})`);
      ok++;
    } catch (err) {
      console.error(`  fail: ${u.email} (${u.clerkId}) —`, err instanceof Error ? err.message : err);
      failed++;
    }
  }

  console.log(`\nDone. synced=${ok} failed=${failed}`);

  await mongoose.disconnect();
  process.exit(failed > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error("sync-admin-to-clerk failed:", err);
  process.exit(1);
});
