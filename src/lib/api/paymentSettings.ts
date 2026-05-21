import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


export interface PaymentConfig {
  publishableKey?: string;
  secretKey?: string;
  webhookSecret?: string;
}

export interface PayPalConfig {
  clientId?: string;
  clientSecret?: string;
  webhookId?: string;
}

export interface PaymentSettings {
  _id: string;
  stripe: {
    enabled: boolean;
    mode: 'test' | 'live';
    test: PaymentConfig;
    live: PaymentConfig;
  };
  paypal: {
    enabled: boolean;
    mode: 'sandbox' | 'live';
    sandbox: PayPalConfig;
    live: PayPalConfig;
  };
  currency: string;
  environment: 'development' | 'production';
  lastUpdated: string;
  updatedBy?: string;
}

export interface UpdatePaymentSettingsRequest {
  stripe?: {
    enabled?: boolean;
    mode?: 'test' | 'live';
    test?: PaymentConfig;
    live?: PaymentConfig;
  };
  paypal?: {
    enabled?: boolean;
    mode?: 'sandbox' | 'live';
    sandbox?: PayPalConfig;
    live?: PayPalConfig;
  };
  currency?: string;
  environment?: 'development' | 'production';
}

export interface UpdatePaymentSettingsResponse {
  success: boolean;
  message: string;
  data: {
    _id: string;
    validation: {
      isValid: boolean;
      errors: string[];
    };
  };
}

export interface TestStripeResponse {
  success: boolean;
  message: string;
  data: {
    accountId: string;
    country: string;
    currency: string;
    mode: string;
  };
}

export interface PublicPaymentConfig {
  stripe: {
    enabled: boolean;
    publishableKey: string | null;
    mode: 'test' | 'live';
  };
  paypal: {
    enabled: boolean;
    clientId: string | null;
    mode: 'sandbox' | 'live';
  };
  currency: string;
}

// Get payment settings (admin only)
export const usePaymentSettings = () => {
  return useQuery({
    queryKey: ['payment-settings'],
    queryFn: async (): Promise<PaymentSettings> => {
      const response = await fetch(`/api/payment-settings`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment settings');
      }
      
      const result = await response.json();
      return result.data;
    },
  });
};

// Update payment settings (admin only)
export const useUpdatePaymentSettings = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (data: UpdatePaymentSettingsRequest): Promise<UpdatePaymentSettingsResponse> => {
      const response = await fetch(`/api/payment-settings`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(data),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update payment settings');
      }
      
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['payment-settings'] });
      queryClient.invalidateQueries({ queryKey: ['public-payment-config'] });
    },
  });
};

// Test Stripe connection — deprecated, the Stripe integration was
// removed in the Cashfree migration. Phase D will replace the admin
// PaymentSettingsPage with a Cashfree-shaped one.
export const useTestStripeConnection = () => {
  return useMutation({
    mutationFn: async (_args: { mode: 'test' | 'live' }): Promise<TestStripeResponse> => {
      throw new Error('Stripe was removed in the Cashfree migration. The admin payment settings page will be rebuilt in Phase D.');
    },
  });
};

// Get public payment configuration (for frontend use)
export const usePublicPaymentConfig = () => {
  return useQuery({
    queryKey: ['public-payment-config'],
    queryFn: async (): Promise<PublicPaymentConfig> => {
      const response = await fetch(`/api/payment-settings/public-config`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch payment configuration');
      }
      
      const result = await response.json();
      return result.data;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}; 