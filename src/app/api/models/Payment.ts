import mongoose, { Document, Model } from 'mongoose';

/**
 * One-time payment for a tool boost (category-top / home-rotation /
 * featured-badge). Recurring subscription payments live in the
 * Subscription model — this is only for the one-shot boost purchases.
 *
 * Amounts are stored in **paise** (INR × 100). Display layer divides
 * by 100 before rendering.
 */

export type PaymentStatus = 'pending' | 'success' | 'failed' | 'dropped' | 'refunded';

export type BoostProductType =
  | 'boost-category-top'
  | 'boost-home-rotation'
  | 'boost-featured-badge';

export type PaymentProvider = 'cashfree' | 'paypal';

export interface IPayment {
  userId: string;
  toolId: mongoose.Types.ObjectId;
  /** Which provider holds the order. Default 'cashfree' for backwards-
   * compat. PayPal rows store PayPal's order id (e.g. 8XJ12345AB67890C)
   * in `orderId` AND in `paypalOrderId` so lookups via either key
   * succeed. */
  provider: PaymentProvider;
  orderId: string;             // Cashfree order_id we generate, or PayPal order id (8XJ…)
  paymentSessionId?: string;   // Returned by Cashfree on order create — front-end uses this with their SDK
  paypalOrderId?: string;      // Mirror of orderId for PayPal rows
  paypalCaptureId?: string;    // Filled by the capture call / webhook
  amount: number;              // Cashfree rows: paise (INR ×100). PayPal rows: cents (USD ×100).
  currency: string;            // "INR" for Cashfree boosts, "USD" for PayPal boosts
  productType: BoostProductType;
  boostDurationDays: number;
  status: PaymentStatus;
  cashfreePaymentId?: string;  // Cashfree's internal payment ID once captured
  cashfreeOrderStatus?: string; // raw order status string from Cashfree
  /** Tracks which path reconciled this payment. 'webhook' is the
   * signed path; 'polling-fallback' means the status endpoint
   * self-healed when Cashfree's order API confirmed PAID but the
   * webhook never arrived. */
  paymentVerifiedVia?: 'webhook' | 'polling-fallback';
  /** Anything else Cashfree sends — webhook events, metadata blobs. */
  metadata: Record<string, unknown>;
  paidAt?: Date;
  refundedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

export type PaymentDocument = Document & IPayment;

const paymentSchema = new mongoose.Schema<IPayment>({
  userId: { type: String, required: true, index: true },
  toolId: { type: mongoose.Schema.Types.ObjectId, ref: 'Tool', required: true, index: true },
  provider: {
    type: String,
    enum: ['cashfree', 'paypal'],
    default: 'cashfree',
    index: true,
  },
  orderId: { type: String, required: true, unique: true, index: true },
  paymentSessionId: { type: String },
  paypalOrderId: { type: String, index: true, sparse: true },
  paypalCaptureId: { type: String, index: true, sparse: true },
  amount: { type: Number, required: true },
  currency: { type: String, default: 'INR' },
  productType: {
    type: String,
    enum: ['boost-category-top', 'boost-home-rotation', 'boost-featured-badge'],
    required: true,
  },
  boostDurationDays: { type: Number, required: true },
  status: {
    type: String,
    enum: ['pending', 'success', 'failed', 'dropped', 'refunded'],
    default: 'pending',
    index: true,
  },
  cashfreePaymentId: { type: String },
  cashfreeOrderStatus: { type: String },
  paymentVerifiedVia: { type: String, enum: ['webhook', 'polling-fallback'] },
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  paidAt: { type: Date },
  refundedAt: { type: Date },
}, {
  timestamps: true,
});

paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });
// Revenue rollup matches on { status: 'success', paidAt: { $gte } }.
// The createdAt compound above works but paidAt is the more honest
// signal (a payment created in March but paid in April should count
// in April's revenue).
paymentSchema.index({ status: 1, paidAt: -1 });
// Boost lookups: "all successful payments for this tool" — admin
// tool-detail page lists boost history.
paymentSchema.index({ toolId: 1, status: 1 });

// Use any existing model if hot-reload already registered one with the
// new schema; otherwise create fresh.
export const Payment = (mongoose.models.Payment ||
  mongoose.model<IPayment>('Payment', paymentSchema)) as unknown as Model<PaymentDocument>;
