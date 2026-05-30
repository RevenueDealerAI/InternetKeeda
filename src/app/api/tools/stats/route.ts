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
            // Reserved slot — was `recentSubmissions` (5 most recent
            // pending tools). Removed when the admin dashboard moved
            // that surface to the guarded /api/admin/tools/pending
            // endpoint so pending-queue identifiers stop leaking via
            // this public endpoint. Kept as a no-op aggregate to
            // preserve stats[7] indexing for any old consumer.
            Promise.resolve([])
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
                // recentSubmissions removed — moved behind admin auth
                // at /api/admin/tools/pending. Keeping the response
                // shape forward-compatible: callers that destructure
                // stats[7] would have already broken when we made the
                // dashboard use the guarded endpoint.
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

