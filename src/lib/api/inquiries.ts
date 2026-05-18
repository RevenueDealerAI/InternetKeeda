import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';


interface SalesInquiry {
  _id: string;
  fullName: string;
  email: string;
  companyName: string;
  monthlyBudget: string;
  message: string;
  status: 'new' | 'contacted' | 'closed';
  submittedAt: string;
  updatedAt: string;
}

interface SubmitInquiryData {
  fullName: string;
  email: string;
  companyName: string;
  monthlyBudget: string;
  message: string;
}

// Submit new inquiry
async function submitInquiry(data: SubmitInquiryData, token: string): Promise<SalesInquiry> {
  console.log('Submitting inquiry to:', `/api/sales-inquiries`);
  console.log('Submission data:', data);

  try {
    const response = await fetch(`/api/sales-inquiries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
        'Authorization': `Bearer ${token}`,
      },
      body: JSON.stringify(data),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => null);
      console.error('Submission error:', {
        status: response.status,
        statusText: response.statusText,
        error: errorData
      });
      throw new Error(errorData?.error || 'Failed to submit inquiry');
    }

    const result = await response.json();
    console.log('Submission successful:', result);
    return result;
  } catch (error) {
    console.error('Submission error:', error);
    throw error;
  }
}

// Fetch all sales inquiries
async function getSalesInquiries(token: string): Promise<SalesInquiry[]> {
  const response = await fetch(`/api/sales-inquiries`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch sales inquiries');
  }

  return response.json();
}

// Update sales inquiry status
async function updateSalesInquiryStatus(
  token: string,
  inquiryId: string,
  status: 'contacted' | 'closed'
): Promise<SalesInquiry> {
  const response = await fetch(`/api/sales-inquiries/${inquiryId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error('Failed to update sales inquiry status');
  }

  return response.json();
}

// React Query hooks
export function useSalesInquiries() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['sales-inquiries'],
    queryFn: async () => {
      const token = await getToken();
      return getSalesInquiries(token);
    },
  });
}

export function useUpdateSalesInquiryStatus() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      inquiryId, 
      status 
    }: { 
      inquiryId: string; 
      status: 'contacted' | 'closed';
    }) => {
      const token = await getToken();
      return updateSalesInquiryStatus(token, inquiryId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['sales-inquiries'] });
    },
  });
}

// React Query hook for submitting a new inquiry
export function useSubmitInquiry() {
  const { getToken } = useAuth();
  
  return useMutation({
    mutationFn: async (data: SubmitInquiryData) => {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      return submitInquiry(data, token);
    },
  });
} 