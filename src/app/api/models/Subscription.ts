import mongoose, { Document, Model } from 'mongoose';

export interface ISubscription {
  userId: string;
  customerId: string;
  subscriptionId: string;
  status: 'active' | 'canceled' | 'incomplete' | 'incomplete_expired' | 'past_due' | 'trialing' | 'unpaid';
  plan: 'basic' | 'premium' | 'enterprise';
  priceId: string;
  amount: number;
  currency: string;
  interval: 'month' | 'year';
  billingCycleAnchor?: Date;
  currentPeriodStart: Date;
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  metadata: Map<string, string>;
  createdAt: Date;
  updatedAt: Date;
}

export type SubscriptionDocument = Document & ISubscription;

const subscriptionSchema = new mongoose.Schema<ISubscription>({
  userId: { 
    type: String, 
    required: true 
  },
  customerId: { 
    type: String, 
    required: true 
  },
  subscriptionId: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['active', 'canceled', 'incomplete', 'incomplete_expired', 'past_due', 'trialing', 'unpaid'],
    default: 'active'
  },
  plan: {
    type: String,
    enum: ['basic', 'premium', 'enterprise'],
    required: true
  },
  priceId: { 
    type: String, 
    required: true 
  },
  amount: { 
    type: Number, 
    required: true 
  },
  currency: { 
    type: String, 
    default: 'usd' 
  },
  interval: { 
    type: String, 
    enum: ['month', 'year'], 
    default: 'month' 
  },
  billingCycleAnchor: { 
    type: Date 
  },
  currentPeriodStart: { 
    type: Date, 
    required: true 
  },
  currentPeriodEnd: { 
    type: Date, 
    required: true 
  },
  cancelAtPeriodEnd: { 
    type: Boolean, 
    default: false 
  },
  canceledAt: { 
    type: Date 
  },
  metadata: {
    type: Map,
    of: String,
    default: {}
  }
}, {
  timestamps: true
});

subscriptionSchema.index({ userId: 1 });
subscriptionSchema.index({ subscriptionId: 1 });
subscriptionSchema.index({ status: 1 });
subscriptionSchema.index({ plan: 1 });
subscriptionSchema.index({ currentPeriodEnd: 1 });

export const Subscription = (mongoose.models.Subscription || mongoose.model('Subscription', subscriptionSchema)) as unknown as Model<SubscriptionDocument>;

