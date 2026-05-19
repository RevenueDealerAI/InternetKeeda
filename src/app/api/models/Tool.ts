import mongoose, { Document, Model } from 'mongoose';

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
  reviews: { type: Number, default: 0 }
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

export const Tool = (mongoose.models.Tool || mongoose.model('Tool', toolSchema)) as unknown as Model<ToolDocument>;

