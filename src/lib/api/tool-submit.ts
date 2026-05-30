/**
 * Public-facing tool submission hook. The marketing-site
 * "Submit your tool" modal calls this to POST a new Tool to
 * `/api/tools`, which sets it to status:'pending' for admin review
 * via /admin/moderation.
 *
 * Used to live in src/lib/api/submissions.ts alongside the admin
 * read/update endpoints — that file was deleted in the consolidate-
 * Submissions-into-Moderation refactor. Only the public submit
 * helper moves over here; the admin endpoints (useToolSubmissions,
 * useUpdateToolSubmissionStatus) were tied to unguarded routes and
 * are gone for good.
 */
import { useMutation } from "@tanstack/react-query";
import { useAuth } from "@clerk/clerk-react";

export interface SubmitToolData {
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

const PRICING_TYPE_MAP: Record<string, string> = {
  Free: "free",
  Freemium: "freemium",
  Paid: "paid",
  Enterprise: "enterprise",
  "Contact for Pricing": "enterprise",
};

function transformToolData(data: SubmitToolData) {
  return {
    name: data.toolName,
    description: data.description,
    websiteUrl: data.websiteUrl,
    logo: data.logoUrl,
    category: data.category,
    pricing: {
      type: PRICING_TYPE_MAP[data.pricingType] || "paid",
      startingPrice: undefined,
    },
    features: data.keyHighlights,
    tags: [data.category],
    socialLinks: {
      twitter: data.twitterUrl || null,
      github: data.githubUrl || null,
    },
  };
}

async function submitTool(data: SubmitToolData, token: string) {
  const transformed = transformToolData(data);
  const response = await fetch(`/api/tools`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(transformed),
  });
  if (!response.ok) {
    const errorData = await response.json().catch(() => null);
    throw new Error(errorData?.error || "Failed to submit tool");
  }
  return response.json();
}

export function useSubmitTool() {
  const { getToken } = useAuth();
  return useMutation({
    mutationFn: async (data: SubmitToolData) => {
      const token = await getToken();
      if (!token) throw new Error("Authentication required");
      return submitTool(data, token);
    },
  });
}
