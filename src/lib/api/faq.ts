import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';

export interface FAQ {
  _id: string;
  id: string;
  question: string;
  answer: string;
  category: string;
  order: number;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface FAQResponse {
  success: boolean;
  data: FAQ[];
  grouped: Record<string, FAQ[]>;
}

async function getFAQs(options?: { includeInactive?: boolean }): Promise<FAQResponse> {
  const queryParams = new URLSearchParams();
  if (options?.includeInactive) {
    queryParams.append('includeInactive', 'true');
  }

  const response = await fetch(`/api/faq?${queryParams.toString()}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

async function createFAQ(token: string, faqData: Omit<FAQ, '_id' | 'id' | 'createdAt' | 'updatedAt'>) {
  const response = await fetch(`/api/faq`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(faqData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

async function updateFAQ(token: string, faqId: string, faqData: Partial<FAQ>) {
  const response = await fetch(`/api/faq/${faqId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(faqData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

async function deleteFAQ(token: string, faqId: string) {
  const response = await fetch(`/api/faq/${faqId}`, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  return response.json();
}

export function useFAQs(options?: { includeInactive?: boolean }) {
  return useQuery({
    queryKey: ['faqs', options],
    queryFn: () => getFAQs(options),
  });
}

export function useCreateFAQ() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (faqData: Omit<FAQ, '_id' | 'id' | 'createdAt' | 'updatedAt'>) => {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      return createFAQ(token, faqData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
    },
  });
}

export function useUpdateFAQ() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      faqId,
      data
    }: {
      faqId: string;
      data: Partial<FAQ>;
    }) => {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      return updateFAQ(token, faqId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
    },
  });
}

export function useDeleteFAQ() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (faqId: string) => {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      return deleteFAQ(token, faqId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['faqs'] });
    },
  });
}




