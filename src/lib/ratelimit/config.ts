/**
 * ────────────────────────────────────────────────────────────────────
 *  RATE-LIMIT CONFIG — the ONE place to tune every limit.
 *  Everything numeric lives here. Change a number, redeploy, done.
 * ────────────────────────────────────────────────────────────────────
 */

export type Tier = 'anon' | 'free' | 'pro' | 'elite';

export interface TierLimits {
  /** Max chat requests per rolling minute window. */
  perMin: number;
  /** Max chat requests per day (resets 00:00 IST). */
  perDay: number;
}

/**
 * TUNABLE — per-tier request budgets.
 *
 * | tier  | messages/min | messages/day |
 * |-------|--------------|--------------|
 * | anon  | 3            | 15           |
 * | free  | 8            | 50           |
 * | pro   | 20           | 500          |
 * | elite | 40           | 2000         |
 *
 * Both windows are enforced on every request (minute AND day).
 */
export const TIER_LIMITS: Record<Tier, TierLimits> = {
  anon: { perMin: 3, perDay: 15 },
  free: { perMin: 8, perDay: 50 },
  pro: { perMin: 20, perDay: 500 },
  elite: { perMin: 40, perDay: 2000 },
};

/**
 * TUNABLE — browsing/directory SEARCH budgets (POST /api/tools/search).
 * Deliberately more generous than chat: this is the homepage/hero search
 * box, triggered on submit. Separate buckets from chat.
 *
 * | tier  | search/min | search/day |
 * |-------|------------|------------|
 * | anon  | 10         | 60         |
 * | free  | 20         | 200        |
 * | pro   | 40         | 1000       |
 * | elite | 80         | 4000       |
 */
export const SEARCH_TIER_LIMITS: Record<Tier, TierLimits> = {
  anon: { perMin: 10, perDay: 60 },
  free: { perMin: 20, perDay: 200 },
  pro: { perMin: 40, perDay: 1000 },
  elite: { perMin: 80, perDay: 4000 },
};

/**
 * Loose per-identity ceiling applied to CACHE HITS. A hit skips the tier
 * quota + the cost breaker (it's free), but must still not be hammerable
 * without bound — so a hit passes this generous minute ceiling and 429s
 * (same contract) above it. Per identity, per minute.
 */
export const HIT_CEILING_ANON_PER_MIN = 60;
export const HIT_CEILING_AUTH_PER_MIN = 200;

/** Window lengths in seconds. */
export const WINDOW_MIN_SEC = 60;
export const WINDOW_DAY_SEC = 86_400;

/**
 * GLOBAL COST CIRCUIT BREAKER — hard ceiling on total chat requests per
 * IST day across ALL users. Above this, non-admins get 503. Env-tunable;
 * default 5000.
 */
export const GLOBAL_DAILY_CHAT_CAP = Number(
  process.env.GLOBAL_DAILY_CHAT_CAP || 5000,
);
export const GLOBAL_KEY = 'chat:global:day';

/**
 * Search has its OWN daily ceiling and its OWN breaker key. It must
 * NEVER touch chat:global:day — search spends far less Anthropic budget
 * (tool_indices only, cached prefix), and a homepage traffic spike must
 * not be able to 503 the chatbot. This cap is an abuse ceiling only,
 * tripped at absurd volumes. Env-tunable; default 100000.
 */
export const SEARCH_GLOBAL_CAP = Number(
  process.env.GLOBAL_DAILY_SEARCH_CAP || 100_000,
);
export const SEARCH_GLOBAL_KEY = 'search:global:day';

/** Observability counter (NOT a breaker): every time an upstream
 *  Anthropic call throws and we degrade to keyword search, this daily
 *  counter is incremented so silent fallbacks are visible in admin
 *  stats. */
export const FALLBACK_COUNTER_KEY = 'fallback:global:day';

/** Max tokens for the SEARCH route's model call. It only returns a small
 *  tool_indices integer array, so this is intentionally minimal. */
export const SEARCH_MAX_TOKENS = 256;

/** ── Candidate prefilter + Claude-skip (TUNABLE) ── */
/** How many $text-prefiltered candidates to send Claude (was 500). */
export const CANDIDATE_LIMIT = 50;
/** If the text prefilter returns fewer than this, top up with
 *  highest-rated tools so Claude always has a workable pool. */
export const CANDIDATE_MIN = 15;
/** Trim each catalog entry's description to this many chars for Claude. */
export const CANDIDATE_DESC_CHARS = 110;
/** SEARCH scope only: skip Claude when the text prefilter is confident —
 *  >= this many results AND the top score clears the pack by the margin
 *  below. Conceptual/ambiguous queries fail these and still go to Claude. */
export const SKIP_MIN_RESULTS = 8;
export const SKIP_MIN_TOP_SCORE = 1.2;
export const SKIP_SCORE_MARGIN = 1.3; // top score >= margin × the 8th's score
/** Skip Claude regardless of margin when the top text score is this high
 *  — a very literal, high-confidence match (e.g. "image generator"). */
export const SKIP_ABS_TOP_SCORE = 3.0;

/** ── Payload guards (Layer 2) ── */
/** Reject a single user message longer than this many characters (400). */
export const MAX_MESSAGE_CHARS = 4000;
/** When history is sent, keep at most this many most-recent messages. */
export const MAX_HISTORY_MESSAGES = 12;
/** Reject a request body larger than this many bytes (413). */
export const MAX_BODY_BYTES = 100 * 1024;
/** Server-enforced max_tokens. The client can NEVER override this. */
export const SERVER_MAX_TOKENS = 1024;

/** Production Origin allowlist (exact hosts). Dev skips the check. */
export const ALLOWED_ORIGINS = [
  'https://internetkeeda.com',
  'https://www.internetkeeda.com',
  'https://community.internetkeeda.com',
];
/** Host suffixes allowed in addition to the exact list (Vercel previews). */
export const ALLOWED_ORIGIN_SUFFIXES = ['.vercel.app'];

/**
 * IST is UTC+5:30. The day bucket must reset at 00:00 IST regardless of
 * the server timezone, so the offset is applied explicitly here.
 */
export const IST_OFFSET_MIN = 330;

/** Start of the current IST day, expressed as a UTC Date. */
export function istDayStart(now: Date = new Date()): Date {
  const shifted = now.getTime() + IST_OFFSET_MIN * 60_000;
  const dayIndex = Math.floor(shifted / 86_400_000);
  return new Date(dayIndex * 86_400_000 - IST_OFFSET_MIN * 60_000);
}

/**
 * Aligned start of the window that `now` falls in. The day window aligns
 * to IST midnight; every other window aligns to a fixed epoch grid.
 */
export function windowStartFor(windowSec: number, now: Date = new Date()): Date {
  if (windowSec === WINDOW_DAY_SEC) return istDayStart(now);
  const ms = windowSec * 1000;
  return new Date(Math.floor(now.getTime() / ms) * ms);
}
