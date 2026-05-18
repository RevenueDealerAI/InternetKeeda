import { NextApiRequest, NextApiResponse } from 'next';
import { clerkClient } from '@clerk/nextjs/server';
import { getAuth } from '@clerk/nextjs/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId } = getAuth(req);
    if (!userId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify admin role
    const admin = await (await clerkClient()).users.getUser(userId);
    if (admin.publicMetadata?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Requires admin role' });
    }

    const client = await clerkClient();
    const { data: users } = await client.users.getUserList({
      limit: 100,
      orderBy: '-created_at',
    });

    const formattedUsers = users.map(user => ({
      id: user.id,
      name: `${user.firstName} ${user.lastName}`,
      email: user.emailAddresses[0]?.emailAddress || '',
      role: (user.publicMetadata?.role as string) || 'user',
      status: (user.publicMetadata?.status as string) || 'active',
      lastActive: user.lastSignInAt || user.createdAt,
      joinedAt: user.createdAt,
      avatarUrl: user.imageUrl,
    }));

    return res.status(200).json(formattedUsers);
  } catch (error) {
    console.error('Error in users API:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 