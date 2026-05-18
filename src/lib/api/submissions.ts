import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useAuth } from '@clerk/clerk-react';


interface ToolSubmission {
  _id: string;
  toolName: string;
  description: string;
  websiteUrl: string;
  logoUrl: string;
  category: string;
  pricingType: string;
  keyHighlights: string[];
  twitterUrl?: string;
  githubUrl?: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
  updatedAt: string;
}

interface SubmitToolData {
  toolName: string;
  description: string;
  websiteUrl: string;
  logoUrl: string;
  category: string;
  pricingType: string;
  keyHighlights: string[];
  twitterUrl?: string;
  githubUrl?: string;
}

async function getToolSubmissions(token: string): Promise<ToolSubmission[]> {
  const response = await fetch(`/api/tools/submissions`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
  });

  if (!response.ok) {
    throw new Error('Failed to fetch tool submissions');
  }

  const raw = await response.json();

  if (!Array.isArray(raw)) {
    return [];
  }

  return raw.map((tool: any) => {
    // robust pricing mapping
    const rawPricingType = tool?.pricing?.type || tool?.pricingType || '';
    const pricingType = rawPricingType.charAt(0).toUpperCase() + rawPricingType.slice(1);

    // robust date mapping
    const rawDate = tool?.createdAt || tool?.submittedAt || tool?.submittedDate;
    const submittedAt = rawDate ? new Date(rawDate).toISOString() : new Date().toISOString();

    // Map fields explicitly
    return {
      _id: tool._id || tool.id,
      toolName: tool.name || tool.toolName || 'Untitled Tool',
      description: tool.description || '',
      websiteUrl: tool.websiteUrl || tool.url || '',
      logoUrl: tool.logo || tool.logoUrl || '',
      category: tool.category || '',
      pricingType: pricingType || 'Paid',
      keyHighlights: Array.isArray(tool.features) ? tool.features : [],
      twitterUrl: tool.socialLinks?.twitter || undefined,
      githubUrl: tool.socialLinks?.github || undefined,
      status: (tool.status === 'published' ? 'approved' : (tool.status || 'pending')) as ToolSubmission['status'],
      submittedAt,
      updatedAt: tool.updatedAt || submittedAt,
    } as ToolSubmission;
  });
}

async function updateToolSubmissionStatus(
  token: string,
  submissionId: string,
  status: 'approved' | 'rejected'
): Promise<ToolSubmission> {
  const response = await fetch(`/api/tools/${submissionId}/status`, {
    method: 'PATCH',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    throw new Error('Failed to update tool submission status');
  }

  return response.json();
}

function transformToolData(data: SubmitToolData) {
  const pricingTypeMap: { [key: string]: string } = {
    Free: 'free',
    Freemium: 'freemium',
    Paid: 'paid',
    Enterprise: 'enterprise',
    'Contact for Pricing': 'enterprise'
  };

  return {
    name: data.toolName,
    description: data.description,
    websiteUrl: data.websiteUrl,
    logo: data.logoUrl,
    category: data.category,
    pricing: {
      type: pricingTypeMap[data.pricingType] || 'paid',
      startingPrice: undefined
    },
    features: data.keyHighlights,
    tags: [data.category],
    socialLinks: {
      twitter: data.twitterUrl || null,
      github: data.githubUrl || null
    }
  };
}

async function submitTool(data: SubmitToolData, token: string): Promise<ToolSubmission> {
  console.log('Submitting tool to:', `/api/tools`);
  const transformedData = transformToolData(data);
  console.log('Transformed submission data:', transformedData);

  const response = await fetch(`/api/tools`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
    },
    body: JSON.stringify(transformedData),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    console.error('Submission error:', {
      status: response.status,
      statusText: response.statusText,
      error: errorData
    });
    throw new Error(errorData?.error || 'Failed to submit tool');
  }

  const result = await response.json();
  console.log('Submission successful:', result);
  return result;
}

export function useToolSubmissions() {
  const { getToken } = useAuth();

  return useQuery({
    queryKey: ['tool-submissions'],
    queryFn: async () => {
      const token = await getToken();
      return getToolSubmissions(token);
    },
  });
}

export function useUpdateToolSubmissionStatus() {
  const { getToken } = useAuth();
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      submissionId,
      status
    }: {
      submissionId: string;
      status: 'approved' | 'rejected';
    }) => {
      const token = await getToken();
      return updateToolSubmissionStatus(token, submissionId, status);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tool-submissions'] });
    },
  });
}

export function useSubmitTool() {
  const { getToken } = useAuth();

  return useMutation({
    mutationFn: async (data: SubmitToolData) => {
      const token = await getToken();
      if (!token) {
        throw new Error('Authentication required');
      }
      return submitTool(data, token);
    }
  });
}
