import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


export interface AdvertisingPlan {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  currency: string;
  duration: number;
  features: string[];
  isActive: boolean;
  isPopular: boolean;
  stripePriceId?: string;
  paypalPlanId?: string;
  placement: 'basic' | 'featured' | 'premium' | 'sponsored';
  maxListings: number;
  analytics: boolean;
  socialPromotion: boolean;
  newsletterFeature: boolean;
  prioritySupport: boolean;
  customIntegrations: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface AdvertisingPlanInput {
  name: string;
  slug: string;
  description: string;
  price: number;
  currency?: string;
  duration: number;
  features: string[];
  isActive?: boolean;
  isPopular?: boolean;
  stripePriceId?: string;
  paypalPlanId?: string;
  placement?: 'basic' | 'featured' | 'premium' | 'sponsored';
  maxListings?: number;
  analytics?: boolean;
  socialPromotion?: boolean;
  newsletterFeature?: boolean;
  prioritySupport?: boolean;
  customIntegrations?: boolean;
}

export interface AdvertisingStats {
  totalPlans: number;
  activePlans: number;
  totalPurchases: number;
  activePurchases: number;
  totalRevenue: number;
  purchasesByPlan: Array<{
    _id: string;
    count: number;
    revenue: number;
  }>;
}

// Get all advertising plans
export const useAdvertisingPlans = (activeOnly = false) => {
  return useQuery({
    queryKey: ['advertising-plans', { activeOnly }],
    queryFn: async (): Promise<AdvertisingPlan[]> => {
      const url = activeOnly 
        ? `/api/advertising-plans?active=true`
        : `/api/advertising-plans`;
      
      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error('Failed to fetch advertising plans');
      }
      
      return response.json();
    },
  });
};

// Get single advertising plan
export const useAdvertisingPlan = (id: string) => {
  return useQuery({
    queryKey: ['advertising-plans', id],
    queryFn: async (): Promise<AdvertisingPlan> => {
      const response = await fetch(`/api/advertising-plans/${id}`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch advertising plan');
      }
      
      return response.json();
    },
    enabled: !!id,
  });
};

// Create advertising plan
export const useCreateAdvertisingPlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: AdvertisingPlanInput): Promise<{ success: boolean; message: string; data: AdvertisingPlan }> => {
      const response = await fetch(`/api/advertising-plans`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to create advertising plan');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertising-plans'] });
    },
  });
};

// Update advertising plan
export const useUpdateAdvertisingPlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async ({ id, data }: { id: string; data: Partial<AdvertisingPlanInput> }): Promise<{ success: boolean; message: string; data: AdvertisingPlan }> => {
      const response = await fetch(`/api/advertising-plans/${id}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to update advertising plan');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertising-plans'] });
    },
  });
};

// Delete advertising plan
export const useDeleteAdvertisingPlan = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (id: string): Promise<{ success: boolean; message: string }> => {
      const response = await fetch(`/api/advertising-plans/${id}`, {
        method: 'DELETE',
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to delete advertising plan');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['advertising-plans'] });
    },
  });
};

// Get advertising statistics
export const useAdvertisingStats = () => {
  return useQuery({
    queryKey: ['advertising-plans', 'stats'],
    queryFn: async (): Promise<AdvertisingStats> => {
      const response = await fetch(`/api/advertising-plans/stats/overview`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch advertising statistics');
      }
      
      return response.json();
    },
  });
}; 