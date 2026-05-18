import mongoose, { Document, Model } from 'mongoose';

export interface ICommission {
    affiliateId: string; // Links to AffiliateProfile.userId (clerkId)
    referredUserId: string; // The user who bought (clerkId)
    amount: number;
    status: 'pending' | 'approved' | 'paid' | 'rejected';
    type: 'subscription' | 'advertisement' | 'bonus' | 'adjustment';
    sourceId?: string; // ID of Subscription or AdPurchase, optional for manual adjustments
    description?: string; // Reason for adjustment
    createdAt: Date;
    updatedAt: Date;
}

export type CommissionDocument = Document & ICommission;

const commissionSchema = new mongoose.Schema<ICommission>({
    affiliateId: {
        type: String,
        required: true,
        index: true
    },
    referredUserId: {
        type: String,
        required: false // Optional for system adjustments
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'approved', 'paid', 'rejected'],
        default: 'pending'
    },
    type: {
        type: String,
        enum: ['subscription', 'advertisement', 'bonus', 'adjustment'],
        required: true
    },
    sourceId: {
        type: String,
        required: false
    },
    description: {
        type: String,
        required: false
    }
}, {
    timestamps: true
});

commissionSchema.index({ affiliateId: 1, status: 1 });
commissionSchema.index({ createdAt: -1 });

export const Commission = (mongoose.models.Commission || mongoose.model('Commission', commissionSchema)) as unknown as Model<CommissionDocument>;
