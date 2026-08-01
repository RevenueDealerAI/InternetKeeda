import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { connectDB } from '../../lib/db';
import { User } from '../../models/User';
import { RateLimitBucket } from '@/models/RateLimitBucket';
import { hashIdentity, peekDailyCounter } from '@/lib/ratelimit';
import {
  GLOBAL_KEY,
  GLOBAL_DAILY_CHAT_CAP,
  SEARCH_GLOBAL_KEY,
  SEARCH_GLOBAL_CAP,
  FALLBACK_COUNTER_KEY,
} from '@/lib/ratelimit/config';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

/**
 * GET /api/admin/ratelimit-stats — isAdmin only.
 * Returns top chat/search consumers over 24h (identities HASHED), the
 * chat/search cost-breaker counters + the silent-fallback counter, and
 * today's token totals per scope.
 */
export async function GET() {
  const { userId } = await auth();
  if (!userId) return NextResponse.json({ error: 'unauthorized' }, { status: 401 });

  await connectDB();
  const me = (await User.findOne({ clerkId: userId })
    .select('isAdmin')
    .lean()) as { isAdmin?: boolean } | null;
  if (!me?.isAdmin) return NextResponse.json({ error: 'forbidden' }, { status: 403 });

  const since = new Date(Date.now() - 24 * 60 * 60 * 1000);
  // Only identity buckets (chat:ip:* / chat:user:* / search:*) — exclude
  // the global/token/fallback counter documents.
  const rows = (await RateLimitBucket.aggregate([
    { $match: { windowStart: { $gte: since }, key: { $regex: '^(chat|search):(ip|user):' } } },
    { $group: { _id: '$key', total: { $sum: '$count' } } },
    { $sort: { total: -1 } },
    { $limit: 20 },
  ])) as Array<{ _id: string; total: number }>;

  const topKeys = rows.map((r) => ({
    scope: r._id.startsWith('search:') ? 'search' : 'chat',
    idType: r._id.includes(':user:') ? 'user' : 'ip',
    keyHash: hashIdentity(r._id),
    total: r.total,
  }));

  const [
    chatGlobal,
    searchGlobal,
    fallbacks,
    cacheHitChat,
    cacheMissChat,
    cacheHitSearch,
    cacheMissSearch,
    claudeSkipped,
    claudeCalled,
  ] = await Promise.all([
    peekDailyCounter(GLOBAL_KEY).catch(() => -1),
    peekDailyCounter(SEARCH_GLOBAL_KEY).catch(() => -1),
    peekDailyCounter(FALLBACK_COUNTER_KEY).catch(() => -1),
    peekDailyCounter('cache:hit:chat:day').catch(() => 0),
    peekDailyCounter('cache:miss:chat:day').catch(() => 0),
    peekDailyCounter('cache:hit:search:day').catch(() => 0),
    peekDailyCounter('cache:miss:search:day').catch(() => 0),
    peekDailyCounter('search:claude_skipped:day').catch(() => 0),
    peekDailyCounter('search:claude_called:day').catch(() => 0),
  ]);
  const hitRate = (h: number, m: number) => (h + m > 0 ? Math.round((h / (h + m)) * 100) : null);

  async function tokensFor(scope: 'chat' | 'search') {
    const [input, output, cacheRead] = await Promise.all([
      peekDailyCounter(`tokens:${scope}:input:day`).catch(() => 0),
      peekDailyCounter(`tokens:${scope}:output:day`).catch(() => 0),
      peekDailyCounter(`tokens:${scope}:cache_read:day`).catch(() => 0),
    ]);
    return { input, output, cacheRead };
  }
  const [chatTokens, searchTokens] = await Promise.all([tokensFor('chat'), tokensFor('search')]);

  return NextResponse.json({
    windowHours: 24,
    breakers: {
      chat: { key: GLOBAL_KEY, today: chatGlobal, cap: GLOBAL_DAILY_CHAT_CAP },
      search: { key: SEARCH_GLOBAL_KEY, today: searchGlobal, cap: SEARCH_GLOBAL_CAP },
      fallbacksToday: fallbacks,
    },
    tokensToday: { chat: chatTokens, search: searchTokens },
    cacheToday: {
      chat: { hit: cacheHitChat, miss: cacheMissChat, hitRatePct: hitRate(cacheHitChat, cacheMissChat) },
      search: { hit: cacheHitSearch, miss: cacheMissSearch, hitRatePct: hitRate(cacheHitSearch, cacheMissSearch) },
    },
    searchClaudeToday: {
      skipped: claudeSkipped,
      called: claudeCalled,
      skipRatePct: hitRate(claudeSkipped, claudeCalled),
    },
    topKeys,
  });
}
