import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { getAuth, requireAuth, errorResponse } from '../../lib/auth';
import { BlogPost } from '../../models/BlogPost';
import { z } from 'zod';
import mongoose from 'mongoose';

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
});

function generateSlug(title: string): string {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
        .replace(/-+/g, '-');
}

function isValidObjectId(id: string): boolean {
    return mongoose.Types.ObjectId.isValid(id) && id.length === 24;
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ param: string }> }
) {
    try {
        await connectDB();
        const { param } = await params;

        let post;
        if (isValidObjectId(param)) {
            post = await BlogPost.findById(param);
        } else {
            post = await BlogPost.findOne({ slug: param });
        }

        if (!post) {
            return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
        }

        const auth = await getAuth();
        if (post.status !== 'published' && !auth?.id) {
            return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
        }

        return NextResponse.json(post);
    } catch (error: unknown) {
        console.error('Error fetching blog post:', error);
        return errorResponse('Failed to fetch blog post', 500);
    }
}

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ param: string }> }
) {
    try {
        await connectDB();
        await requireAuth();
        
        const { param } = await params;
        
        if (!isValidObjectId(param)) {
            return NextResponse.json({ error: 'Invalid blog post ID' }, { status: 400 });
        }
        
        const body = await req.json();
        const validatedData = blogPostSchema.partial().parse(body);

        if (validatedData.title) {
            const newSlug = generateSlug(validatedData.title);
            const existingPost = await BlogPost.findOne({
                slug: newSlug,
                _id: { $ne: param }
            });

            if (existingPost) {
                const randomSuffix = Math.floor(Math.random() * 1000);
                validatedData.slug = `${newSlug}-${randomSuffix}`;
            } else {
                validatedData.slug = newSlug;
            }
        }

        const updatedPost = await BlogPost.findByIdAndUpdate(
            param,
            { ...validatedData, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!updatedPost) {
            return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
        }

        return NextResponse.json(updatedPost);
    } catch (error: unknown) {
        console.error('Error updating blog post:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return errorResponse('Failed to update blog post', 500);
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ param: string }> }
) {
    try {
        await connectDB();
        await requireAuth();
        
        const { param } = await params;

        if (!isValidObjectId(param)) {
            return NextResponse.json({ error: 'Invalid blog post ID' }, { status: 400 });
        }

        const post = await BlogPost.findByIdAndDelete(param);

        if (!post) {
            return NextResponse.json({ error: 'Blog post not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Blog post deleted successfully' });
    } catch (error: unknown) {
        console.error('Error deleting blog post:', error);
        return errorResponse('Failed to delete blog post', 500);
    }
}
