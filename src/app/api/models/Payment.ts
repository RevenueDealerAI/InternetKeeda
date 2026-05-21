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

export interface IPayment {
  userId: string;
  toolId: mongoose.Types.ObjectId;
  orderId: string;             // Cashfree order_id we generate
  paymentSessionId?: string;   // Returned by Cashfree on order create — front-end uses this with their SDK
  amount: number;              // paise
  currency: string;            // "INR"
  productType: BoostProductType;
  boostDurationDays: number;
  status: PaymentStatus;
  cashfreePaymentId?: string;  // Cashfree's internal payment ID once captured
  cashfreeOrderStatus?: string; // raw order status string from Cashfree
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
  orderId: { type: String, required: true, unique: true, index: true },
  paymentSessionId: { type: String },
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
  metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  paidAt: { type: Date },
  refundedAt: { type: Date },
}, {
  timestamps: true,
});

paymentSchema.index({ userId: 1, status: 1 });
paymentSchema.index({ status: 1, createdAt: -1 });

// Use any existing model if hot-reload already registered one with the
// new schema; otherwise create fresh.
export const Payment = (mongoose.models.Payment ||
  mongoose.model<IPayment>('Payment', paymentSchema)) as unknown as Model<PaymentDocument>;
