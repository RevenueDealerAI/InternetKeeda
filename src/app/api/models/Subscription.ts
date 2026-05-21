import mongoose, { Document, Model } from 'mongoose';

/**
 * Recurring subscription record for the ₹499/month tool listing fee.
 * Created when a user submits a new tool and chooses to activate it;
 * Cashfree handles the actual billing schedule, and the webhook keeps
 * this row in sync via SUBSCRIPTION_* events.
 *
 * Amounts are stored in **paise** (INR × 100) — display layer divides
 * by 100 before rendering.
 */

export type SubscriptionStatus =
  | 'initialized'    // SUBSCRIPTION_NEW received, awaiting user authorization
  | 'active'         // SUBSCRIPTION_ACTIVATED — billing live
  | 'paused'         // user / admin paused
  | 'cancelled'      // user / admin cancelled
  | 'failed'         // 3 consecutive failed renewals
  | 'expired';       // plan_max_cycles reached (we use unlimited so rare)

export interface ISubscription {
  userId: string;            // Clerk userId of the tool owner
  toolId: mongoose.Types.ObjectId;
  planId: string;            // "monthly-listing-499" — soft reference, see lib/cashfree.ts PRICING
  subscriptionId: string;    // Cashfree subscription_id
  amount: number;            // paise per cycle (49900 for ₹499)
  currency: string;          // "INR" for v1
  status: SubscriptionStatus;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate?: Date;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  authorizationStatus?: string;  // raw Cashfree auth status (BANK_APPROVAL_PENDING, ACTIVE, etc.)
  cancelledAt?: Date;
  failedRenewalCount: number;
  /** Anything else Cashfree sends in webhook payloads — keep raw. */
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionDocument = Document & ISubscription;

const subscriptionSchema = new mongoose.Schema<ISubscription>({
  userId: { type: String, required: true, index: true },
  toolId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool', required: true, index: true },
  planId: { type: String, default: 'monthly-listing-499' },
  subscriptionId: { type: String, required: true, unique: true, index: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  status: {
    type: String,
    enum: ['initialized', 'active', 'paused', 'cancelled', 'failed', 'expired'],
    default: 'initialized',
    index: true,
  },
  billingCycle: { type: String, enum: ['monthly', 'yearly'], default: 'monthly' },
  nextBillingDate: { type: Date },
  currentPeriodStart: { type: Date },
  currentPeriodEnd: { type: Date },
  authorizationStatus: { type: String },
  cancelledAt: { type: Date },
  failedRenewalCount: { type: Number, default: 0 },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, {
  timestamps: true,
});

subscriptionSchema.index({ status: 1, nextBillingDate: 1 });
subscriptionSchema.index({ userId: 1, status: 1 });

// Bust any cached model definition — schema changed from the Stripe
// version, and `mongoose.models` would otherwise hand back the old one
// during dev hot-reload.
if (mongoose.models.Subscription) {
  delete mongoose.models.Subscription;
}

export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema) as unknown as Model<SubscriptionDocument>;
