export interface Tool {
  _id: string;
  id?: string;
  toolId?: string;
  name: string;
  slug: string;
  description: string;
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
} 