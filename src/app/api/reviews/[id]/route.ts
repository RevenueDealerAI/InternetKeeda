import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { requireAuth, errorResponse } from '../../lib/auth';
import { Review } from '../../models/Review';
import { Tool } from '../../models/Tool';
import { User } from '../../models/User';

async function isUserAdmin(clerkUserId: string): Promise<boolean> {
    const u = await User.findOne({ clerkId: clerkUserId }).select('isAdmin').lean<{ isAdmin?: boolean }>();
    return !!u?.isAdmin;
}

async function updateToolRating(toolId: string) {
    try {
        const reviews = await Review.find({ 
            toolId, 
            status: 'approved' 
        });
        
        const totalRating = reviews.reduce((sum, review) => sum + review.rating, 0);
        const averageRating = reviews.length > 0 ? totalRating / reviews.length : 0;
        
        await Tool.findByIdAndUpdate(toolId, {
            rating: parseFloat(averageRating.toFixed(1)),
            reviews: reviews.length
        }, { new: true });
    } catch (error) {
        console.error('Error updating tool rating:', error);
    }
}

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const { id } = await params;
        
        const review = await Review.findById(id);
        
        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }
        
        let reviewWithToolInfo;
        try {
            const tool = await Tool.findById(review.toolId);
            reviewWithToolInfo = {
                ...review.toObject(),
                toolName: tool?.name || 'Unknown Tool',
                toolSlug: tool?.slug || ''
            };
        } catch (error) {
            reviewWithToolInfo = {
                ...review.toObject(),
                toolName: 'Unknown Tool',
                toolSlug: ''
            };
        }
        
        return NextResponse.json(reviewWithToolInfo);
    } catch (error: unknown) {
        console.error('Error fetching review:', error);
        return errorResponse('Failed to fetch review', 500);
    }
}

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const auth = await requireAuth();
        
        const { id } = await params;
        const body = await req.json();
        const { rating, comment } = body;
        
        const review = await Review.findById(id);
        
        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }

        const admin = review.userId !== auth.userId ? await isUserAdmin(auth.userId) : false;

        if (review.userId !== auth.userId && !admin) {
            return NextResponse.json(
                { error: 'Not authorized to update this review' },
                { status: 403 }
            );
        }
        
        if (rating) review.rating = rating;
        if (comment) review.comment = comment;
        
        review.status = 'pending';
        review.updatedAt = new Date();
        
        await review.save();
        
        return NextResponse.json(review);
    } catch (error: unknown) {
        console.error('Error updating review:', error);
        return errorResponse('Failed to update review', 500);
    }
}

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        const auth = await requireAuth();
        
        const { id } = await params;
        
        const review = await Review.findById(id);
        
        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }
        
        const admin = review.userId !== auth.userId ? await isUserAdmin(auth.userId) : false;

        if (review.userId !== auth.userId && !admin) {
            return NextResponse.json({ error: 'Not authorized to delete this review' }, { status: 403 });
        }
        
        const toolId = review.toolId.toString();
        const wasApproved = review.status === 'approved';
        
        await Review.findByIdAndDelete(id);
        
        if (wasApproved) {
            await updateToolRating(toolId);
        }
        
        return NextResponse.json({ message: 'Review deleted successfully' });
    } catch (error: unknown) {
        console.error('Error deleting review:', error);
        return errorResponse('Failed to delete review', 500);
    }
}

