import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { requireAuth, errorResponse } from '../../../lib/auth';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        await requireAuth();
        
        const { userId } = await params;
        const fullUserId = userId.startsWith('user_') ? userId : `user_${userId}`;
        
        const client = await clerkClient();
        
        await client.users.deleteUser(fullUserId);

        return NextResponse.json({ success: true, message: 'User deleted successfully' });
    } catch (error: unknown) {
        console.error('Error deleting user:', error);
        return errorResponse('Failed to delete user', 500);
    }
}

