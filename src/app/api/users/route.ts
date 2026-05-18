import { NextRequest, NextResponse } from 'next/server';
import { clerkClient } from '@clerk/nextjs/server';
import { errorResponse } from '../lib/auth';

export async function GET(req: NextRequest) {
    try {
        const client = await clerkClient();
        const { data: users } = await client.users.getUserList({
            orderBy: '-created_at',
            limit: 100,
        });
        
        const formattedUsers = users.map((user) => ({
            id: user.id,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Anonymous User',
            email: user.emailAddresses.length > 0 ? user.emailAddresses[0].emailAddress : 'No Email',
            role: (user.publicMetadata?.role as string) || 'user',
            status: (user.publicMetadata?.status as string) || 'active',
            lastActive: user.lastActiveAt || user.updatedAt,
            joinedAt: user.createdAt,
            avatarUrl: user.imageUrl
        }));

        return NextResponse.json(formattedUsers);
    } catch (error: unknown) {
        console.error('Error fetching users:', error);
        return errorResponse('Failed to fetch users', 500);
    }
}

