import { NextResponse, type NextRequest } from 'next/server';
import {
  TIER_LIMITS,
  SEARCH_TIER_LIMITS,
  GLOBAL_DAILY_CHAT_CAP,
  GLOBAL_KEY,
  SEARCH_GLOBAL_CAP,
  SEARCH_GLOBAL_KEY,
  HIT_CEILING_ANON_PER_MIN,
  HIT_CEILING_AUTH_PER_MIN,
  WINDOW_MIN_SEC,
  WINDOW_DAY_SEC,
  type Tier,
  type TierLimits,
} from './config';
import {
  checkRateLimit,
  incrementDailyCounter,
  hashIdentity,
  type LimitResult,
} from './index';
import { resolveIdentity, type Identity } from './identify';
import { readAndGuardBody, originAllowed } from './guards';

// String-literal discriminant — boolean-literal unions don't narrow
// under this project's strict:false tsconfig.
// Guards (origin + payload) run FIRST and independently, so the result
// cache can be checked between the guards and the rate limiter — a
// cache HIT then costs no quota and no cost-breaker budget.
export type GuardResult =
  | { kind: 'ok'; query: string; contextHash?: string }
  | { kind: 'reject'; response: NextResponse };

export type RateResult =
  | { kind: 'pass'; headers: Record<string, string> }
  | { kind: 'reject'; response: NextResponse };

/**
 * Per-route rate-limit scope. The bucket key is `${scope}:${identity.id}`
 * and the cost breaker is `globalKey` — so chat and search have fully
 * separate buckets AND separate global ceilings. Search must NEVER
 * increment the chat breaker.
 */
export interface ScopeConfig {
  scope: 'chat' | 'search';
  tierLimits: Record<Tier, TierLimits>;
  globalKey: string;
  globalCap: number;
}

export const CHAT_SCOPE: ScopeConfig = {
  scope: 'chat',
  tierLimits: TIER_LIMITS,
  globalKey: GLOBAL_KEY,
  globalCap: GLOBAL_DAILY_CHAT_CAP,
};

export const SEARCH_SCOPE: ScopeConfig = {
  scope: 'search',
  tierLimits: SEARCH_TIER_LIMITS,
  globalKey: SEARCH_GLOBAL_KEY,
  globalCap: SEARCH_GLOBAL_CAP,
};

/** RateLimit-* headers for a window result. */
function rateHeaders(r: LimitResult): Record<string, string> {
  const resetSec = Math.max(0, Math.ceil((r.resetAt.getTime() - Date.now()) / 1000));
  return {
    'RateLimit-Limit': String(r.limit),
    'RateLimit-Remaining': String(r.remaining),
    'RateLimit-Reset': String(resetSec),
  };
}

/** Attach a header map to an already-built response (used for success +
 *  fallback responses in the route). */
export function attachHeaders(res: NextResponse, headers: Record<string, string>): NextResponse {
  for (const [k, v] of Object.entries(headers)) res.headers.set(k, v);
  return res;
}

function rateLimitMessage(tier: Tier, retryAfter: number): string {
  const wait = `Try again in ${retryAfter}s.`;
  switch (tier) {
    case 'anon':
      return `You've hit the guest limit. Sign up free to keep chatting — or go Pro for much higher limits. ${wait}`;
    case 'free':
      return `You've hit your free limit. Upgrade to Pro for higher limits. ${wait}`;
    default:
      // pro / elite — neutral cooldown, never salesy.
      return `You're sending messages a little too fast. ${wait}`;
  }
}

function tooManyRequests(r: LimitResult, tier: Tier): NextResponse {
  const retryAfter = Math.max(1, Math.ceil((r.resetAt.getTime() - Date.now()) / 1000));
  const headers = { ...rateHeaders(r), 'Retry-After': String(retryAfter) };
  return NextResponse.json(
    {
      error: 'rate_limited',
      message: rateLimitMessage(tier, retryAfter),
      retryAfter,
      tier,
      upgradeUrl: '/pricing',
    },
    { status: 429, headers },
  );
}

function guardFail(status: number, error: string, message: string): NextResponse {
  return NextResponse.json({ error, message }, { status });
}

function serviceUnavailable(): NextResponse {
  return NextResponse.json(
    {
      error: 'service_unavailable',
      message: 'Riley is briefly over capacity and is resting. Please try again later.',
    },
    { status: 503, headers: { 'Retry-After': '300' } },
  );
}

/**
 * The full pre-flight for the chat endpoint. Runs to completion and
 * either authorises the request (returning the safe `query` + the
 * RateLimit headers to attach) or returns the terminal response
 * (400/403/413/415/429/503). MUST be awaited BEFORE any Anthropic call.
 *
 * Order:
 *   1. Origin allowlist (prod)           → 403
 *   2. Payload guards (type/size/query)  → 415/413/400
 *   3. Identity + tier (admin bypass)
 *   4. Per-tier minute limit             → 429
 *   5. Per-tier day limit (00:00 IST)    → 429
 *   6. Global cost breaker (fail CLOSED) → 503
 *
 * Fails OPEN on limiter errors (steps 4–5), fails CLOSED on the breaker
 * (step 6).
 */
