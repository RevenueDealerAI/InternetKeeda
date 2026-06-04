/**
 * Seed the 6 affiliate-partner tools so they show up in the public
 * catalog alongside the grandfathered 5000. Mirrors the same Tool
 * shape the original seed used (see scripts/seed-tools.ts), with
 * two intentional differences:
 *
 *   - `websiteUrl` is the partner's affiliate URL, not the bare
 *     domain. The Tool detail page only uses websiteUrl as an
 *     <a href> / window.open target — it is never displayed as
 *     visible text — so the click-through routes through our
 *     affiliate link without leaking the raw URL to the UI.
 *   - `seededTool: true` + `listingStatus: 'free-seeded'` keeps them
 *     publicly visible without a paid subscription, identical to the
 *     grandfathered batch.
 *
 * Idempotent: upserts by slug, so re-running this script just
 * refreshes the records. Affiliate URLs are checked into source so
 * the canonical list lives next to the code that consumes it.
 *
 * Usage:
 *   pnpm tsx scripts/seed-affiliate-tools.ts
 *   # or:
 *   npx tsx scripts/seed-affiliate-tools.ts
 */

import { config as loadEnv } from 'dotenv';
import mongoose from 'mongoose';

loadEnv({ path: '.env.local' });
loadEnv();

import { Tool } from '../src/app/api/models/Tool';

interface AffiliateTool {
  name: string;
  slug: string;
  /** Affiliate destination — goes into the Tool.websiteUrl field. */
  affiliateUrl: string;
  /** Tool's actual public domain, used only for the logo / favicon
   *  proxy. Never stored in Tool.websiteUrl. */
  realDomain: string;
  category: string;
  description: string;
  tags: string[];
  pricing: { type: 'free' | 'freemium' | 'paid' | 'enterprise'; startingPrice?: number };
  features: string[];
  rating: number;
  reviews: number;
  isTopRated?: boolean;
}

const TOOLS: AffiliateTool[] = [
  {
    name: 'OpenART',
    slug: 'openart',
    affiliateUrl: 'https://openartai.pxf.io/dynEzy',
    realDomain: 'openart.ai',
    category: 'Image Generation',
    description:
      'OpenART is a multi-model AI image platform — SDXL, FLUX, and community checkpoints behind one UI, plus character training (LoRA-style) and a ComfyUI-flavoured workflow editor. Pick the right model for the job instead of being stuck with one. Credit-based pricing keeps casual use cheap; serious volume scales predictably.',
    tags: ['image generation', 'sdxl', 'flux', 'character training', 'workflows', 'lora'],
    pricing: { type: 'freemium', startingPrice: 10 },
    features: [
      'Routes between SDXL, FLUX, and community checkpoints from one credit pool',
      'Character training (LoRA-style) for reusable subjects across panels',
      'ComfyUI-style workflow editor without the local install',
      'Large public gallery doubles as prompt + workflow library',
      'Free tier with daily credits — enough to seriously evaluate',
    ],
    rating: 4.2,
    reviews: 1,
  },
  {
    name: 'Jobscan',
    slug: 'jobscan',
    affiliateUrl: 'https://jobscanco.pxf.io/MA370n',
    realDomain: 'jobscan.co',
    category: 'Resume & Cover Letters',
    description:
      'Jobscan reads your resume against a specific job description and tells you which keywords, skills, and phrases the ATS will miss. Genuinely useful for corporate job hunts where Workday / Greenhouse / Lever filter you out before a human looks. Treat the match score as a floor check, not a goal.',
    tags: ['resume', 'ats', 'job search', 'linkedin', 'keyword optimization', 'cover letter'],
    pricing: { type: 'freemium', startingPrice: 50 },
    features: [
      'Match-rate score against any pasted job description',
      'Surfaces missing hard skills, soft skills, and exact-phrase keywords',
      'LinkedIn profile optimiser using the same diff engine',
      'Cover-letter scanner aligned to the JD',
      'Power Edit inline editor to iterate without context switching',
    ],
    rating: 3.9,
    reviews: 1,
  },
  {
    name: 'PhantomBuster',
    slug: 'phantombuster',
    affiliateUrl: 'https://phantombuster.com?deal=rajan65&fp_sid=internet',
    realDomain: 'phantombuster.com',
    category: 'No-Code & Automation',
    description:
      'PhantomBuster is the fastest way to wire up LinkedIn, Sales Navigator, or Twitter scraping and outreach without writing code. Hundreds of pre-built "Phantoms" plus a visual flow builder so non-engineers can ship multi-step prospecting in hours, not weeks. Be honest about LinkedIn TOS risk and use a secondary account.',
    tags: ['automation', 'linkedin', 'scraping', 'sales prospecting', 'no-code', 'lead generation'],
    pricing: { type: 'paid', startingPrice: 56 },
    features: [
      'Hundreds of pre-built Phantoms for LinkedIn, Sales Navigator, X, Instagram',
      'Visual flow builder chains scrape → enrich → outreach end-to-end',
      'Cloud-scheduled runs deliver fresh data without opening the dashboard',
      'CSV + webhook outputs integrate cleanly with Sheets, HubSpot, n8n, Make',
      'AI-enrichment Phantoms layer LLM summarisation on top of scraped data',
    ],
    rating: 4.0,
    reviews: 1,
  },
  {
    name: 'Apify',
    slug: 'apify',
    affiliateUrl: 'https://www.apify.com?fpr=llkl77',
    realDomain: 'apify.com',
    category: 'No-Code & Automation',
    description:
      'Apify is the AWS Lambda of web scraping — bring an Actor (your code, or one from the marketplace) and the platform handles proxies, scheduling, scale, and storage. Best web-scraping infrastructure for engineering teams that need real volume and reliable uptime. Budget needs monitoring; compute-second billing rewards careful Actor design.',
    tags: ['web scraping', 'automation', 'actors', 'proxies', 'developer tools', 'data extraction'],
    pricing: { type: 'freemium', startingPrice: 49 },
    features: [
      'Thousands of pre-built Actors for common scraping targets',
      'Bring-your-own-code Actors in Node or Python on the same platform',
      'Managed proxy network handles rotation, geos, and blocks',
      'Dataset storage with Sheets, BigQuery, S3, and webhook integrations',
      'Generous free tier and predictable per-compute-second billing',
    ],
    rating: 4.4,
    reviews: 1,
    isTopRated: true,
  },
  {
    name: 'Hostinger',
    slug: 'hostinger',
    affiliateUrl: 'https://www.hostinger.com/in?REFERRALCODE=CQASUPPORNPY',
    realDomain: 'hostinger.com',
    category: 'Website Builders',
    description:
      'Budget WordPress + website hosting with the cleanest control panel (hPanel) in the under-$10 tier. One-click WordPress, free SSL, free email, AI tools for first-site builders. Intro pricing is aggressive; renewal roughly doubles — lock the longest term you can stomach at signup and the math works for years.',
    tags: ['web hosting', 'wordpress', 'shared hosting', 'vps', 'ssl', 'budget hosting'],
    pricing: { type: 'paid', startingPrice: 3 },
    features: [
      'hPanel is the cleanest control panel in budget hosting by a clear margin',
      'One-click WordPress + LiteSpeed cache plugin auto-install',
      'Free SSL, free email, weekly backups, CDN included on entry tiers',
      'Built-in AI logo, content, and image tools for first-site builders',
      'Performance from LiteSpeed stack competes with hosts 3–5× the price',
    ],
    rating: 4.1,
    reviews: 1,
  },
  {
    name: 'MuleRun',
    slug: 'mulerun',
    affiliateUrl: 'https://mulerun.pxf.io/k4ZNdv',
    realDomain: 'mulerun.com',
    category: 'AI Agents',
    description:
      'MuleRun is a marketplace for AI agents — task-specific agents you can browse and run, instead of building your own. Friendlier per-task pricing than per-seat SaaS for occasional use. Early days, but the catalogue is filling out and onboarding is friction-free — a fair way to try agent workflows before committing to LangGraph or CrewAI.',
    tags: ['ai agents', 'marketplace', 'automation', 'no-code', 'task automation', 'agent workflows'],
    pricing: { type: 'freemium' },
    features: [
      'Browse and run task-specific AI agents without building from scratch',
      'Per-task pricing aligns cost with value, no per-seat subscription needed',
      'Friction-free onboarding — sign up, pick an agent, run it',
      'Catalogue spans research, content, automation, and lightweight ops',
      'Pay-as-you-go means experiments cost cents, not a monthly bill',
    ],
    rating: 3.8,
    reviews: 1,
  },
];

