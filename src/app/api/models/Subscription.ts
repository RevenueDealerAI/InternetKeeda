import mongoose, { Document, Model } from 'mongoose';

/**
 * Recurring subscription record for the monthly tool listing fee.
 * Created when a user submits a new tool and chooses to activate it;
 * the relevant gateway webhook keeps this row in sync via the
 * matching SUBSCRIPTION_* / BILLING.SUBSCRIPTION.* events.
 *
 * Per-row currency:
 *   - Cashfree rows: INR / 83000 paise (₹830) under plan
 *     `monthly-listing-inr-830`
 *   - PayPal rows: USD / 1000 cents ($10) under PAYPAL_PLAN_ID
 *
 * User-facing UI shows "$10/mo" anchor pricing regardless of which
 * gateway charged the user; Cashfree's hosted checkout shows ₹830
 * at payment time (expected by Indian buyers, outside our control).
 *
 * Amounts are stored in minor units (cents for USD, paise for INR);
 * display layer divides by 100 before rendering.
 */

export type SubscriptionStatus =
  | 'initialized'    // SUBSCRIPTION_NEW received, awaiting user authorization
  | 'active'         // SUBSCRIPTION_ACTIVATED — billing live
  | 'paused'         // user / admin paused
  | 'cancelled'      // user / admin cancelled
  | 'failed'         // 3 consecutive failed renewals
  | 'expired';       // plan_max_cycles reached (we use unlimited so rare)

export type SubscriptionProvider = "cashfree" | "paypal";

export interface ISubscription {
  userId: string;            // Clerk userId of the tool owner
  toolId: mongoose.Types.ObjectId;
  /** Which payment provider owns the recurring billing. Default
   * 'cashfree' for backwards-compat with legacy rows; new rows pick
   * 'paypal' or 'cashfree' explicitly. */
  provider: SubscriptionProvider;
  planId: string;            // "monthly-listing-inr-830" / PAYPAL_PLAN_ID — soft reference
  /** Canonical primary id this sub is known by. For Cashfree rows
   * it's the Cashfree subscription_id we generate; for PayPal rows
   * it's PayPal's I-XXXX. Status polling looks rows up by this. */
  subscriptionId: string;
  /** Mirror of subscriptionId when provider === 'paypal'. Stored
   * separately so admin queries can find PayPal rows even if the
   * canonical field ever drifts. */
  paypalSubscriptionId?: string;
  amount: number;            // minor units per cycle (1000 for $10 USD; legacy 49900 for ₹499)
  currency: string;          // "USD" going forward; legacy rows are "INR"
  status: SubscriptionStatus;
  billingCycle: 'monthly' | 'yearly';
  nextBillingDate?: Date;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  authorizationStatus?: string;  // raw Cashfree auth status (BANK_APPROVAL_PENDING, ACTIVE, etc.)
  /** Mirrors Payment.paymentVerifiedVia — 'webhook' for the signed
   * path, 'polling-fallback' when the status endpoint self-healed
   * because the webhook never arrived. */
  activationVerifiedVia?: 'webhook' | 'polling-fallback';
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
  provider: {
    type: String,
    enum: ['cashfree', 'paypal'],
    default: 'cashfree',
    index: true,
  },
  planId: { type: String, default: 'monthly-listing-inr-830' },
  subscriptionId: { type: String, required: true, unique: true, index: true },
  paypalSubscriptionId: { type: String, index: true, sparse: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'USD' },
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
  activationVerifiedVia: { type: String, enum: ['webhook', 'polling-fallback'] },
  cancelledAt: { type: Date },
  failedRenewalCount: { type: Number, default: 0 },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
}, {
  timestamps: true,
});

subscriptionSchema.index({ status: 1, nextBillingDate: 1 });
subscriptionSchema.index({ userId: 1, status: 1 });
// Tool-page reads ask "is this tool actively subscribed?" via
// findOne({ toolId, status: { $in: ['active', 'paused'] } }) — also
// the existence check before issuing a new sub. Compound index
// makes it a single-doc lookup rather than a toolId scan + filter.
subscriptionSchema.index({ toolId: 1, status: 1 });
// Revenue aggregation in /api/admin/revenue groups by status +
// currentPeriodStart for "this month" totals.
subscriptionSchema.index({ status: 1, currentPeriodStart: -1 });

// Bust any cached model definition — schema changed from the Stripe
// version, and `mongoose.models` would otherwise hand back the old one
// during dev hot-reload.
if (mongoose.models.Subscription) {
  delete mongoose.models.Subscription;
}

export const Subscription = mongoose.model<ISubscription>('Subscription', subscriptionSchema) as unknown as Model<SubscriptionDocument>;
