import mongoose, { Document, Model } from 'mongoose';

export interface IAffiliateProfile {
    userId: string; // Links to User.clerkId
    uniqueCode: string;
    paypalEmail?: string;
    totalEarnings: number;
    unpaidBalance: number;
    status: 'active' | 'suspended';
    createdAt: Date;
    updatedAt: Date;
}

export type AffiliateProfileDocument = Document & IAffiliateProfile;

const affiliateProfileSchema = new mongoose.Schema<IAffiliateProfile>({
    userId: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    uniqueCode: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    paypalEmail: {
        type: String
    },
    totalEarnings: {
        type: Number,
        default: 0
    },
    unpaidBalance: {
        type: Number,
        default: 0
    },
    status: {
        type: String,
        enum: ['active', 'suspended'],
        default: 'active'
    }
}, {
    timestamps: true
});

export const AffiliateProfile = (mongoose.models.AffiliateProfile || mongoose.model('AffiliateProfile', affiliateProfileSchema)) as unknown as Model<AffiliateProfileDocument>;