function normalize(t: AffiliateTool) {
  const now = new Date();
  return {
    name: t.name,
    slug: t.slug,
    description: t.description,
    description_ai: t.description,
    websiteUrl: t.affiliateUrl,
    category: t.category,
    tags: t.tags,
    pricing: t.pricing,
    features: t.features,
    // Use Google's favicon proxy directly (NOT a Clearbit URL).
    // getToolLogo() rewrites any logo.clearbit.com URL to a favicon
    // derived from `websiteUrl`'s domain — which for these tools is
    // the affiliate redirector (e.g. openartai.pxf.io) rather than
    // the real product domain (openart.ai). Storing the Google
    // favicon URL directly side-steps that rewrite so the logo
    // reflects the actual tool's brand.
    logo: `https://www.google.com/s2/favicons?domain=${t.realDomain}&sz=128`,
    status: 'published',
    isTrending: false,
    isNewTool: true,
    isUpcoming: false,
    isTopRated: !!t.isTopRated,
    views: 0,
    votes: 0,
    rating: t.rating,
    reviews: t.reviews,
    seededTool: true,
    listingStatus: 'free-seeded',
    activeBoosts: [],
    updatedAt: now,
  };
}

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('MONGODB_URI not set — add it to .env.local before running.');
    process.exit(1);
  }
  await mongoose.connect(uri);
  console.log(`Connected. Upserting ${TOOLS.length} affiliate tools…`);

  for (const t of TOOLS) {
    const doc = normalize(t);
    const res = await Tool.updateOne(
      { slug: t.slug },
      {
        $set: doc,
        $setOnInsert: { createdAt: new Date() },
      },
      { upsert: true }
    );
    const action = res.upsertedCount ? 'inserted' : 'updated';
    console.log(`  ${action.padEnd(8)} ${t.slug.padEnd(16)} → ${t.affiliateUrl}`);
  }

  await mongoose.disconnect();
  console.log('Done.');
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
