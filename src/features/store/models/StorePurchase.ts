import mongoose, { Document, Model } from 'mongoose';
import type { StoreCurrency } from '../config';

/**
 * Entitlement row: one per (user, product) successful purchase.
 *
 * The payment ledger itself stays in the existing Payment collection —
 * this row is just the "yes, this user owns this download" record
 * the download API checks. Created idempotently from the PSP webhook
 * (via markStorePaid) so a webhook replay does not double-issue.
 *
 * Refunds flip status to 'refunded' but keep the row — preserves the
 * audit trail and means the user briefly loses download access (the
 * download API rejects anything but 'paid').
 */

export interface IStorePurchase {
  /** Clerk userId of the buyer. */
  userId: string;
  /** Mongo _id of the StoreProduct (string for lookup convenience). */
  productId: string;
  /** Denormalized slug for fast My-Downloads list rendering. */
  productSlug: string;
  /** Denormalized title for the same reason. */
  productTitle: string;
  /** Mongo _id of the Payment doc (the actual money). */
  paymentId: string;
  /** Provider that took the money. */
  provider: 'cashfree' | 'paypal';
  /** Amount paid in minor units (paise for INR, cents for USD). */
  amountPaidMinor: number;
  currency: StoreCurrency;
  status: 'pending' | 'paid' | 'refunded';
  purchasedAt: Date;
  refundedAt?: Date;
  /** Last time the buyer downloaded — useful for admin support. */
  lastDownloadedAt?: Date;
  /** Count of download invocations. Soft analytics, not a gate. */
  downloadCount: number;
  createdAt: Date;
  updatedAt: Date;
}

export type StorePurchaseDocument = Document & IStorePurchase;

const storePurchaseSchema = new mongoose.Schema<IStorePurchase>(
  {
    userId: { type: String, required: true, index: true },
    productId: { type: String, required: true, index: true },
    productSlug: { type: String, required: true },
    productTitle: { type: String, required: true },
    paymentId: { type: String, required: true, unique: true, index: true },
    provider: { type: String, enum: ['cashfree', 'paypal'], required: true },
    amountPaidMinor: { type: Number, required: true },
    currency: { type: String, enum: ['INR', 'USD'], required: true },
    status: {
      type: String,
      enum: ['pending', 'paid', 'refunded'],
      default: 'pending',
      index: true,
    },
    purchasedAt: { type: Date, default: Date.now },
    refundedAt: { type: Date },
    lastDownloadedAt: { type: Date },
    downloadCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

// "All purchases this user owns" — primary My-Downloads query.
storePurchaseSchema.index({ userId: 1, status: 1, purchasedAt: -1 });
// Idempotency guard: one purchase per (user, product, payment).
storePurchaseSchema.index(
  { userId: 1, productId: 1, paymentId: 1 },
  { unique: true }
);

export const StorePurchase = (mongoose.models.StorePurchase ||
  mongoose.model<IStorePurchase>(
    'StorePurchase',
    storePurchaseSchema
  )) as unknown as Model<StorePurchaseDocument>;
