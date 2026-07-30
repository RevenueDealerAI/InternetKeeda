import mongoose, { Document, Model } from 'mongoose';

export type ToolListingStatus =
  | 'free-seeded'      // grandfathered original 5000 — always visible, never billed
  | 'paid-active'      // subscription active — visible
  | 'paid-expired'     // subscription lapsed but tool still owned — hidden, can re-activate
  | 'unpaid-pending'   // newly submitted, awaiting first payment
  | 'unpaid-hidden';   // hidden after 3 failed renewals or admin action

export type BoostSlot = 'category-top' | 'home-rotation' | 'featured-badge';

export interface ITool {
  name: string;
  slug: string;
  description: string;
  /** AI-rewritten original description, displayed in preference to
   * `description` (which is the seller's scraped fallback). */
  description_ai?: string;
  websiteUrl: string;
  category: string;
  tags: string[];
  pricing: {
    type: 'free' | 'freemium' | 'paid' | 'enterprise';
    startingPrice?: number;
  };
  features: string[];
  logo?: string;
  status: 'draft' | 'published' | 'archived' | 'pending' | 'approved' | 'rejected';
  isTrending: boolean;
  isNewTool: boolean;
  isUpcoming: boolean;
  isTopRated: boolean;
  views: number;
  votes: number;
  rating: number;
  reviews: number;
  /** True for the 5000 tools seeded from the original scrape. They
   * are visible without payment forever. New (user-submitted) tools
   * default to false and must carry a paid subscription to publish. */
  seededTool: boolean;
  /**
   * SEO indexability gate. The seeded catalogue's `description` is
   * scraped third-party copy (taaft.com + vendor marketing) and
   * `description_ai` is an AI paraphrase of it — both are duplicate /
   * derivative content that Google already has, which is why the seeded
   * tool URLs sit in "Discovered – currently not indexed". A tool is
   * only allowed into the index (sitemap + robots index:true) once it
   * carries genuinely ORIGINAL, hand-written editorial copy. Defaults
   * false; flip to true per-tool as original copy is written (see
   * scripts/backfill-original-content.ts). isIndexable() requires it.
   */
  originalContent: boolean;
  listingStatus: ToolListingStatus;
  /** Active paid boosts. A tool can hold multiple at once
   * (e.g. category-top + featured-badge). */
  activeBoosts: BoostSlot[];
  /** Expiry timestamps keyed by slot. Cron sweeps this and removes
   * the corresponding slot from `activeBoosts` when expired. */
  boostExpiresAt?: {
    'category-top'?: Date;
    'home-rotation'?: Date;
    'featured-badge'?: Date;
  };
  /** Owner's Clerk user ID — set on submission for paid-flow tools.
   * Seeded tools have no owner. */
  ownerUserId?: string;
  /** Set when an admin rejects the submission via /admin/moderation.
   * Surfaces back to the owner on the dashboard so they can edit
   * and resubmit. Cleared on resubmit. `rejectedBy` is the Clerk
   * userId of the admin who rejected (parity with `ownerUserId`),
   * shown on the admin rejected-tools view. */
  rejectionReason?: string;
  rejectedAt?: Date;
  rejectedBy?: string;
  /** Soft-delete marker. Public listings filter out non-null
   * deletedAt; admin views can opt in via ?includeDeleted=true.
   * Payment/subscription history stays intact (Cashfree audit
   * trail), and any active subscription is cancelled at delete
   * time. Restore by clearing this field. */
  deletedAt?: Date;
  /** Clerk userId of whoever soft-deleted the tool — admin id for
   *  admin-side Archive, owner id for owner-side Delete. Null on
   *  legacy soft-deletes that landed before this column shipped. */
  deletedBy?: string;
  /** Which surface initiated the delete. Lets admin views
   *  distinguish between Archive (admin) and Delete (user) without
   *  cross-referencing the deletedBy id against User.isAdmin. */
  deletionSource?: 'user' | 'admin';
  createdAt: Date;
  updatedAt: Date;
}

