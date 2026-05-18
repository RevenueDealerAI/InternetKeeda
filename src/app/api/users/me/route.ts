import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { requireAuth, errorResponse } from '../../lib/auth';
import { User } from '../../models/User';
import { z } from 'zod';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const auth = await requireAuth();

        const user = await User.findOne({ clerkId: auth.userId });

        if (!user) {
            return NextResponse.json({ error: 'User not found' }, { status: 404 });
        }

        return NextResponse.json(user);
    } catch (error: unknown) {
        console.error('Error fetching user profile:', error);
        return errorResponse('Failed to fetch user profile', 500);
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const auth = await requireAuth();

        const body = await req.json();
        const profileData = z.object({
            userId: z.string(),
            firstName: z.string().optional(),
            lastName: z.string().optional(),
            email: z.string().email().optional(),
            username: z.string().optional(),
            profileImageUrl: z.string().url().optional(),
            publicMetadata: z.record(z.any()).optional(),
        }).parse(body);

        if (profileData.userId !== auth.userId) {
            return NextResponse.json({ error: 'You can only update your own profile' }, { status: 403 });
        }

        let user = await User.findOne({ clerkId: auth.userId });

        if (user) {
            user.firstName = profileData.firstName || user.firstName;
            user.lastName = profileData.lastName || user.lastName;
            user.email = profileData.email || user.email;
            user.username = profileData.username || user.username;
            user.profileImageUrl = profileData.profileImageUrl || user.profileImageUrl;
            user.publicMetadata = profileData.publicMetadata || user.publicMetadata;
            user.updatedAt = new Date();
        } else {
            const userData = {
                clerkId: auth.userId,
                firstName: profileData.firstName || '',
                lastName: profileData.lastName || '',
                email: profileData.email || '',
                username: profileData.username || '',
                profileImageUrl: profileData.profileImageUrl || '',
                publicMetadata: profileData.publicMetadata || {},
                upvotedTools: [],
                savedTools: [],
                submittedTools: [],
                createdAt: new Date(),
                updatedAt: new Date(),
            };
            
            user = new User(userData);
        }

        await user.save();
        return NextResponse.json(user);
    } catch (error: unknown) {
        console.error('Error updating user profile:', error);
        
        if (error instanceof z.ZodError) {
            return NextResponse.json({ error: error.errors }, { status: 400 });
        }
        
        return errorResponse('Failed to update user profile', 500);
    }
}

