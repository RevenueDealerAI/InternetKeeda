export interface Review {
  _id: string;
  toolId: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  status: 'pending' | 'approved' | 'rejected';
  adminResponse?: string;
  createdAt: string;
  updatedAt: string;
  toolName?: string;
  toolSlug?: string;
}

export interface ReviewListResponse {
  reviews: Review[];
  pagination: {
    total: number;
    page: number;
    pages: number;
  };
}
