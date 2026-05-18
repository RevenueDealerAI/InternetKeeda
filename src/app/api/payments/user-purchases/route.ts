import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { requireAuth, errorResponse, unauthorizedResponse } from '../../lib/auth';
import { AdvertisingPurchase } from '../../models/AdvertisingPurchase';

export async function GET(req: NextRequest) {
  try {
    await connectDB();
    
    // requireAuth() reads Clerk session from cookies automatically
    const auth = await requireAuth();
    const userId = auth.userId;
    
    if (!userId) {
      return unauthorizedResponse('User not authenticated');
    }
    
    const purchases = await AdvertisingPurchase.find({ userId })
      .sort({ createdAt: -1 })
      .lean();
    
    return NextResponse.json(purchases);
  } catch (error: unknown) {
    if (error instanceof Error && error.message === 'Unauthorized') {
      return unauthorizedResponse('User not authenticated');
    }
    
    console.error('Error fetching user purchases:', error);
    return errorResponse('Failed to fetch purchases', 500);
  }
}

