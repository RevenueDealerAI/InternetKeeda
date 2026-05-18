import mongoose, { Document, Model } from 'mongoose';

export interface IReview {
  toolId: mongoose.Types.ObjectId;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  adminResponse: string;
  createdAt: Date;
  updatedAt: Date;
}

export type ReviewDocument = Document & IReview;

const reviewSchema = new mongoose.Schema<IReview>({
  toolId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Tool', 
    required: true 
  },
  userId: { 
    type: String, 
    required: true 
  },
  userName: { 
    type: String, 
    required: true 
  },
  userAvatar: { 
    type: String, 
    default: '' 
  },
  rating: { 
    type: Number, 
    required: true, 
    min: 1, 
    max: 5 
  },
  comment: { 
    type: String, 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['pending', 'approved', 'rejected'], 
    default: 'pending' 
  },
  adminResponse: { 
    type: String, 
    default: '' 
  },
  updatedAt: { 
    type: Date, 
    default: Date.now 
  }
}, {
  timestamps: true
});

reviewSchema.index({ toolId: 1 });
reviewSchema.index({ userId: 1 });
reviewSchema.index({ status: 1 });
reviewSchema.index({ rating: -1 });
reviewSchema.index({ createdAt: -1 });

export const Review = (mongoose.models.Review || mongoose.model('Review', reviewSchema)) as unknown as Model<ReviewDocument>;

