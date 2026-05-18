import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';
import { BlogPost } from '@/types/blog';

// API functions
async function getBlogPosts(): Promise<BlogPost[]> {
  console.log('Fetching blog posts from:', `/api/blog`);
  
  const response = await fetch(`/api/blog`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('Error fetching blog posts:', errorData);
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log('Received blog posts:', data);
  return data;
}

async function getBlogPost(slug: string): Promise<BlogPost> {
  console.log('Fetching blog post with slug:', slug);
  
  const response = await fetch(`/api/blog/${slug}`, {
    headers: {
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('Error fetching blog post:', errorData);
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log('Received blog post:', data);
  return data;
}

async function createBlogPost(token: string, postData: Omit<BlogPost, '_id' | 'id' | 'author' | 'likes' | 'comments' | 'createdAt' | 'updatedAt'>) {
  console.log('Creating blog post with data:', postData);
  
  const response = await fetch(`/api/blog`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('Error creating blog post:', errorData);
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log('Created blog post:', data);
  return data;
}

async function updateBlogPost(token: string, postId: string, postData: Partial<BlogPost>) {
  console.log('Updating blog post:', postId, 'with data:', postData);
  
  const response = await fetch(`/api/blog/${postId}`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(postData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
    console.error('Error updating blog post:', errorData);
    throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
  }

  const data = await response.json();
  console.log('Updated blog post:', data);
  return data;
}

async function deleteBlogPost(token: string, postId: string) {
  const response = await fetch(`/api/blog/${postId}`, {
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

// React Query hooks
export function useBlogPosts() {
  return useQuery({
    queryKey: ['blog-posts'],
    queryFn: getBlogPosts,
  });
}

export function useBlogPost(slug: string) {
  return useQuery({
    queryKey: ['blog-post', slug],
    queryFn: () => getBlogPost(slug),
    enabled: !!slug,
  });
}

export function useCreateBlogPost() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postData: Omit<BlogPost, '_id' | 'id' | 'author' | 'likes' | 'comments' | 'createdAt' | 'updatedAt'>) => {
      const token = await getToken();
      return createBlogPost(token, postData);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
  });
}

export function useUpdateBlogPost() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ 
      postId, 
      data 
    }: { 
      postId: string; 
      data: Partial<BlogPost>; 
    }) => {
      const token = await getToken();
      return updateBlogPost(token, postId, data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
  });
}

export function useDeleteBlogPost() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (postId: string) => {
      const token = await getToken();
      return deleteBlogPost(token, postId);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['blog-posts'] });
    },
  });
} 