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
   * and resubmit. Cleared on resubmit. */
  rejectionReason?: string;
  rejectedAt?: Date;
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
toolSchema.index({ activeBoosts: 1 }); // "give me tools with this boost" lookups

export const Tool = (mongoose.models.Tool || mongoose.model('Tool', toolSchema)) as unknown as Model<ToolDocument>;

