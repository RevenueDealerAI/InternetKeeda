/**
 * Canonical serializer that turns a Mongoose Tool doc into the JSON
 * shape every client surface expects.
 *
 * History: this used to live as five near-identical inline functions
 * across `tools/route.ts`, `tools/[id]/route.ts`, and three places in
 * `tools/ai-search/route.ts`. Keeping them in sync (e.g. surfacing
 * `description_ai` to the UI) took three commits because nobody
 * remembered all five exist. Now there is one.
 *
 * Fallback policy: this helper does NOT synthesize logo URLs or
 * derive `isTrending` from view counts. Those are display concerns —
 * the frontend `getToolLogo()` helper handles logo fallback, and the
 * `isTrending` flag is editorial (set by admins / scripts).
 */

export interface FormattableTool {
  _id: { toString(): string };
  name: string;
  slug?: string;
  description: string;
  description_ai?: string;
  websiteUrl: string;
  category: string;
  tags: string[];
  pricing?: { type?: string; startingPrice?: number };
  features: string[];
  status: string;
  isTrending?: boolean;
  isNewTool?: boolean;
  isUpcoming?: boolean;
  isTopRated?: boolean;
  views?: number;
  votes?: number;
  rating?: number;
  reviews?: number;
  createdAt?: Date | string;
  updatedAt?: Date | string;
  logo?: string;
  activeBoosts?: Array<'category-top' | 'home-rotation' | 'featured-badge'>;
  listingStatus?: string;
  seededTool?: boolean;
  deletedAt?: Date | string | null;
}

function safeHostname(url: string | undefined): string {
  if (!url) return '';
  try {
    return new URL(url).hostname;
  } catch {
    return '';
  }
}

export function formatTool(tool: FormattableTool) {
  return {
    _id: tool._id.toString(),
    id: tool._id.toString(),
    name: tool.name,
    slug: tool.slug,
    description: tool.description,
    description_ai: tool.description_ai,
    websiteUrl: tool.websiteUrl,
    url: tool.websiteUrl,
    website: safeHostname(tool.websiteUrl),
    category: tool.category,
    tags: tool.tags,
    pricing: {
      type: tool.pricing?.type || 'free',
      startingPrice: tool.pricing?.startingPrice || undefined,
    },
    features: tool.features,
    status: tool.status,
    isTrending: tool.isTrending || false,
    isNew: tool.isNewTool || false,
    isUpcoming: tool.isUpcoming || false,
    isTopRated: tool.isTopRated || false,
    views: tool.views || 0,
    votes: tool.votes || 0,
    rating: tool.rating || 0,
    reviews: tool.reviews || 0,
    createdAt: tool.createdAt,
    updatedAt: tool.updatedAt,
    logo: tool.logo,
    activeBoosts: tool.activeBoosts || [],
    listingStatus: tool.listingStatus,
    seededTool: tool.seededTool || false,
    deletedAt: tool.deletedAt || null,
  };
}
