import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { requireAuth, errorResponse } from '../../../../lib/auth';

const ADMIN_EMAIL_DOMAINS = ["internetkeeda.com"];

function isAdminEmail(email: string) {
    return ADMIN_EMAIL_DOMAINS.some(domain => email.endsWith(`@${domain}`));
}

export async function POST(
    req: NextRequest,
    { params }: { params: Promise<{ userId: string }> }
) {
    try {
        await requireAuth();
        
        const { userId } = await params;
        const fullUserId = userId.startsWith('user_') ? userId : `user_${userId}`;
        
        const client = await clerkClient();
        const user = await client.users.getUser(fullUserId);
        
        const hasAuthorizedEmail = user.emailAddresses.some(email => 
            isAdminEmail(email.emailAddress)
        );

        if (!hasAuthorizedEmail) {
            return NextResponse.json({ 
                error: "User email domain not authorized for admin role" 
            }, { status: 403 });
        }

        const updateData = {
            publicMetadata: {
                ...user.publicMetadata,
                role: 'admin',
                roleUpdatedAt: new Date().toISOString()
            }
        };

        await client.users.updateUser(fullUserId, updateData);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        console.error('Error setting admin role:', error);
        return errorResponse('Failed to set admin role', 500);
    }
}

