import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { requireAuth, errorResponse } from '../../../lib/auth';
import { NewsPost } from '../../../models/NewsPost';
import mongoose from 'mongoose';

function isValidObjectId(id: string): boolean {
    return mongoose.Types.ObjectId.isValid(id) && id.length === 24;
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
        const { views, shares } = body;
        const updateData: Record<string, unknown> = {};

        if (views !== undefined) {
            updateData.views = views;
        }

        if (shares !== undefined) {
            updateData.shares = shares;
        }

        if (Object.keys(updateData).length === 0) {
            return NextResponse.json({ error: 'No stats provided to update' }, { status: 400 });
        }

        const post = await NewsPost.findByIdAndUpdate(
            param,
            updateData,
            { new: true }
        );

        if (!post) {
            return NextResponse.json({ error: 'News post not found' }, { status: 404 });
        }

        return NextResponse.json(post);
    } catch (error: unknown) {
        console.error('Error updating post stats:', error);
        return errorResponse('Failed to update post stats', 500);
    }
}

