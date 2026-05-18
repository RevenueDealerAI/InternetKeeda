import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../lib/db';
import { requireAuth, getAuth, errorResponse } from '../lib/auth';
import { BlogPost } from '../models/BlogPost';
import { z } from 'zod';

const blogPostSchema = z.object({
    title: z.string().min(2, "Title must be at least 2 characters"),
    excerpt: z.string().min(10, "Excerpt must be at least 10 characters"),
    content: z.string().min(50, "Content must be at least 50 characters"),
    category: z.string().min(1, "Please select a category"),
    readTime: z.string().min(1, "Read time is required"),
    imageUrl: z.string().url("Please enter a valid image URL"),
    tags: z.array(z.string()).min(1, "Add at least one tag"),
    status: z.enum(["draft", "published"]).default("draft"),
    slug: z.string().optional(),
    date: z.string().optional(),
    author: z.object({
        name: z.string().optional(),
        avatar: z.string().optional(),
    }).optional(),
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

        const posts = await BlogPost.find().sort({ createdAt: -1 });

        return NextResponse.json(posts);
    } catch (error: unknown) {
        console.error('Error fetching blog posts:', error);
        return errorResponse('Failed to fetch blog posts', 500);
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        await requireAuth();

        const body = await req.json();
        const validatedData = blogPostSchema.parse(body);

        let slug = validatedData.slug;
        if (!slug && validatedData.title) {
            slug = generateSlug(validatedData.title);
            const existingPost = await BlogPost.findOne({ slug });

            if (existingPost) {
                const randomSuffix = Math.floor(Math.random() * 1000);
                slug = `${slug}-${randomSuffix}`;
            }
        }

        const auth = await getAuth();
        const userId = auth?.id;

        const post = await BlogPost.create({
            ...validatedData,
            slug,
            date: validatedData.date || new Date().toISOString(),
            createdAt: new Date(),
            updatedAt: new Date(),
            author: {
                name: validatedData.author?.name || 'AI Hunt Admin',
                avatar: validatedData.author?.avatar || 'https://ui-avatars.com/api/?name=Admin&background=random',
                userId: userId || 'system'
            }
        });

        return NextResponse.json(post, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating blog post:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({
                error: 'Validation failed',
                details: error.errors
            }, { status: 400 });
        }
        return errorResponse('Failed to create blog post', 500);
    }
}

