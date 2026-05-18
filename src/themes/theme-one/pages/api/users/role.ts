import { NextApiRequest, NextApiResponse } from 'next';
import { clerkClient, getAuth } from '@clerk/nextjs/server';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'PATCH') {
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

    const { userId, role, reason } = req.body;
    if (!userId || !role || !reason) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    // Update user role
    const user = await (await clerkClient()).users.updateUser(userId, {
      publicMetadata: {
        role,
        roleUpdatedAt: new Date().toISOString(),
        roleUpdateReason: reason,
      },
    });

    // Add activity to user's private metadata
    interface UserActivity {
      id: string;
      type: string;
      description: string;
      timestamp: string;
    }
    const currentActivities = (user.privateMetadata?.activities || []) as UserActivity[];
    await (await clerkClient()).users.updateUser(userId, {
      privateMetadata: {
        activities: [
          {
            id: `act_${Date.now()}`,
            type: 'role_change',
            description: `Role changed to ${role}`,
            metadata: { previousRole: user.publicMetadata?.role, newRole: role, reason },
            timestamp: new Date().toISOString(),
          },
          ...currentActivities.slice(0, 99),
        ],
      },
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('Error updating user role:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
} 