/**
 * Abuse guards only — Origin allowlist + payload guards (content-type,
 * size, query length). Reads the body ONCE and returns the safe query.
 * Runs BEFORE the result-cache check.
 */
export async function guardOnly(req: NextRequest): Promise<GuardResult> {
  if (!originAllowed(req)) {
    return { kind: 'reject', response: guardFail(403, 'forbidden_origin', 'Requests are only accepted from internetkeeda.com.') };
  }
  const body = await readAndGuardBody(req);
  if (body.kind === 'fail') {
    return { kind: 'reject', response: guardFail(body.status, body.error, body.message) };
  }
  return { kind: 'ok', query: body.query, contextHash: body.contextHash };
}

/**
 * Loose per-identity ceiling for CACHE HITS. A hit skips the tier quota +
 * cost breaker (it's free), but must still not be hammerable — this
 * generous minute ceiling (anon 60, authenticated 200) 429s the abuse
 * case with the same response contract. Uses its OWN `hit:<scope>:<id>`
 * bucket, so it never touches the tier or breaker counters.
 */
export async function enforceHitCeiling(req: NextRequest, cfg: ScopeConfig): Promise<RateResult> {
  const identity = await resolveIdentity(req);
  if (identity.isAdmin) {
    return {
      kind: 'pass',
      headers: {
        'RateLimit-Limit': String(HIT_CEILING_AUTH_PER_MIN),
        'RateLimit-Remaining': String(HIT_CEILING_AUTH_PER_MIN),
        'RateLimit-Reset': String(WINDOW_MIN_SEC),
      },
    };
  }
  const limit = identity.tier === 'anon' ? HIT_CEILING_ANON_PER_MIN : HIT_CEILING_AUTH_PER_MIN;
  const r = await checkRateLimit({
    key: `hit:${cfg.scope}:${identity.id}`,
    limit,
    windowSec: WINDOW_MIN_SEC,
    tier: identity.tier,
  });
  if (!r.success) {
    console.warn(JSON.stringify({ event: 'hit_ceiling_exceeded', scope: cfg.scope, tier: identity.tier, keyHash: hashIdentity(identity.id) }));
    return { kind: 'reject', response: tooManyRequests(r, identity.tier) };
  }
  return { kind: 'pass', headers: rateHeaders(r) };
}

/**
 * Rate limiting only — identity/tier resolution, admin bypass, per-tier
 * minute+day windows, and this scope's global cost breaker. Runs on a
 * cache MISS (a HIT costs nothing and skips this entirely). Assumes the
 * guards have already passed; does NOT read the body.
 *
 * Fails OPEN on limiter errors; the global breaker fails CLOSED.
 */
export async function enforceRateOnly(req: NextRequest, cfg: ScopeConfig): Promise<RateResult> {
  const path = req.nextUrl.pathname;
  const identity = await resolveIdentity(req);

  // Admins bypass everything (canonical Mongo isAdmin gate).
  if (identity.isAdmin) {
    const nominal = cfg.tierLimits.elite.perMin;
    return {
      kind: 'pass',
      headers: {
        'RateLimit-Limit': String(nominal),
        'RateLimit-Remaining': String(nominal),
        'RateLimit-Reset': String(WINDOW_MIN_SEC),
      },
    };
  }

  const limits = cfg.tierLimits[identity.tier];
  // Scope-prefixed key → chat and search never share a bucket.
  const key = `${cfg.scope}:${identity.id}`;

  const minute = await checkRateLimit({ key, limit: limits.perMin, windowSec: WINDOW_MIN_SEC, tier: identity.tier });
  if (!minute.success) {
    console.warn(JSON.stringify({ event: 'rate_limited', scope: cfg.scope, tier: identity.tier, keyHash: hashIdentity(identity.id), path, window: 'min' }));
    return { kind: 'reject', response: tooManyRequests(minute, identity.tier) };
  }

  const day = await checkRateLimit({ key, limit: limits.perDay, windowSec: WINDOW_DAY_SEC, tier: identity.tier });
  if (!day.success) {
    console.warn(JSON.stringify({ event: 'rate_limited', scope: cfg.scope, tier: identity.tier, keyHash: hashIdentity(identity.id), path, window: 'day' }));
    return { kind: 'reject', response: tooManyRequests(day, identity.tier) };
  }

  // Global cost breaker — FAILS CLOSED on this scope's OWN counter.
  try {
    const total = await incrementDailyCounter(cfg.globalKey);
    const warnAt = Math.floor(cfg.globalCap * 0.8);
    if (total === warnAt) {
      console.warn(JSON.stringify({ event: 'global_cap_80pct', scope: cfg.scope, key: cfg.globalKey, total, cap: cfg.globalCap, path }));
    }
    if (total > cfg.globalCap) {
      return { kind: 'reject', response: serviceUnavailable() };
    }
  } catch (err) {
    console.error('[ratelimit] global breaker error — failing CLOSED:', err);
    return { kind: 'reject', response: serviceUnavailable() };
  }

  return { kind: 'pass', headers: rateHeaders(minute) };
}
