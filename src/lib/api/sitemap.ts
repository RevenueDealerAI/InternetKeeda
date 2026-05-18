import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';


export interface SitemapStats {
  totalUrls: number;
  breakdown: {
    staticPages: number;
    tools: number;
    blogPosts: number;
    newsPosts: number;
  };
  sitemapUrl: string;
}

export interface SitemapData {
  totalUrls: number;
  breakdown: {
    staticPages: number;
    tools: number;
    blogPosts: number;
    newsPosts: number;
  };
  lastGenerated: string;
  sitemapUrl: string;
}

// Get sitemap statistics
export const useSitemapStats = () => {
  return useQuery({
    queryKey: ['sitemap', 'stats'],
    queryFn: async (): Promise<SitemapStats> => {
      const response = await fetch(`/api/sitemap/stats`);
      
      if (!response.ok) {
        throw new Error('Failed to fetch sitemap statistics');
      }
      
      return response.json();
    },
  });
};

// Generate sitemap
export const useGenerateSitemap = () => {
  const queryClient = useQueryClient();
  
  return useMutation({
    mutationFn: async (): Promise<{ success: boolean; message: string; data: SitemapData }> => {
      const response = await fetch(`/api/sitemap/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate sitemap');
      }
      
      return response.json();
    },
    onSuccess: () => {
      // Invalidate and refetch sitemap-related queries
      queryClient.invalidateQueries({ queryKey: ['sitemap'] });
    },
  });
}; 