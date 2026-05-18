import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../lib/db';
import { requireAuth, errorResponse } from '../lib/auth';
import { ToolSubmission } from '../models/ToolSubmission';
import { z } from 'zod';

const toolSubmissionSchema = z.object({
  toolName: z.string().min(2, "Tool name must be at least 2 characters"),
  description: z.string().min(10, "Description must be at least 10 characters"),
  websiteUrl: z.string().url("Please enter a valid website URL"),
  logoUrl: z.string().url("Please enter a valid logo URL"),
  category: z.string().min(1, "Category is required"),
  pricingType: z.string().min(1, "Pricing type is required"),
  keyHighlights: z.array(z.string()).min(1, "At least one key highlight is required"),
  twitterUrl: z.string().url("Please enter a valid Twitter URL").optional(),
  githubUrl: z.string().url("Please enter a valid GitHub URL").optional(),
});

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const submissions = await ToolSubmission.find().sort({ submittedAt: -1 });
        return NextResponse.json(submissions);
    } catch (error: unknown) {
        console.error('Error fetching tool submissions:', error);
        return errorResponse('Failed to fetch tool submissions', 500);
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const validatedData = toolSubmissionSchema.parse(body);
        const submission = await ToolSubmission.create(validatedData);
        return NextResponse.json(submission, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating tool submission:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return errorResponse('Failed to create tool submission', 500);
    }
}

