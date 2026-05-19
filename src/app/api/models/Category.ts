import mongoose, { Document, Model } from 'mongoose';

export interface ICategory {
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  isDefault: boolean;
  toolCount?: number;
  /** SEO meta description (150-160 chars), AI-generated. */
  meta_description?: string;
  /** Human-facing 80-100 word intro paragraph, AI-generated. */
  intro?: string;
  createdAt: Date;
  updatedAt: Date;
}

export type CategoryDocument = Document & ICategory;

const categorySchema = new mongoose.Schema<ICategory>({
  name: { type: String, required: true, unique: true },
  slug: { type: String, required: true, unique: true },
  description: { type: String },
  icon: { type: String },
  color: { type: String },
  isActive: { type: Boolean, default: true },
  isDefault: { type: Boolean, default: false },
  toolCount: { type: Number, default: 0 },
  meta_description: { type: String },
  intro: { type: String }
}, {
  timestamps: true
});

// Indexes
// slug already has a unique index via the field definition above
categorySchema.index({ isActive: 1 });
categorySchema.index({ isDefault: 1 });

export const Category = (mongoose.models.Category || mongoose.model('Category', categorySchema)) as unknown as Model<CategoryDocument>;



