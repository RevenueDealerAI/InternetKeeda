import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { requireAuth, errorResponse } from '../../../lib/auth';
import { User } from '../../../models/User';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const auth = await requireAuth();

        const user = await User.findOne({ clerkId: auth.userId });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json([]);
    } catch (error: unknown) {
        console.error('Error fetching user tools:', error);
        return errorResponse('Failed to fetch user tools', 500);
    }
}

