import mongoose, { Document, Model } from 'mongoose';

export interface IFAQ {
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const faqSchema = new mongoose.Schema<IFAQ>({
  question: { type: String, required: true },
  answer: { type: String, required: true },
  category: { type: String, required: true },
  order: { type: Number, default: 0 },
  isActive: { type: Boolean, default: true },
}, {
  timestamps: true,
});

faqSchema.index({ category: 1, order: 1 });
faqSchema.index({ isActive: 1 });

export type FAQDocument = Document & IFAQ;
export const FAQ = (mongoose.models.FAQ || mongoose.model('FAQ', faqSchema)) as unknown as Model<FAQDocument>;




