import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { errorResponse } from '../../../lib/auth';
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

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ toolId: string }> }
) {
    try {
        await connectDB();
        const { toolId } = await params;
        
        if (!toolId) {
            return NextResponse.json({ error: 'Tool ID is required' }, { status: 400 });
        }
        
        await updateToolRating(toolId);
        
        const tool = await Tool.findById(toolId);
        
        if (!tool) {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
        }
        
        return NextResponse.json({ 
            message: 'Tool ratings refreshed successfully',
            toolId: tool._id,
            rating: tool.rating,
            reviews: tool.reviews 
        });
    } catch (error: unknown) {
        console.error('Error refreshing tool ratings:', error);
        return errorResponse('Failed to refresh tool ratings', 500);
    }
}

