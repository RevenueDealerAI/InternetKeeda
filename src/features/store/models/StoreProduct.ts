import mongoose, { Document, Model } from 'mongoose';
import type {
  StoreProductCategory,
  StoreProductStatus,
} from '../types';

/**
 * A digital download offered through Keeda Labs (the store sub-brand).
 *
 * Pricing is stored in BOTH minor-unit currencies (paise + cents) so
 * the buyer can pay through either PSP (Cashfree INR / PayPal USD)
 * without runtime conversion — matches the boost pricing pattern.
 *
 * The downloadable file lives in private Vercel Blob storage. We
 * store the full blob URL in `filePath` BUT this field is only ever
 * read server-side (admin upload + signed-token mint). The public
 * Tool API never returns it. Cover images are public Cloudinary URLs.
 */

export interface IStoreProduct {
  title: string;
  slug: string;
  description: string;
  shortDescription: string;
  category: StoreProductCategory;
  tags: string[];
  /** What's included — shown as a bulleted list on the product page. */
  includes: string[];
  /** Cloudinary public URL for the product cover. */
  coverImageUrl: string;
  /** Cloudinary public URLs for inline screenshots. */
  previewImages: string[];
  /** Private Vercel Blob URL of the downloadable file. Server-only —
   *  NEVER returned to the client; the download API streams from it
   *  after entitlement verification. Random-suffixed by the SDK so
   *  guessing the URL is not viable. */
  filePath: string;
  /** Original upload filename — used as the Content-Disposition
   *  filename when the buyer downloads. */
  fileName: string;
  fileSizeBytes: number;
  /** Price in minor units (cents). Matches the existing Payment.amount
   *  semantics for PayPal rows. */
  priceUsdMinor: number;
  /** Price in minor units (paise). Matches the existing Payment.amount
   *  semantics for Cashfree rows. */
  priceInrMinor: number;
  status: StoreProductStatus;
  salesCount: number;
  /** Clerk userId of the admin who created the product. */
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
}

export type StoreProductDocument = Document & IStoreProduct;

const storeProductSchema = new mongoose.Schema<IStoreProduct>(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true, index: true },
    description: { type: String, required: true },
    shortDescription: { type: String, default: '' },
    category: {
      type: String,
      enum: ['n8n-workflow', 'automation-pack', 'template', 'guide', 'other'],
      required: true,
      index: true,
    },
    tags: [{ type: String }],
    includes: [{ type: String }],
    coverImageUrl: { type: String, default: '' },
    previewImages: [{ type: String }],
    filePath: { type: String, required: true },
    fileName: { type: String, required: true },
    fileSizeBytes: { type: Number, default: 0 },
    priceUsdMinor: { type: Number, required: true },
    priceInrMinor: { type: Number, required: true },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
      index: true,
    },
    salesCount: { type: Number, default: 0, index: true },
    createdBy: { type: String, required: true },
  },
  { timestamps: true }
);

storeProductSchema.index({ status: 1, salesCount: -1 });
storeProductSchema.index({ status: 1, createdAt: -1 });

export const StoreProduct = (mongoose.models.StoreProduct ||
  mongoose.model<IStoreProduct>(
    'StoreProduct',
    storeProductSchema
  )) as unknown as Model<StoreProductDocument>;
