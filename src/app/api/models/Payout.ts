import mongoose, { Document, Model } from 'mongoose';

export interface IPayout {
    affiliateId: string; // Links to AffiliateProfile.userId (clerkId)
    amount: number;
    status: 'processing' | 'paid' | 'failed';
    method: 'paypal' | 'manual';
    transactionId?: string; // External transaction ID
    notes?: string;
    createdAt: Date;
    updatedAt: Date;
}

export type PayoutDocument = Document & IPayout;

const payoutSchema = new mongoose.Schema<IPayout>({
    affiliateId: {
        type: String,
        required: true,
        index: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['processing', 'paid', 'failed'],
        default: 'processing'
    },
    method: {
        type: String,
        enum: ['paypal', 'manual'],
        required: true
    },
    transactionId: {
        type: String
    },
    notes: {
        type: String
    }
}, {
    timestamps: true
});

payoutSchema.index({ affiliateId: 1 });
payoutSchema.index({ createdAt: -1 });

export const Payout = (mongoose.models.Payout || mongoose.model('Payout', payoutSchema)) as unknown as Model<PayoutDocument>;
