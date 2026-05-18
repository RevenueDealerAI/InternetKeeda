import { NextApiRequest, NextApiResponse } from 'next';
import { clerkClient, getAuth } from '@clerk/nextjs/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { userId: adminId } = getAuth(req);
    if (!adminId) {
      return res.status(401).json({ error: 'Unauthorized' });
    }

    // Verify admin role
    const admin = await (await clerkClient()).users.getUser(adminId);
    if (admin.publicMetadata?.role !== 'admin') {
      return res.status(403).json({ error: 'Forbidden: Requires admin role' });
    }

    const { userId } = req.query;
    if (!userId || typeof userId !== 'string') {
      return res.status(400).json({ error: 'Invalid user ID' });
    }

    const user = await (await clerkClient()).users.getUser(userId);
    const activities = (user.privateMetadata?.activities || []) as Array<Record<string, unknown>>;

    return res.status(200).json(activities);
  } catch (error) {
    console.error('Error fetching user activity:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 