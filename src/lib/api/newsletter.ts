import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


export interface NewsletterSubscription {
  _id: string;
  email: string;
  status: 'active' | 'unsubscribed';
  subscribedAt: string;
  unsubscribedAt?: string;
  source: 'footer' | 'homepage' | 'other';
  ipAddress?: string;
  userAgent?: string;
}

export interface NewsletterStats {
  total: number;
  active: number;
  unsubscribed: number;
  recent: number;
  bySource: {
    footer?: number;
    homepage?: number;
    other?: number;
  };
}

// Subscribe to newsletter
export const useNewsletterSubscribe = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: { email: string; source?: 'footer' | 'homepage' | 'other' }) => {
      const response = await fetch(`/api/newsletter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to subscribe to newsletter');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch newsletter-related queries
      queryClient.invalidateQueries({ queryKey: ['newsletter'] });
    },
  });
};

// Get all newsletter subscriptions (admin only)
export const useNewsletterSubscriptions = () => {
  return useQuery({
    queryKey: ['newsletter', 'subscriptions'],
    queryFn: async (): Promise<NewsletterSubscription[]> => {
      const response = await fetch(`/api/newsletter`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch newsletter subscriptions');
      }
      
      return response.json();
    },
  });
};

// Get newsletter statistics (admin only)
export const useNewsletterStats = () => {
  return useQuery({
    queryKey: ['newsletter', 'stats'],
    queryFn: async (): Promise<NewsletterStats> => {
      const response = await fetch(`/api/newsletter/stats`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch newsletter statistics');
      }
      
      return response.json();
    },
  });
};

// Update subscription status (admin only)
export const useUpdateNewsletterStatus = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ subscriptionId, status }: { subscriptionId: string; status: 'active' | 'unsubscribed' }) => {
      const response = await fetch(`/api/newsletter/${subscriptionId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ status }),
      });
      
      if (!response.ok) {
        throw new Error('Failed to update subscription status');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch newsletter-related queries
      queryClient.invalidateQueries({ queryKey: ['newsletter'] });
    },
  });
};

// Delete subscription (admin only)
export const useDeleteNewsletterSubscription = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (subscriptionId: string) => {
      const response = await fetch(`/api/newsletter/${subscriptionId}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        throw new Error('Failed to delete subscription');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch newsletter-related queries
      queryClient.invalidateQueries({ queryKey: ['newsletter'] });
    },
  });
};

// Unsubscribe via email (public endpoint)
export const useNewsletterUnsubscribe = () => {
  return useMutation({
    mutationFn: async (email: string) => {
      const response = await fetch(`/api/newsletter/unsubscribe`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ email }),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to unsubscribe from newsletter');
      }
      
      return response.json();
    },
  });
}; 