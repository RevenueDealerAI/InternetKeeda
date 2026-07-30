/**
 * SEO indexing wave + quality gate — single source of truth.
 *
 * The site has ~5,000 seeded tool pages. Dumping all of them into the
 * sitemap at once produced the classic "Discovered – currently not
 * indexed" stall (5,703 URLs queued, ~1 indexed): Google won't spend
 * crawl budget on thousands of programmatic pages from a domain it
 * doesn't yet trust. The fix (see references/gsc-indexing skill, Part
 * F) is to launch in WAVES — concentrate the sitemap + the homepage's
 * internal links on a bounded set of the highest-quality pages, get
 * those indexed, then widen the wave.
 *
 * Two concepts:
 *   1. isIndexable(tool) — the QUALITY FLOOR. A page below it is emitted
 *      with robots:{index:false, follow:true} so it doesn't drag the
 *      whole domain's quality signal down or waste crawl budget. The
 *      seeded catalogue is scraped from taaft.com (`description`) + AI-
 *      paraphrased (`description_ai`) — duplicate/derivative content
 *      Google already has, which is the ROOT reason ~5,700 URLs sit in
 *      "Discovered – not indexed". A word threshold can't fix duplicate
 *      copy, so the gate requires TWO things: an explicit
 *      `originalContent` flag (hand-written editorial — see
 *      scripts/backfill-original-content.ts) AND a real body of
 *      MIN_BODY_WORDS. Until original copy is written this is 0 tools,
 *      and that is the correct, honest state — every seeded tool page
 *      goes noindex,follow and drops out of the sitemap.
 *   2. indexableWave() — the CROWD-CONTROL slice. The top WAVE_SIZE
 *      indexable tools by score, used for the sitemap and the homepage
 *      discover grid. Indexable tools OUTSIDE the wave stay index:true
 *      and remain discoverable through their category hub pages (which
 *      link every tool in the category, paginated) — they just aren't
 *      force-fed via the sitemap until the wave proves out.
 *
 * Raise WAVE_SIZE (and/or lower the floor) once GSC shows the current
 * wave getting indexed. All the knobs are here.
 */
import { connectDB } from '@/app/api/lib/db';
import { Tool } from '@/app/api/models/Tool';
import { Category } from '@/app/api/models/Category';
import { PUBLIC_TOOL_FILTER } from '@/lib/seo/visibilityFilter';
import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';

/** Canonical origin re-export so callers import one thing. */
export const SITE = SITE_ORIGIN;

/** How many top tools ride in the current indexing wave (sitemap +
 * homepage grid). Bounded so Google can actually keep pace. */
export const WAVE_SIZE = 300;

/** Tools per paginated listing page (category pages). Matches
 * CATEGORY_TOOLS_PER_PAGE — kept in sync intentionally. */
export const PER_PAGE = 24;

/** Quality-floor knobs. MIN_BODY_WORDS is a real editorial floor, NOT
 * fitted to the current (thin, scraped) catalogue — the point is to
 * exclude the thin corpus, not accommodate it. */
export const MIN_BODY_WORDS = 120;
export const MIN_FEATURES = 3;

/** Category gate: a category needs a real inventory AND its own written
 * intro to earn an indexable hub page — otherwise it's a doorway page. */
export const MIN_CATEGORY_TOOLS = 10;
export const MIN_CATEGORY_INTRO_WORDS = 40;

/**
 * Build an absolute canonical URL that is BYTE-IDENTICAL to the URL the
 * app actually serves:
 *   - root ("/" or "") → `${SITE}/` WITH the trailing slash, because
 *     Next serves the homepage at `https://host/` and its canonical tag
 *     resolves to the same. The sitemap must match or Google logs a
 *     "Duplicate, Google chose a different canonical" against the home
 *     page (this was the reported bug: sitemap listed `${SITE}` with no
 *     slash while the page canonical said `${SITE}/`).
 *   - every other path → no trailing slash (Next's trailingSlash:false).
 */
export function canonical(path: string = '/'): string {
  if (!path || path === '/') return `${SITE}/`;
  const withLead = path.startsWith('/') ? path : `/${path}`;
  const noTrailing = withLead.replace(/\/+$/, '');
  return `${SITE}${noTrailing}`;
}

/** Count words in the best-available text. */
export function wordCount(text?: string | null): number {
  if (!text) return 0;
  return text.trim().split(/\s+/).filter(Boolean).length;
}

/** The shape isIndexable() needs — a subset of ITool. */
export interface IndexableInput {
  description?: string;
  description_ai?: string;
  features?: string[];
  pricing?: { type?: string; startingPrice?: number };
  /** Explicit "hand-written editorial, safe to index" flag. */
  originalContent?: boolean;
}

/**
 * The quality floor. True ONLY for pages that deserve to be in Google's
 * index on their own merit:
 *   - originalContent === true — the copy is hand-written editorial, not
 *     scraped/paraphrased duplicate content. This is the decisive gate;
 *     with the seeded catalogue it is false everywhere.
 *   - a real body (>= MIN_BODY_WORDS) — a genuine writeup, not a blurb.
 *   - a real feature list and a stated pricing model.
 * Pure predicate — safe to call on a lean()'d Mongo doc on the tool
 * page itself.
 */
