import { connectDB } from '@/app/api/lib/db';
import { AiQueryCache } from '@/models/AiQueryCache';
import { cacheKey } from './cacheKey';

/**
 * Result cache for AI tool search. Most queries repeat, so a hit avoids
 * the Anthropic call entirely. Key logic + CACHE_VERSION live in the
 * pure ./cacheKey module (unit-testable).
 */
export { CACHE_VERSION, normalizeQuery, cacheKey } from './cacheKey';

const TTL_MS: Record<'chat' | 'search', number> = {
  search: 7 * 24 * 60 * 60 * 1000, // 7 days
  chat: 24 * 60 * 60 * 1000, // 24 hours
};

/** Returns the cached payload or null. Fails OPEN (null → treat as miss). */
export async function getAiCache(scope: 'chat' | 'search', query: string, contextHash?: string): Promise<unknown | null> {
  try {
    await connectDB();
    const doc = (await AiQueryCache.findOne({ key: cacheKey(scope, query, contextHash) })
      .select('payload expiresAt')
      .lean()) as { payload?: unknown; expiresAt?: Date } | null;
    if (!doc) return null;
    // Defensive: the TTL job runs ~once a minute, so honour expiry here too.
    if (doc.expiresAt && new Date(doc.expiresAt).getTime() < Date.now()) return null;
    return doc.payload ?? null;
  } catch (err) {
    console.error('[aicache] get failed (miss):', err);
    return null;
  }
}

export async function setAiCache(scope: 'chat' | 'search', query: string, payload: unknown, contextHash?: string): Promise<void> {
  try {
    await connectDB();
    const now = Date.now();
    const key = cacheKey(scope, query, contextHash);
    await AiQueryCache.updateOne(
      { key },
      { $set: { key, scope, payload, createdAt: new Date(now), expiresAt: new Date(now + TTL_MS[scope]) } },
      { upsert: true },
    );
  } catch (err) {
    console.error('[aicache] set failed (non-fatal):', err);
  }
}

/**
 * Clear cached entries for a scope (or all). Exposed for a future hook
 * into the admin tool-save path; currently invalidation relies on the
 * TTL + a CACHE_VERSION bump (see report).
 */
export async function clearAiCache(scope?: 'chat' | 'search'): Promise<number> {
  await connectDB();
  const r = await AiQueryCache.deleteMany(scope ? { scope } : {});
  return r.deletedCount ?? 0;
}
