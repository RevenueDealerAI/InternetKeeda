import { createHash } from 'node:crypto';
import { windowStartFor, WINDOW_DAY_SEC, istDayStart } from './config';
import { mongoDriver, type RateLimitDriver } from './mongo-driver';

export type { Tier } from './config';

/**
 * The active storage driver. Swap this line for an Upstash Redis driver
 * (same RateLimitDriver interface) to move off Mongo — nothing else in
 * the codebase needs to change.
 */
const driver: RateLimitDriver = mongoDriver;

export interface LimitResult {
  success: boolean;
  limit: number;
  remaining: number;
  resetAt: Date;
  tier: string;
}

/**
 * Increment the counter for `key` in its current window and report
 * whether the request is within `limit`.
 *
 * FAILS OPEN: if the driver throws (Mongo blip), the request is allowed
 * and the error is logged — a limiter outage must not take the chatbot
 * down. (The global cost breaker is the deliberate exception and fails
 * closed; see enforce.ts.)
 */
export async function checkRateLimit(opts: {
  key: string;
  limit: number;
  windowSec: number;
  tier?: string;
}): Promise<LimitResult> {
  const { key, limit, windowSec, tier = 'anon' } = opts;
  const windowStart = windowStartFor(windowSec);
  const resetAt = new Date(windowStart.getTime() + windowSec * 1000);
  try {
    const count = await driver.increment({ key, windowStart, windowSec });
    return {
      success: count <= limit,
      limit,
      remaining: Math.max(0, limit - count),
      resetAt,
      tier,
    };
  } catch (err) {
    console.error('[ratelimit] driver error — failing OPEN:', err);
    return { success: true, limit, remaining: limit, resetAt, tier };
  }
}

/**
 * Increment an arbitrary daily counter (IST day window) by 1 and return
 * the new total. Does NOT catch — the caller decides fail policy (the
 * cost breakers use this and fail closed; the fallback counter ignores
 * errors).
 */
export async function incrementDailyCounter(key: string): Promise<number> {
  return driver.increment({
    key,
    windowStart: istDayStart(),
    windowSec: WINDOW_DAY_SEC,
  });
}

/** Read a daily counter without incrementing (0 if absent). */
export async function peekDailyCounter(key: string): Promise<number> {
  return driver.peek({ key, windowStart: istDayStart() });
}

/**
 * Accumulate today's token usage for a scope (chat|search) across three
 * daily counters: input, output, cache_read. Best-effort — never throws
 * into the request path.
 */
export async function addDailyTokens(
  scope: string,
  u: { input: number; output: number; cacheRead: number },
): Promise<void> {
  const windowStart = istDayStart();
  try {
    await Promise.all([
      driver.incrementBy({ key: `tokens:${scope}:input:day`, windowStart, windowSec: WINDOW_DAY_SEC, amount: u.input || 0 }),
      driver.incrementBy({ key: `tokens:${scope}:output:day`, windowStart, windowSec: WINDOW_DAY_SEC, amount: u.output || 0 }),
      driver.incrementBy({ key: `tokens:${scope}:cache_read:day`, windowStart, windowSec: WINDOW_DAY_SEC, amount: u.cacheRead || 0 }),
    ]);
  } catch (err) {
    console.error('[ratelimit] token accounting failed (non-fatal):', err);
  }
}

/** sha256, first 12 hex chars. Used everywhere we surface an identity so
 *  a raw IP / userId is never logged or returned. */
export function hashIdentity(id: string): string {
  return createHash('sha256').update(id).digest('hex').slice(0, 12);
}