export type ToolDocument = Document & ITool;

const toolSchema = new mongoose.Schema<ITool>({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String, required: true },
  description_ai: { type: String },
  websiteUrl: { type: String, required: true },
  category: { type: String, required: true },
  tags: [{ type: String }],
  pricing: {
    type: {
      type: String,
      enum: ['free', 'freemium', 'paid', 'enterprise'],
      required: true
    },
    startingPrice: { type: Number }
  },
  features: [{ type: String }],
  logo: { type: String },
  status: {
    type: String,
    enum: ['draft', 'published', 'archived', 'pending', 'approved', 'rejected'],
    default: 'draft'
  },
  isTrending: { type: Boolean, default: false },
  isNewTool: { type: Boolean, default: false },
  isUpcoming: { type: Boolean, default: false },
  isTopRated: { type: Boolean, default: false },
  views: { type: Number, default: 0 },
  votes: { type: Number, default: 0 },
  rating: { type: Number, default: 0 },
  reviews: { type: Number, default: 0 },
  seededTool: { type: Boolean, default: false },
  originalContent: { type: Boolean, default: false },
  listingStatus: {
    type: String,
    enum: ['free-seeded', 'paid-active', 'paid-expired', 'unpaid-pending', 'unpaid-hidden'],
    default: 'unpaid-pending',
  },
  activeBoosts: [{
    type: String,
    enum: ['category-top', 'home-rotation', 'featured-badge'],
  }],
  boostExpiresAt: {
    'category-top': { type: Date },
    'home-rotation': { type: Date },
    'featured-badge': { type: Date },
  },
  ownerUserId: { type: String, index: true },
  rejectionReason: { type: String },
  rejectedAt: { type: Date },
  rejectedBy: { type: String, index: true },
  deletedAt: { type: Date },
  deletedBy: { type: String },
  deletionSource: { type: String, enum: ['user', 'admin'] },
}, {
  timestamps: true // This will add createdAt and updatedAt fields automatically
});

// Add indexes for better query performance
toolSchema.index({ name: 'text', description: 'text' }); // Text search index
toolSchema.index({ category: 1 }); // Category search
toolSchema.index({ status: 1 }); // Status filter
toolSchema.index({ isTrending: 1 }); // Trending filter
toolSchema.index({ isNewTool: 1 }); // New filter
toolSchema.index({ isUpcoming: 1 }); // Upcoming filter
toolSchema.index({ isTopRated: 1 }); // Top rated filter
toolSchema.index({ createdAt: -1 }); // Sort by date
toolSchema.index({ rating: -1 }); // Sort by rating
toolSchema.index({ views: -1 }); // Sort by views
toolSchema.index({ listingStatus: 1 }); // Filter to publishable tools
toolSchema.index({ originalContent: 1 }); // SEO index gate — wave query filters on it
toolSchema.index({ activeBoosts: 1 }); // "give me tools with this boost" lookups
toolSchema.index({ deletedAt: 1 }); // Public reads exclude soft-deleted
// Compound supporting category page: filter by category + visibility,
// sort newest first. Replaces a table scan on the category filter.
toolSchema.index({ category: 1, status: 1, listingStatus: 1, createdAt: -1 });
// Compound supporting the public-catalog default "featured" sort:
// boosted tools first, then by votes/views. The trailing votes key
// is the dominant tiebreak; views + createdAt get sorted in memory
// against the already-narrow result set. Without this, /category/*
// scans then sorts which is wasteful at catalog scale.
toolSchema.index({
  category: 1,
  listingStatus: 1,
  status: 1,
  'activeBoosts.0': -1,
  votes: -1,
});

export const Tool = (mongoose.models.Tool || mongoose.model('Tool', toolSchema)) as unknown as Model<ToolDocument>;

