import mongoose, { Document, Model } from 'mongoose';

export interface IUser {
  clerkId: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  profileImageUrl: string;
  publicMetadata: Record<string, unknown>;
  upvotedTools: string[];
  savedTools: string[];
  submittedTools: mongoose.Types.ObjectId[];
  referredBy?: string; // Affiliate code of the referrer
  createdAt: Date;
  updatedAt: Date;
}

export type UserDocument = Document & IUser;

const userSchema = new mongoose.Schema<IUser>({
  clerkId: { type: String, required: true, unique: true },
  firstName: { type: String, default: '' },
  lastName: { type: String, default: '' },
  email: { type: String, default: '' },
  username: { type: String, default: '' },
  profileImageUrl: { type: String, default: '' },
  publicMetadata: { type: mongoose.Schema.Types.Mixed, default: {} },
  upvotedTools: [{ type: String }],
  savedTools: [{ type: String }],
  submittedTools: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Tool' }],
  referredBy: { type: String, trim: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

export const User = (mongoose.models.User || mongoose.model('User', userSchema)) as unknown as Model<UserDocument>;

