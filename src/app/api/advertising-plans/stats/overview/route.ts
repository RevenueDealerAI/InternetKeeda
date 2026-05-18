import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { errorResponse } from '../../../lib/auth';
import { AdvertisingPlan } from '../../../models/AdvertisingPlan';
import { AdvertisingPurchase } from '../../../models/AdvertisingPurchase';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        
        const [
            totalPlans,
            activePlans,
            totalPurchases,
            activePurchases,
            totalRevenue
        ] = await Promise.all([
            AdvertisingPlan.countDocuments(),
            AdvertisingPlan.countDocuments({ isActive: true }),
            AdvertisingPurchase.countDocuments(),
            AdvertisingPurchase.countDocuments({ status: 'active' }),
            AdvertisingPurchase.aggregate([
                { $match: { status: { $in: ['active', 'expired'] } } },
                { $group: { _id: null, total: { $sum: '$amount' } } }
            ])
        ]);

        const purchasesByPlan = await AdvertisingPurchase.aggregate([
            { $group: { _id: '$planName', count: { $sum: 1 }, revenue: { $sum: '$amount' } } },
            { $sort: { count: -1 } }
        ]);

        return NextResponse.json({
            totalPlans,
            activePlans,
            totalPurchases,
            activePurchases,
            totalRevenue: totalRevenue[0]?.total || 0,
            purchasesByPlan
        });
    } catch (error: unknown) {
        console.error('Error fetching advertising statistics:', error);
        return errorResponse('Failed to fetch advertising statistics', 500);
    }
}

