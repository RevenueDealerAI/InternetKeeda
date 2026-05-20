import { useQuery } from '@tanstack/react-query';
import { API_BASE_URL } from '@/config/constants';

export interface Category {
  _id?: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  color?: string;
  isActive: boolean;
  isDefault: boolean;
  toolCount?: number;
}

interface CategoriesResponse {
  success: boolean;
  data: Category[];
}

export function useCategories(includeToolCount = false, limit?: number) {
  return useQuery<CategoriesResponse>({
    queryKey: ['categories', includeToolCount, limit ?? 0],
    queryFn: async () => {
      const params = new URLSearchParams({
        includeToolCount: String(includeToolCount),
      });
      if (limit && limit > 0) params.set('limit', String(limit));
      const response = await fetch(`${API_BASE_URL}/api/categories?${params}`);
      if (!response.ok) {
        throw new Error('Failed to fetch categories');
      }
      return response.json();
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
}








