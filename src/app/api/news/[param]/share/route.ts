import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { errorResponse } from '../../../lib/auth';
import { NewsPost } from '../../../models/NewsPost';
import mongoose from 'mongoose';

function isValidObjectId(id: string): boolean {
    return mongoose.Types.ObjectId.isValid(id) && id.length === 24;
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ param: string }> }
) {
    try {
        await connectDB();
        const { param } = await params;

        if (!isValidObjectId(param)) {
            return NextResponse.json({ error: 'Invalid news post ID' }, { status: 400 });
        }

        const post = await NewsPost.findByIdAndUpdate(
            param,
            { $inc: { shares: 1 } },
            { new: true }
        );

        if (!post) {
            return NextResponse.json({ error: 'News post not found' }, { status: 404 });
        }

        return NextResponse.json(post);
    } catch (error: unknown) {
        console.error('Error incrementing shares:', error);
        return errorResponse('Failed to increment shares', 500);
    }
}

