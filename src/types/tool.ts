export interface Tool {
  _id: string;
  id?: string;
  toolId?: string;
  name: string;
  slug: string;
  description: string;
  /** AI-rewritten original description. Display in preference to
   * `description` (which is the seller's scraped fallback). */
  description_ai?: string;
  websiteUrl: string;
  category: string;
  tags: string[];
  pricing: {
    type: 'free' | 'freemium' | 'paid' | 'enterprise';
    startingPrice?: number;
  };
  features: string[];
  logo?: string;
  status: 'draft' | 'published' | 'archived' | 'pending' | 'approved' | 'rejected';
  isTrending?: boolean;
  isNew?: boolean;
  isUpcoming?: boolean;
  isTopRated?: boolean;
  views: number;
  votes: number;
  rating: number;
  reviews: number;
  createdAt: string;
  updatedAt: string;
  activeBoosts?: Array<'category-top' | 'home-rotation' | 'featured-badge'>;
  listingStatus?:
    | 'free-seeded'
    | 'paid-active'
    | 'paid-expired'
    | 'unpaid-pending'
    | 'unpaid-hidden';
  seededTool?: boolean;
  deletedAt?: string | null;
  /** Rejection metadata — populated when status === 'rejected'.
   * Surfaced in the admin Rejected view and the owner-facing
   * dashboard. */
  rejectionReason?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  ownerUserId?: string;
}