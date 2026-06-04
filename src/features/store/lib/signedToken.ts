/**
 * HMAC-signed short-lived download tokens.
 *
 * The download API needs to give the buyer a stable URL that:
 *   1. Authenticates the buyer
 *   2. Authorises a specific StorePurchase
 *   3. Expires after a short window
 *   4. Survives a page refresh without re-auth
 *
 * Cookies + entitlement-on-every-hit is the simpler design, but a
 * signed token makes the download URL safe to share with the same
 * user across tabs/devices for the ~5-minute window — and removes
 * the DB hit on subsequent re-tries for the same buy.
 *
 * Signature: HMAC-SHA256(secret, `${purchaseId}.${userId}.${expiresAt}`)
 * encoded as base64url so the resulting token is URL-safe.
 *
 * Secret is STORE_DOWNLOAD_SECRET. Falls back to NEXTAUTH_SECRET /
 * CLERK_SECRET_KEY if not set so dev environments don't need a new
 * env var, but PROD should set its own.
 */

import { createHmac, timingSafeEqual } from 'node:crypto';

const TOKEN_VERSION = 'v1';
const TTL_MS = 5 * 60 * 1000; // 5 minutes

function getSecret(): string {
  const secret =
    process.env.STORE_DOWNLOAD_SECRET ||
    process.env.CLERK_SECRET_KEY ||
    process.env.NEXTAUTH_SECRET;
  if (!secret) {
    throw new Error(
      'No download-token secret available. Set STORE_DOWNLOAD_SECRET in env.'
    );
  }
  return secret;
}

function b64url(buf: Buffer): string {
  return buf
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

function b64urlDecode(s: string): Buffer {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  return Buffer.from(
    s.replace(/-/g, '+').replace(/_/g, '/') + pad,
    'base64'
  );
}

function sign(payload: string): string {
  return b64url(createHmac('sha256', getSecret()).update(payload).digest());
}

export interface DownloadTokenClaims {
  purchaseId: string;
  userId: string;
}

/**
 * Mint a 5-min token. Format: `v1.{base64url-payload}.{base64url-sig}`.
 */
export function mintDownloadToken(claims: DownloadTokenClaims): string {
  const expiresAt = Date.now() + TTL_MS;
  const payload = `${claims.purchaseId}.${claims.userId}.${expiresAt}`;
  const payloadB64 = b64url(Buffer.from(payload, 'utf8'));
  const sig = sign(payload);
  return `${TOKEN_VERSION}.${payloadB64}.${sig}`;
}

export type VerifyResult =
  | { ok: true; claims: DownloadTokenClaims & { expiresAt: number } }
  | { ok: false; reason: 'malformed' | 'bad-version' | 'bad-sig' | 'expired' };

/** Verify a token. Constant-time comparison; expiry checked against now. */
export function verifyDownloadToken(token: string): VerifyResult {
  const parts = token.split('.');
  if (parts.length !== 3) return { ok: false, reason: 'malformed' };
  const [version, payloadB64, sig] = parts;
  if (version !== TOKEN_VERSION) return { ok: false, reason: 'bad-version' };

  let payload: string;
  try {
    payload = b64urlDecode(payloadB64).toString('utf8');
  } catch {
    return { ok: false, reason: 'malformed' };
  }

  const expected = sign(payload);
  const a = Buffer.from(expected);
  const b = Buffer.from(sig);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return { ok: false, reason: 'bad-sig' };
  }

  const [purchaseId, userId, expiresStr] = payload.split('.');
  const expiresAt = Number(expiresStr);
  if (!purchaseId || !userId || !Number.isFinite(expiresAt)) {
    return { ok: false, reason: 'malformed' };
  }
  if (Date.now() > expiresAt) return { ok: false, reason: 'expired' };

  return { ok: true, claims: { purchaseId, userId, expiresAt } };
}