export function isIndexable(tool: IndexableInput): boolean {
  const text = tool.description_ai || tool.description || '';
  return (
    tool.originalContent === true &&
    wordCount(text) >= MIN_BODY_WORDS &&
    Array.isArray(tool.features) &&
    tool.features.length >= MIN_FEATURES &&
    !!tool.pricing?.type
  );
}

/**
 * Mongo `$match` mirroring isIndexable(), MINUS the word-count check
 * (which needs a computed field — added by the aggregation below). Kept
 * as an object so the aggregation and any find() share one definition.
 */
const INDEXABLE_MATCH = {
  ...PUBLIC_TOOL_FILTER,
  originalContent: true,
  'pricing.type': { $exists: true, $ne: null },
  $expr: { $gte: [{ $size: { $ifNull: ['$features', []] } }, MIN_FEATURES] },
} as const;

/**
 * Aggregation expression that word-counts (description_ai || description
 * || '') the same way wordCount() does — split on whitespace, drop
 * empties. Used to apply the MIN_WORDS floor server-side so the wave
 * fetch doesn't have to pull every tool into Node.
 */
const WORDS_EXPR = {
  $size: {
    $filter: {
      input: {
        $split: [
          {
            $trim: {
              input: {
                $replaceAll: {
                  input: {
                    $ifNull: ['$description_ai', { $ifNull: ['$description', ''] }],
                  },
                  find: '\n',
                  replacement: ' ',
                },
              },
            },
          },
          ' ',
        ],
      },
      cond: { $ne: ['$$this', ''] },
    },
  },
};

export interface WaveTool {
  slug: string;
  name: string;
  category: string;
  logo?: string;
  updatedAt?: Date;
  createdAt?: Date;
}

/**
 * The top `limit` indexable tools by score (rating → views → votes →
 * recency). This is the set that rides in the sitemap and the homepage
 * discover grid. Sorted deterministically so the sitemap and the grid
 * agree and the edge cache stays warm.
 */
export async function indexableWave(limit: number = WAVE_SIZE): Promise<WaveTool[]> {
  await connectDB();
  const rows = await Tool.aggregate([
    { $match: INDEXABLE_MATCH },
    { $addFields: { _words: WORDS_EXPR } },
    { $match: { _words: { $gte: MIN_BODY_WORDS } } },
    { $sort: { rating: -1, views: -1, votes: -1, createdAt: -1 } },
    { $limit: limit },
    {
      $project: {
        _id: 0,
        slug: 1,
        name: 1,
        category: 1,
        logo: 1,
        updatedAt: 1,
        createdAt: 1,
      },
    },
  ]);
  return rows as WaveTool[];
}

export interface WaveCategory {
  slug: string;
  name: string;
  count: number;
  updatedAt?: Date;
}

/**
 * Categories that earn an indexable hub page: enough real inventory
 * (>= minCount tools) AND their own written intro (>= minIntroWords).
 * 678 categories across ~5,000 tools averages 7.4 tools each with no
 * intros — those are doorway pages that dilute the domain, so they're
 * excluded here (noindex + out of the sitemap) while staying crawlable
 * via /categories so the tools inside them aren't orphaned.
 *
 * Tool.category historically stores EITHER the display name ("Image
 * Generation") OR the slug ("image-generation"), so we count both forms
 * and sum them per canonical Category row.
 */
export async function indexableCategories(
  minCount: number = MIN_CATEGORY_TOOLS,
  minIntroWords: number = MIN_CATEGORY_INTRO_WORDS,
): Promise<WaveCategory[]> {
  await connectDB();
  const [categories, counts] = await Promise.all([
    Category.find({ isActive: { $ne: false } })
      .select('slug name description updatedAt')
      .lean() as Promise<
      Array<{ slug: string; name: string; description?: string; updatedAt?: Date }>
    >,
    Tool.aggregate([
      { $match: PUBLIC_TOOL_FILTER },
      { $group: { _id: '$category', n: { $sum: 1 } } },
    ]) as Promise<Array<{ _id: string; n: number }>>,
  ]);

  const countBy = new Map<string, number>();
  for (const c of counts) {
    if (c._id) countBy.set(c._id, c.n);
  }

  const out: WaveCategory[] = [];
  for (const cat of categories) {
    if (!cat.slug) continue;
    const count = (countBy.get(cat.name) || 0) + (countBy.get(cat.slug) || 0);
    if (count >= minCount && wordCount(cat.description) >= minIntroWords) {
      out.push({ slug: cat.slug, name: cat.name, count, updatedAt: cat.updatedAt });
    }
  }
  // Biggest categories first — most valuable hubs lead in the sitemap
  // and the homepage grid.
  out.sort((a, b) => b.count - a.count || a.name.localeCompare(b.name));
  return out;
}
