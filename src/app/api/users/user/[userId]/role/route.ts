import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { requireAuth, errorResponse } from '../../../../lib/auth';
import { z } from 'zod';

const userRoleSchema = z.object({
  userId: z.string(),
  role: z.enum(['admin', 'user']),
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
        const validatedData = userRoleSchema.parse(body);
        
        const fullUserId = userId.startsWith('user_') ? userId : `user_${userId}`;
        
        const client = await clerkClient();
        const user = await client.users.getUser(fullUserId);
        
        const updateData = {
            publicMetadata: {
                ...user.publicMetadata,
                role: validatedData.role,
                roleUpdatedAt: new Date().toISOString(),
                roleUpdateReason: validatedData.reason
            }
        };

        await client.users.updateUser(fullUserId, updateData);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Error updating user role:', error);
        return errorResponse('Failed to update user role', 500);
    }
}

