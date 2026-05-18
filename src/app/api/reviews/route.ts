import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../lib/db';
import { requireAuth, errorResponse } from '../lib/auth';
import { Review } from '../models/Review';
import { Tool } from '../models/Tool';
import { clerkClient } from '@clerk/nextjs/server';

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

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        
        const searchParams = req.nextUrl.searchParams;
        const page = parseInt(searchParams.get('page') || '1');
        const limit = parseInt(searchParams.get('limit') || '10');
        const skip = (page - 1) * limit;
        
        const status = searchParams.get('status') || 'approved';
        const toolId = searchParams.get('toolId');
        
        const query: Record<string, string> = {};
        
        if (status === 'all' && searchParams.get('isAdmin') === 'true') {
            // Show all reviews for admin
        } else if (status !== 'all') {
            query.status = status;
        }
        
        if (toolId) {
            query.toolId = toolId;
        }
        
        const reviews = await Review.find(query)
            .sort({ createdAt: -1 })
            .skip(skip)
            .limit(limit);
        
        const reviewsWithToolInfo = await Promise.all(
            reviews.map(async (review) => {
                try {
                    const tool = await Tool.findById(review.toolId);
                    return {
                        ...review.toObject(),
                        toolName: tool?.name || 'Unknown Tool',
                        toolSlug: tool?.slug || ''
                    };
                } catch (error) {
                    return {
                        ...review.toObject(),
                        toolName: 'Unknown Tool',
                        toolSlug: ''
                    };
                }
            })
        );
        
        const total = await Review.countDocuments(query);
        
        return NextResponse.json({
            reviews: reviewsWithToolInfo,
            pagination: {
                total,
                page,
                pages: Math.ceil(total / limit)
            }
        });
    } catch (error: unknown) {
        console.error('Error fetching reviews:', error);
        return errorResponse('Failed to fetch reviews', 500);
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const auth = await requireAuth();
        
        const body = await req.json();
        const { toolId, rating, comment } = body;
        
        const client = await clerkClient();
        const user = await client.users.getUser(auth.userId);
        
        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }
        
        if (!toolId || !rating || !comment) {
            return NextResponse.json({ error: 'ToolId, rating and comment are required' }, { status: 400 });
        }
        
        const tool = await Tool.findById(toolId);
        if (!tool) {
            return NextResponse.json({ error: 'Tool not found' }, { status: 404 });
        }
        
        const existingReview = await Review.findOne({ toolId, userId: auth.userId });
        if (existingReview) {
            return NextResponse.json({ error: 'You have already reviewed this tool' }, { status: 400 });
        }
        
        const newReview = await Review.create({
            toolId,
            userId: auth.userId,
            userName: `${user.firstName} ${user.lastName}`.trim() || user.username || 'User',
            userAvatar: user.imageUrl || '',
            rating,
            comment,
            status: 'pending'
        });
        
        return NextResponse.json(newReview, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating review:', error);
        return errorResponse('Failed to create review', 500);
    }
}

