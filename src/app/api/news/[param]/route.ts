import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { getAuth, requireAuth, errorResponse } from '../../lib/auth';
import { NewsPost } from '../../models/NewsPost';
import { z } from 'zod';
import mongoose from 'mongoose';

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
            post = await NewsPost.findById(param);
        } else {
            post = await NewsPost.findOne({ slug: param });
        }

        if (!post) {
            return NextResponse.json({ error: 'News post not found' }, { status: 404 });
        }

        const auth = await getAuth();
        if (post.status !== 'published' && !auth?.id) {
            return NextResponse.json({ error: 'News post not found' }, { status: 404 });
        }

        await NewsPost.findByIdAndUpdate(post._id, { $inc: { views: 1 } });

        return NextResponse.json(post);
    } catch (error: unknown) {
        console.error('Error fetching news post:', error);
        return errorResponse('Failed to fetch news post', 500);
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
            return NextResponse.json({ error: 'Invalid news post ID' }, { status: 400 });
        }

        const body = await req.json();
        const validatedData = newsPostSchema.partial().parse(body);

        let newSlug: string | undefined;

        if (validatedData.slug) {
            newSlug = validatedData.slug;
        } else if (validatedData.title) {
            newSlug = generateSlug(validatedData.title);
        }

        if (newSlug) {
            const existingPost = await NewsPost.findOne({
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

        if (validatedData.author) {
            if (!validatedData.author.name || !validatedData.author.avatar) {
                const currentPost = await NewsPost.findById(param);
                if (currentPost) {
                    validatedData.author = {
                        name: validatedData.author.name || currentPost.author.name,
                        avatar: validatedData.author.avatar || currentPost.author.avatar
                    };
                }
            }
        }

        const updatedPost = await NewsPost.findByIdAndUpdate(
            param,
            { ...validatedData, updatedAt: new Date() },
            { new: true, runValidators: true }
        );

        if (!updatedPost) {
            return NextResponse.json({ error: 'News post not found' }, { status: 404 });
        }

        return NextResponse.json(updatedPost);
    } catch (error: unknown) {
        console.error('Error updating news post:', error);
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        return errorResponse('Failed to update news post', 500);
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
            return NextResponse.json({ error: 'Invalid news post ID' }, { status: 400 });
        }

        const post = await NewsPost.findByIdAndDelete(param);

        if (!post) {
            return NextResponse.json({ error: 'News post not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'News post deleted successfully' });
    } catch (error: unknown) {
        console.error('Error deleting news post:', error);
        return errorResponse('Failed to delete news post', 500);
    }
}
