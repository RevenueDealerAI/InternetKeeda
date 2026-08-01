import { createHash } from 'node:crypto';

/**
 * Pure cache-key logic (no DB imports) so it can be unit-tested in
 * isolation. Bump CACHE_VERSION to invalidate every cached AI result at
 * once (it's part of the hashed key, so all keys change → all miss).
 */
export const CACHE_VERSION = 'v1';

/** lowercased, trimmed, whitespace-collapsed, punctuation stripped. */
export function normalizeQuery(q: string): string {
  return q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * The cache key is scoped by the FULL request context, not just the last
 * message. `contextHash` folds in a hash of any conversation history the
 * request carries (see hashConversationContext) so two requests with the
 * same last message but DIFFERENT history never share a cache entry.
 */
export function cacheKey(scope: 'chat' | 'search', query: string, contextHash?: string): string {
  return createHash('sha256')
    .update(`${CACHE_VERSION}:${scope}:${normalizeQuery(query)}:${contextHash || ''}`)
    .digest('hex');
}

/**
 * Hash any conversation-history the request body carries. KeedaChat sends
 * only `{ query }` today, so this returns undefined (a no-op) — the guard
 * is built anyway so that IF a future client sends prior messages, the
 * cache key becomes context-specific automatically (chat cache safety).
 * Returns undefined when there is no history to fold in.
 */
export function hashConversationContext(body: unknown): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  const b = body as Record<string, unknown>;
  const hist = b.messages ?? b.history ?? b.context ?? b.conversation ?? b.priorMessages;
  if (hist === undefined || hist === null) return undefined;
  return createHash('sha256').update(JSON.stringify(hist)).digest('hex').slice(0, 16);
}
