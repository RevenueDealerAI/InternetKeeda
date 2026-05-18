import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { errorResponse } from '../../../../lib/auth';

export async function GET(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        const { userId } = await params;
        
        const fullUserId = userId.startsWith('user_') ? userId : `user_${userId}`;
        
        const client = await clerkClient();
        const user = await client.users.getUser(fullUserId);
        
        const activity = {
            lastSignInAt: user.lastSignInAt,
            createdAt: user.createdAt,
            updatedAt: user.updatedAt,
            lastActiveAt: user.lastActiveAt,
        };

        return NextResponse.json(activity);
    } catch (error: unknown) {
        console.error('Error fetching user activity:', error);
        return errorResponse('Failed to fetch user activity', 500);
    }
}

