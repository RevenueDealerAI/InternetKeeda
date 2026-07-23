/**
 * IndexNow client — fire-and-forget notification to the IndexNow
 * federated network (api.indexnow.org → Bing, Yandex, Naver, Seznam).
 *
 * Why: Google ignores IndexNow as of 2026, but Bing's index feeds
 * ChatGPT Search, Copilot, DuckDuckGo, and most non-Google AI
 * surfaces. One ping notifies all of them on any URL change.
 *
 * Usage:
 *   await pingIndexNow('https://www.internetkeeda.com/ai-tools/foo');
 *   await pingIndexNow([url1, url2, ...]);
 *
 * Best-effort: never throws. Logs failures so a broken token surfaces
 * in server logs but never breaks the caller's write path.
 *
 * The key file MUST be reachable at
 *   {host}/{INDEXNOW_KEY}.txt
 * containing exactly the key string. We serve it from /public so the
 * file ships with every deploy. Replace the key by rotating both the
 * INDEXNOW_KEY env var (or the constant here) AND the file in /public.
 */

import { SITE_ORIGIN } from './siteOrigin';

const INDEXNOW_KEY =
  process.env.INDEXNOW_KEY || 'be5a223e57c5c38a471c0c929a0e4717';

const INDEXNOW_ENDPOINT = 'https://api.indexnow.org/IndexNow';

export async function pingIndexNow(
  urls: string | string[],
): Promise<{ ok: boolean; status?: number; error?: string }> {
  const list = Array.isArray(urls) ? urls : [urls];
  const filtered = list.filter((u) => u && u.startsWith(SITE_ORIGIN));
  if (filtered.length === 0) {
    return { ok: false, error: 'no urls on canonical host' };
  }

  const host = new URL(SITE_ORIGIN).host;
  const payload = {
    host,
    key: INDEXNOW_KEY,
    keyLocation: `${SITE_ORIGIN}/${INDEXNOW_KEY}.txt`,
    urlList: filtered,
  };

  try {
    const res = await fetch(INDEXNOW_ENDPOINT, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json; charset=utf-8' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      console.warn('[indexnow] non-ok response', res.status, await res.text().catch(() => ''));
      return { ok: false, status: res.status };
    }
    return { ok: true, status: res.status };
  } catch (e) {
    console.warn('[indexnow] ping failed', e);
    return { ok: false, error: String(e) };
  }
}
