import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { errorResponse } from '../../lib/auth';
import { NewsletterSubscription } from '../../models/NewsletterSubscription';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        
        const totalSubscriptions = await NewsletterSubscription.countDocuments();
        const activeSubscriptions = await NewsletterSubscription.countDocuments({ status: 'active' });
        const unsubscribedCount = await NewsletterSubscription.countDocuments({ status: 'unsubscribed' });
        
        const bySource = await NewsletterSubscription.aggregate([
            { $group: { _id: '$source', count: { $sum: 1 } } }
        ]);
        
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const recentSubscriptions = await NewsletterSubscription.countDocuments({
            subscribedAt: { $gte: thirtyDaysAgo },
            status: 'active'
        });

        return NextResponse.json({
            total: totalSubscriptions,
            active: activeSubscriptions,
            unsubscribed: unsubscribedCount,
            recent: recentSubscriptions,
            bySource: bySource.reduce((acc: Record<string, number>, item) => {
                acc[item._id] = item.count;
                return acc;
            }, {})
        });
    } catch (error: unknown) {
        console.error('Error fetching newsletter statistics:', error);
        return errorResponse('Failed to fetch newsletter statistics', 500);
    }
}

