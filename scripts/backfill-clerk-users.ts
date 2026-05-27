/**
 * Backfill Mongo User docs from Clerk.
 *
 * Background: the Clerk prod webhook was never wired after the
 * dev→prod migration, so every signup between then and now never
 * landed a Mongo User row. The webhook handler at
 * src/app/api/webhooks/clerk/route.ts is the canonical creation
 * path on user.created. This script mirrors that exact upsert
 * (same fields, same defaults, same `isAdmin: adminByDomain` rule)
 * for every Clerk user that doesn't yet have a Mongo doc.
 *
 * Idempotent — re-running on already-synced users is a no-op.
 *
 * Usage:
 *   npx tsx scripts/backfill-clerk-users.ts
 *
 * Requires:
 *   - MONGODB_URI in .env.local
 *   - CLERK_SECRET_KEY in .env.local
 *
 * Safety: never touches existing Mongo rows. The user-facing
 * caveat from the prompt (ai@revenuedealer.com has isAdmin: true
 * manually set) is honored because the script only INSERTS — it
 * doesn't update existing docs.
 */
import { config as loadEnv } from "dotenv";
import mongoose from "mongoose";
import { createClerkClient } from "@clerk/backend";

loadEnv({ path: ".env.local" });
loadEnv();

import { User } from "../src/app/api/models/User";

// Mirror the webhook handler verbatim. Update both places if the
// rule changes.
const ADMIN_EMAIL_DOMAINS = ["internetkeeda.com"];

function isAdminByEmail(
  emails: Array<{ emailAddress?: string | null }> | undefined,
): boolean {
  if (!emails) return false;
  return emails.some((e) =>
    ADMIN_EMAIL_DOMAINS.some((d) =>
      (e.emailAddress ?? "").toLowerCase().endsWith(`@${d}`),
    ),
  );
}

interface BackfillSummary {
  totalInClerk: number;
  alreadySynced: number;
  newlyCreated: number;
  skipped: number;
  failed: number;
}

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

  const summary: BackfillSummary = {
    totalInClerk: 0,
    alreadySynced: 0,
    newlyCreated: 0,
    skipped: 0,
    failed: 0,
  };

  // Paginate through every Clerk user. The Backend SDK caps each
  // page at 500; getCount() returns the total so we can iterate
  // without overshooting.
  const pageSize = 500;
  let offset = 0;
  let totalCount: number | null = null;

  while (true) {
    const resp = await clerk.users.getUserList({
      limit: pageSize,
      offset,
      orderBy: "+created_at",
    });
    const page = resp.data ?? [];
    if (totalCount === null) {
      totalCount = resp.totalCount ?? page.length;
      summary.totalInClerk = totalCount;
      console.log(`Found ${totalCount} user(s) in Clerk.`);
    }
    if (page.length === 0) break;

    for (const u of page) {
      const clerkId = u.id;
      const primaryEmail =
        u.emailAddresses?.[0]?.emailAddress?.trim() ?? "";
      const adminByDomain = isAdminByEmail(u.emailAddresses);

      try {
        const existing = await User.findOne({ clerkId }).select("_id").lean();
        if (existing) {
          summary.alreadySynced++;
          console.log(`  skip:    ${primaryEmail || clerkId} (already synced)`);
          continue;
        }

        if (!clerkId) {
          summary.skipped++;
          console.warn(`  skip:    (no clerkId) ${primaryEmail}`);
          continue;
        }

        // Same upsert shape as src/app/api/webhooks/clerk/route.ts
        // case 'user.created' — $set on every run, $setOnInsert only
        // when the doc is brand new. We're guaranteed new here
        // because the findOne above returned null.
        await User.findOneAndUpdate(
          { clerkId },
          {
            $set: {
              clerkId,
              email: primaryEmail,
              firstName: u.firstName ?? "",
              lastName: u.lastName ?? "",
              username: u.username ?? "",
              profileImageUrl: u.imageUrl ?? "",
              publicMetadata:
                (u.publicMetadata as Record<string, unknown>) ?? {},
            },
            $setOnInsert: {
              isAdmin: adminByDomain,
              createdAt: new Date(),
            },
          },
          { upsert: true, new: true, setDefaultsOnInsert: true },
        );

        summary.newlyCreated++;
        console.log(
          `  created: ${primaryEmail || clerkId}${adminByDomain ? "  [admin]" : ""}`,
        );
      } catch (err) {
        summary.failed++;
        console.error(
          `  fail:    ${primaryEmail || clerkId} —`,
          err instanceof Error ? err.message : err,
        );
      }
    }

    offset += page.length;
    if (offset >= (totalCount ?? 0)) break;
  }

  console.log("\n" + "═".repeat(58));
  console.log(`  totalInClerk:  ${summary.totalInClerk}`);
  console.log(`  alreadySynced: ${summary.alreadySynced}`);
  console.log(`  newlyCreated:  ${summary.newlyCreated}`);
  if (summary.skipped > 0) console.log(`  skipped:       ${summary.skipped}`);
  if (summary.failed > 0) console.log(`  failed:        ${summary.failed}`);
  console.log("═".repeat(58));

  await mongoose.disconnect();
  process.exit(0);
}

main().catch((err) => {
  console.error("backfill-clerk-users failed:", err);
  process.exit(1);
});
