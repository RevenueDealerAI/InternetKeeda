import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { errorResponse } from '../../../lib/auth';
import { requireAdmin } from '@/lib/auth/admin';
import { Review } from '../../../models/Review';
import { Tool } from '../../../models/Tool';

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

export async function PUT(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        const a = await requireAdmin();
        if (a.kind !== 'ok') {
            return NextResponse.json(
                { error: a.kind },
                { status: a.kind === 'unauthenticated' ? 401 : 403 },
            );
        }
        await connectDB();

        const { id } = await params;
        const body = await req.json();
        const { status, adminResponse } = body;

        const review = await Review.findById(id);
        
        if (!review) {
            return NextResponse.json({ error: 'Review not found' }, { status: 404 });
        }
        
        const prevStatus = review.status;
        
        if (status) review.status = status;
        if (adminResponse) review.adminResponse = adminResponse;
        review.updatedAt = new Date();
        
        await review.save();
        
        if (status === 'approved' || prevStatus === 'approved') {
            await updateToolRating(review.toolId.toString());
        }
        
        return NextResponse.json(review);
    } catch (error: unknown) {
        console.error('Error moderating review:', error);
        return errorResponse('Failed to moderate review', 500);
    }
}

