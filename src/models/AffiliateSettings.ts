import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IAffiliateSettings extends Document {
    commissionRate: number; // e.g., 0.20 for 20%
    minimumPayout: number; // e.g., 50.00
    cookieDurationDays: number; // e.g., 30
    termsAndConditions?: string;
    updatedBy: string; // UserId of admin who updated
    updatedAt: Date;
}

const AffiliateSettingsSchema = new Schema<IAffiliateSettings>(
    {
        commissionRate: { type: Number, default: 0.20, min: 0, max: 1 },
        minimumPayout: { type: Number, default: 50.00, min: 0 },
        cookieDurationDays: { type: Number, default: 30, min: 1 },
        termsAndConditions: { type: String },
        updatedBy: { type: String },
    },
    { timestamps: true }
);

// Singleton pattern helper
AffiliateSettingsSchema.statics.getSettings = async function () {
    const settings = await this.findOne();
    if (settings) return settings;
    return await this.create({});
};

// Add static method type
interface IAffiliateSettingsModel extends Model<IAffiliateSettings> {
    getSettings(): Promise<IAffiliateSettings>;
}

export const AffiliateSettings = (mongoose.models.AffiliateSettings as IAffiliateSettingsModel) ||
    mongoose.model<IAffiliateSettings, IAffiliateSettingsModel>('AffiliateSettings', AffiliateSettingsSchema);
