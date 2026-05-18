import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../lib/db';
import { requireAuth, errorResponse } from '../lib/auth';
import { NewsPost } from '../models/NewsPost';
import { z } from 'zod';

const newsPostSchema = z.object({
    title: z.string().min(2, "Title must be at least 2 characters"),
    excerpt: z.string().min(10, "Excerpt must be at least 10 characters"),
    content: z.string().min(50, "Content must be at least 50 characters"),
    category: z.string().min(1, "Please select a category"),
    imageUrl: z.string().url("Please enter a valid image URL"),
    tags: z.array(z.string()).min(1, "Add at least one tag"),
    status: z.enum(["draft", "published"]).default("draft"),
    source: z.string().min(1, "Source is required"),
    sourceUrl: z.string().url("Please enter a valid source URL"),
    author: z.object({
        name: z.string().min(2, "Author name must be at least 2 characters"),
        avatar: z.string().url("Please enter a valid avatar URL"),
    }),
    slug: z.string().optional(),
    date: z.string().optional(),
});

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-+/g, '-');
}

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const posts = await NewsPost.find().sort({ createdAt: -1 });

        return NextResponse.json(posts);
    } catch (error: unknown) {
        console.error('Error fetching news posts:', error);
        return errorResponse('Failed to fetch news posts', 500);
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        await requireAuth();

        const body = await req.json();
        const validatedData = newsPostSchema.parse(body);

        const slug = validatedData.slug || generateSlug(validatedData.title);
        const existingPost = await NewsPost.findOne({ slug });

        const finalSlug = existingPost
            ? `${slug}-${Math.floor(Math.random() * 1000)}`
            : slug;

        const post = await NewsPost.create({
            ...validatedData,
            slug: finalSlug,
            date: new Date().toISOString(),
            views: 0,
            shares: 0,
        });

        return NextResponse.json(post, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating news post:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return errorResponse('Failed to create news post', 500);
    }
}

