/**
 * Seeds ONE published Keeda Labs product so the storefront, detail
 * page, homepage section, and download gating can be verified locally
 * without going through the Vercel Blob upload UI.
 *
 * The filePath uses a placeholder URL; the entitlement gating is
 * unaffected (the download route 403s the non-buyer before fetching).
 *
 *   npx tsx scripts/seed-store-sample.ts
 */
import { config as loadEnv } from 'dotenv';
import mongoose from 'mongoose';

loadEnv({ path: '.env.local' });
loadEnv();

import { StoreProduct } from '../src/features/store/models/StoreProduct';

const SAMPLE = {
  slug: 'n8n-stripe-invoice-to-sheets',
  title: 'Stripe Invoices → Google Sheets (n8n)',
  description:
    'Ship the boring half of accounting in 20 minutes. This n8n workflow watches Stripe for new paid invoices, normalises the line items, computes net + tax, and writes a clean row into a Google Sheets log — including invoice URL, customer email, currency, and ISO date. Built for solo founders and small finance ops teams that have outgrown manual CSVs but cannot justify a real billing platform yet.',
  shortDescription:
    'Watches Stripe for paid invoices, normalises the data, and writes one row per invoice to Google Sheets. Solo-founder accounting in 20 minutes.',
  category: 'n8n-workflow' as const,
  tags: ['stripe', 'google-sheets', 'finance', 'invoicing', 'n8n', 'automation'],
  includes: [
    'Importable n8n workflow JSON',
    'Step-by-step setup README (Stripe webhook + Google Sheets auth)',
    'Sample Google Sheet template with column formulas',
    'Lifetime updates — re-download anytime we ship a new revision',
  ],
  coverImageUrl: '',
  previewImages: [],
  // Placeholder — real products would carry a Vercel Blob URL from
  // /api/store/admin/upload. The download API will 502 if a buyer
  // tries to fetch this; entitlement gating (which is what we
  // exercise here) runs BEFORE that fetch.
  filePath: 'https://example.com/seeded-placeholder.json',
  fileName: 'stripe-invoices-to-sheets.json',
  fileSizeBytes: 12450,
  priceUsdMinor: 1900, // $19.00
  priceInrMinor: 149900, // ₹1499
  status: 'published' as const,
  salesCount: 14,
  createdBy: 'seed',
};

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  await mongoose.connect(uri);
  const res = await StoreProduct.updateOne(
    { slug: SAMPLE.slug },
    { $set: SAMPLE, $setOnInsert: { createdAt: new Date() } },
    { upsert: true }
  );
  console.log(
    `${res.upsertedCount ? 'inserted' : 'updated'}  ${SAMPLE.slug}`
  );
  await mongoose.disconnect();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
