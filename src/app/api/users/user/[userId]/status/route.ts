import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { requireAuth, errorResponse } from '../../../../lib/auth';
import { z } from 'zod';

const userStatusSchema = z.object({
  userId: z.string(),
  status: z.enum(['active', 'suspended', 'banned']),
  reason: z.string().min(1),
});

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        await requireAuth();
        
        const { userId } = await params;
        const body = await req.json();
        const validatedData = userStatusSchema.parse(body);
        
        const fullUserId = userId.startsWith('user_') ? userId : `user_${userId}`;
        
        const client = await clerkClient();
        const user = await client.users.getUser(fullUserId);
        
        const updateData = {
            publicMetadata: {
                ...user.publicMetadata,
                status: validatedData.status,
                statusUpdatedAt: new Date().toISOString(),
                statusUpdateReason: validatedData.reason
            }
        };

        await client.users.updateUser(fullUserId, updateData);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Error updating user status:', error);
        return errorResponse('Failed to update user status', 500);
    }
}

