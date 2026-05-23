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
  /** DB-side admin flag. Source of truth for /admin/moderation and
   * future admin surfaces. Set manually for trusted accounts —
   * `scripts/seed-admin.ts` flips it by email. The Clerk
   * publicMetadata.role check is still honoured by requireAdmin for
   * backwards compatibility, but new code should rely on this. */
  isAdmin: boolean;
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
  isAdmin: { type: Boolean, default: false, index: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

userSchema.index({ email: 1 });
userSchema.index({ username: 1 });

export const User = (mongoose.models.User || mongoose.model('User', userSchema)) as unknown as Model<UserDocument>;

