import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { errorResponse } from '../../lib/auth';
import { Tool } from '../../models/Tool';

export async function GET(req: NextRequest) {
    try {
        await connectDB();

        const stats = await Promise.all([
            Tool.countDocuments({ status: 'published' }),
            Tool.countDocuments({ status: 'pending' }),
            Tool.aggregate([
                { $match: { status: 'published' } },
                { $group: { _id: '$category', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            Tool.find({ status: 'published' })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('name category createdAt slug _id')
                .lean(),
            Tool.find({ status: 'published' })
                .sort({ views: -1 })
                .limit(5)
                .select('name views slug _id')
                .lean(),
            Tool.aggregate([
                { $group: { _id: '$status', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            Tool.aggregate([
                { $match: { status: 'published' } },
                { $group: { _id: '$pricing.type', count: { $sum: 1 } } },
                { $sort: { count: -1 } }
            ]),
            // Recent pending submissions — surface the moderation queue
            // directly on the admin dashboard so admins don't have to
            // navigate to /admin/submissions to see what's waiting.
            Tool.find({ status: 'pending' })
                .sort({ createdAt: -1 })
                .limit(5)
                .select('name category createdAt slug _id ownerUserId')
                .lean()
        ]);

        return NextResponse.json(
            {
                totalTools: stats[0],
                pendingSubmissions: stats[1],
                categoryCounts: stats[2],
                recentTools: stats[3],
                popularTools: stats[4],
                statusCounts: stats[5],
                pricingCounts: stats[6],
                recentSubmissions: stats[7],
            },
            {
                headers: {
                    // Admin dashboard view; 30s of staleness is fine
                    // and saves a 7-aggregation hit on every render.
                    'Cache-Control': 'private, max-age=30, stale-while-revalidate=120',
                },
            }
        );
    } catch (error: unknown) {
        console.error('Error fetching dashboard stats:', error);
        return errorResponse('Failed to fetch dashboard statistics', 500);
    }
}

