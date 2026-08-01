import type { NextRequest } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '@/app/api/lib/db';
import { User } from '@/app/api/models/User';
import type { Tier } from './config';
import { resolveTier } from './tier';

export interface Identity {
  /** Scoped identity, e.g. `user:<clerkId>` or `ip:<ip>`. The bucket key
   *  is `chat:${id}` → `chat:user:...` / `chat:ip:...`. */
  id: string;
  tier: Tier;
  /** True → bypass ALL limits (matches the Mongo isAdmin canonical gate). */
  isAdmin: boolean;
}

/** First entry of x-forwarded-for, then x-real-ip, then "unknown". */
export function ipFrom(req: NextRequest): string {
  const xff = req.headers.get('x-forwarded-for');
  if (xff) {
    const first = xff.split(',')[0]?.trim();
    if (first) return first;
  }
  const xr = req.headers.get('x-real-ip');
  if (xr && xr.trim()) return xr.trim();
  return 'unknown';
}

/**
 * Resolve who is making the request and at what tier.
 *   1. Clerk userId → Mongo User → membershipTier (free/pro/elite).
 *      isAdmin === true short-circuits to a bypass.
 *   2. No session → IP, tier `anon`.
 *
 * Any error resolving the session or the user row degrades to IP/anon —
 * identity resolution must never throw the request into a 500.
 */
export async function resolveIdentity(req: NextRequest): Promise<Identity> {
  try {
    const { userId } = await auth();
    if (userId) {
      await connectDB();
      const user = (await User.findOne({ clerkId: userId })
        .select('isAdmin membershipTier')
        .lean()) as { isAdmin?: boolean; membershipTier?: Tier } | null;

      // resolveTier centralises the admin bypass + the free-default for
      // any null/legacy tier (see tier.ts — unit-tested).
      const { tier, isAdmin } = resolveTier(user);
      return { id: `user:${userId}`, tier, isAdmin };
    }
  } catch (err) {
    console.error('[ratelimit] identity resolution failed, using IP:', err);
  }
  return { id: `ip:${ipFrom(req)}`, tier: 'anon', isAdmin: false };
}
