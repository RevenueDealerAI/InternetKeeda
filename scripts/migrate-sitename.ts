/**
 * One-off migration: the SiteConfig DB row was created with
 * `siteName: 'InternetKeeda'` (one word). Brand commit f5fbe17
 * canonicalised the user-facing form to "Internet Keeda" (two words)
 * via `BRAND.name`, but didn't migrate the DB row, so /api/config
 * (and everything reading useSiteConfig — including the <title>) still
 * returns the old single-word value.
 *
 * Found via Playwright smoke 2026-05-25: page title rendered as
 * "InternetKeeda — Discover the Best AI Tools".
 *
 * This script rewrites the affected fields to match BRAND.name, then
 * exits. Idempotent — re-running on an already-correct row is a no-op.
 *
 * Usage:
 *   npx tsx scripts/migrate-sitename.ts
 */
import { config as loadEnv } from "dotenv";
import mongoose from "mongoose";

loadEnv({ path: ".env.local" });
loadEnv();

import { SiteConfig } from "../src/app/api/models/SiteConfig";
import { BRAND } from "../src/lib/brand";

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI missing — set it in .env.local first.");
    process.exit(1);
  }

  await mongoose.connect(uri);
  console.log(`Connected to ${uri.replace(/\/\/[^@]+@/, "//***@")}`);

  const cfg = await SiteConfig.findOne();
  if (!cfg) {
    console.log("No SiteConfig row exists. Nothing to migrate.");
    await mongoose.disconnect();
    return;
  }

  const changes: string[] = [];

  if (cfg.siteName !== BRAND.name) {
    changes.push(`siteName: ${cfg.siteName} → ${BRAND.name}`);
    cfg.siteName = BRAND.name;
  }

  // footerText canonical form: "© <year> Internet Keeda. All rights reserved."
  if (cfg.footerText && /InternetKeeda/.test(cfg.footerText)) {
    const fixed = cfg.footerText.replace(/InternetKeeda/g, BRAND.name);
    changes.push(`footerText: …${cfg.footerText.slice(-40)} → …${fixed.slice(-40)}`);
    cfg.footerText = fixed;
  }

  if (cfg.metaTags) {
    const mt = cfg.metaTags as Record<string, string>;
    if (mt.title && /InternetKeeda/.test(mt.title)) {
      const fixed = mt.title.replace(/InternetKeeda/g, BRAND.name);
      changes.push(`metaTags.title: ${mt.title} → ${fixed}`);
      mt.title = fixed;
    }
    if (mt.description && /InternetKeeda/.test(mt.description)) {
      const fixed = mt.description.replace(/InternetKeeda/g, BRAND.name);
      changes.push(`metaTags.description: …`);
      mt.description = fixed;
    }
  }

  if (changes.length === 0) {
    console.log("Already canonical. Nothing to migrate.");
  } else {
    await cfg.save();
    console.log(`Applied ${changes.length} change(s):`);
    for (const c of changes) console.log(`  - ${c}`);
  }

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
