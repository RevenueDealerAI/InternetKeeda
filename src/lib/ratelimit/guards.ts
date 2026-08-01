import type { NextRequest } from 'next/server';
import {
  MAX_BODY_BYTES,
  MAX_MESSAGE_CHARS,
  MAX_HISTORY_MESSAGES,
  ALLOWED_ORIGINS,
  ALLOWED_ORIGIN_SUFFIXES,
} from './config';
import { hashConversationContext } from '@/lib/ai/cacheKey';

/** Layer 2 — input / payload guards, applied before the Anthropic call. */

// String-literal discriminant (`kind`) — this project runs strict:false,
// where boolean-literal (`ok: true/false`) discriminated unions do NOT
// narrow. `kind` narrows reliably.
export type BodyGuardResult =
  | { kind: 'ok'; query: string; contextHash?: string }
  | { kind: 'fail'; status: number; error: string; message: string };

export function isProd(): boolean {
  return (process.env.VERCEL_ENV || process.env.NODE_ENV) === 'production';
}

function hostAllowed(origin: string): boolean {
  try {
    const url = new URL(origin);
    const normalized = `${url.protocol}//${url.host}`;
    if (ALLOWED_ORIGINS.includes(normalized)) return true;
    return ALLOWED_ORIGIN_SUFFIXES.some((s) => url.hostname.endsWith(s));
  } catch {
    return false;
  }
}

/**
 * True when the Origin's host equals the request's own host — i.e. a
 * SAME-ORIGIN call. The chatbot is always fetched same-origin, so this
 * is the real invariant: it works no matter which domain the app is
 * deployed to (internetkeeda.com, a Vercel preview, an embedded/resold
 * CodeCanyon copy, or inside an iframe whose document is still served by
 * that same host), while a cross-origin scraper from evil.com is still
 * rejected. The explicit ALLOWED_ORIGINS list then adds the known
 * CROSS-origin exceptions (e.g. community.internetkeeda.com → main API).
 */
function sameOrigin(req: NextRequest, origin: string): boolean {
  // Behind Vercel's (or any) proxy the PUBLIC host the browser used is
  // carried by `x-forwarded-host`; the bare `host` header can be the
  // internal upstream. The browser's Origin reflects the public host, so
  // compare against x-forwarded-host first, falling back to host.
  const selfHost = req.headers.get('x-forwarded-host') || req.headers.get('host');
  if (!selfHost) return false;
  try {
    return new URL(origin).host === selfHost;
  } catch {
    return false;
  }
}

/**
 * Production Origin check. Skipped in development. Allows same-origin
 * (any deploy host) OR an allowlisted cross-origin. A missing Origin
 * falls back to Referer; if neither is present/allowed the request is
 * rejected — a browser always sends one of them on a same-origin POST,
 * so their absence in prod signals a non-browser client (scraper/curl).
 */
export function originAllowed(req: NextRequest): boolean {
  if (!isProd()) return true;
  const origin = req.headers.get('origin');
  if (origin) return sameOrigin(req, origin) || hostAllowed(origin);
  const referer = req.headers.get('referer');
  if (referer) {
    try {
      return sameOrigin(req, referer) || hostAllowed(new URL(referer).origin);
    } catch {
      return false;
    }
  }
  return false;
}

/**
 * Read the request body EXACTLY ONCE and validate it. Enforces:
 *   - JSON content type (415)
 *   - body size <= MAX_BODY_BYTES (413)
 *   - valid JSON (400)
 *   - a non-empty `query` <= MAX_MESSAGE_CHARS (400)
 *
 * Security: only `query` is extracted. Any client-supplied `model`,
 * `system`, `max_tokens`, or `temperature` is IGNORED here and never
 * reaches the Anthropic call — the client cannot pick the model or
 * override the system prompt.
 */
export async function readAndGuardBody(req: NextRequest): Promise<BodyGuardResult> {
  const ct = (req.headers.get('content-type') || '').toLowerCase();
  if (!ct.includes('application/json')) {
    return {
      kind: 'fail',
      status: 415,
      error: 'unsupported_media_type',
      message: 'Content-Type must be application/json.',
    };
  }

  let raw: string;
  try {
    raw = await req.text();
  } catch {
    return { kind: 'fail', status: 400, error: 'bad_request', message: 'Could not read the request body.' };
  }

  if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) {
    return { kind: 'fail', status: 413, error: 'payload_too_large', message: 'Request body is too large.' };
  }

  let body: unknown;
  try {
    body = JSON.parse(raw || '{}');
  } catch {
    return { kind: 'fail', status: 400, error: 'bad_request', message: 'Request body must be valid JSON.' };
  }

  // Debug proof (opt-in): show that client-supplied fields like `model`
  // or `system` arrive in the body but are dropped here — only `query`
  // is extracted below and forwarded.
  if (process.env.RL_DEBUG_UPSTREAM === '1') {
    console.log(
      '[ratelimit][debug] received body keys=%j — ignoring all but "query"',
      Object.keys((body as Record<string, unknown>) || {}),
    );
  }

  const query = typeof (body as { query?: unknown })?.query === 'string'
    ? ((body as { query: string }).query)
    : '';

  if (!query.trim()) {
    return { kind: 'fail', status: 400, error: 'bad_request', message: 'A non-empty "query" is required.' };
  }
  if (query.length > MAX_MESSAGE_CHARS) {
    return {
      kind: 'fail',
      status: 400,
      error: 'message_too_long',
      message: `Message is over the ${MAX_MESSAGE_CHARS.toLocaleString()}-character limit.`,
    };
  }

  // contextHash folds any conversation history into the cache key so two
  // requests with the same last message but different history never share
  // a cached result. Undefined today (KeedaChat sends only `query`).
  return { kind: 'ok', query: query.trim(), contextHash: hashConversationContext(body) };
}

/**
 * Cap conversation history sent upstream to the most recent
 * MAX_HISTORY_MESSAGES, truncating older turns server-side. The chat
 * endpoint is single-turn today (only `query` is sent), so this is a
 * no-op safeguard for when multi-turn history is added.
 */
export function capHistory<T>(messages: T[], keep = MAX_HISTORY_MESSAGES): T[] {
  return messages.length <= keep ? messages : messages.slice(-keep);
}
