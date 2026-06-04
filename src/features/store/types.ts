/**
 * Public types for the store feature. Shared between server modules,
 * client components, and the page layer. Keep this file pure types —
 * no runtime imports — so it can be consumed from client and server
 * without bundler crossover concerns.
 */

import type { StoreCurrency } from './config';

export type StoreProductStatus = 'draft' | 'published' | 'archived';

export type StoreProductCategory =
  | 'n8n-workflow'
  | 'automation-pack'
  | 'template'
  | 'guide'
  | 'other';

export interface StoreProductSummary {
  _id: string;
  title: string;
  slug: string;
  shortDescription: string;
  category: StoreProductCategory;
  coverImageUrl: string | null;
  priceUsdMinor: number;
  priceInrMinor: number;
  salesCount: number;
  tags: string[];
}

export interface StoreProductDetail extends StoreProductSummary {
  description: string;
  /** What's included list — bullets shown on the product detail page. */
  includes: string[];
  /** Optional preview screenshots (Cloudinary, public). */
  previewImages: string[];
  fileSizeBytes: number;
  fileName: string;
}

export interface StorePurchaseSummary {
  _id: string;
  productId: string;
  productSlug: string;
  productTitle: string;
  purchasedAt: string;
  amountPaidMinor: number;
  currency: StoreCurrency;
  status: 'pending' | 'paid' | 'refunded';
}

export interface CheckoutResult {
  /** Cashfree branch returns this — frontend opens the CF SDK with it. */
  paymentSessionId?: string;
  /** PayPal branch returns this — frontend redirects the buyer here. */
  approveUrl?: string;
  /** Always present: the PSP's order id (or our local one for CF). */
  orderId: string;
  /** Always present: the Mongo Payment _id for return-page polling. */
  paymentDbId: string;
}
