import type { Tier } from './config';

/**
 * Pure tier/bypass resolution from a Mongo User row. No Clerk, no
 * Mongoose imports — safe to unit-test in isolation.
 *
 *   - isAdmin === true  → bypass all limits (canonical Mongo admin gate).
 *   - membershipTier    → 'pro' / 'elite' ONLY on an exact match.
 *   - anything else (null / undefined / legacy / unexpected string)
 *     → 'free'. Never an unlimited tier, never a missing TIER_LIMITS key.
 */
export function resolveTier(
  user: { isAdmin?: boolean; membershipTier?: unknown } | null | undefined,
): { tier: Tier; isAdmin: boolean } {
  if (user?.isAdmin === true) return { tier: 'elite', isAdmin: true };
  const raw = user?.membershipTier;
  const tier: Tier = raw === 'pro' || raw === 'elite' ? raw : 'free';
  return { tier, isAdmin: false };
}
