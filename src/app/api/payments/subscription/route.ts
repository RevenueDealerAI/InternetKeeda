import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { requireAuth, errorResponse } from '../../lib/auth';
import { Subscription } from '../../models/Subscription';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const auth = await requireAuth();
        
        const subscriptions = await Subscription.find({ 
            userId: auth.userId, 
            status: 'active' 
        }).sort({ createdAt: -1 }).limit(1);
        
        const subscription = subscriptions[0] || null;
        
        if (!subscription) {
            return NextResponse.json({ hasActiveSubscription: false });
        }
        
        return NextResponse.json({
            hasActiveSubscription: true,
            subscription
        });
    } catch (error: unknown) {
        console.error('Error fetching subscription:', error);
        return errorResponse('Failed to fetch subscription', 500);
    }
}

