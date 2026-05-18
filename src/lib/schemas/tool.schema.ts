import { z } from "zod";

export const TOOL_CATEGORIES = [
  "Writing & Content Creation",
  "Image Generation & Editing", 
  "Video Creation & Editing",
  "Code & Development",
  "Productivity & Automation",
  "Business & Marketing",
  "Research & Analysis",
  "Communication & Chat",
  "Education & Learning",
  "Design & Creative",
  "Audio & Music",
  "Data & Analytics",
  "Social Media",
  "SEO & Web",
  "Healthcare & Wellness",
  "Finance & Trading",
  "Gaming & Entertainment",
  "Translation & Language",
  "Other"
] as const;

export const COMMON_TAGS = new Set([
  "AI",
  "Machine Learning",
  "GPT",
  "Neural Networks",
  "Deep Learning",
  "NLP",
  "Computer Vision",
  "Automation",
  "No-Code",
  "API",
]);

export const toolSchema = z.object({
  name: z.string().min(1, "Name is required"),
  slug: z.string().optional(),
  description: z.string().min(1, "Description is required"),
  websiteUrl: z.string().url("Invalid URL"),
  category: z.string().min(1, "Category is required"),
  tags: z.array(z.string()),
  pricing: z.object({
    type: z.enum(["free", "freemium", "paid", "enterprise"]),
    startingPrice: z.number().optional(),
  }),
  features: z.array(z.string()).min(1, "Add at least one feature"),
  logo: z.string().url("Invalid URL").optional().or(z.literal("")),
  status: z.enum(["draft", "published", "archived"]),
  isTrending: z.boolean().default(false),
  isNew: z.boolean().default(false),
  isUpcoming: z.boolean().default(false),
  isTopRated: z.boolean().default(false),
});

export type ToolFormData = z.infer<typeof toolSchema>; 