/**
 * Private file storage adapter for Keeda Labs downloads.
 *
 * Backed by Vercel Blob. Files live under a `store/private/{uuid}-`
 * prefix with random-suffixed pathnames so URL guessing is not
 * viable. The URL is stored only in StoreProduct.filePath (server-
 * only field) — the public API never returns it. Buyer downloads
 * are streamed through /api/store/download/[purchaseId] which
 * fetches from the blob URL server-side and pipes to the client.
 *
 * If BLOB_READ_WRITE_TOKEN is not configured, uploads fail fast
 * with a clear error so the admin sees a config problem rather
 * than a silent broken upload.
 */

import { put, del, head } from '@vercel/blob';

export interface UploadResult {
  /** Full blob URL — store in StoreProduct.filePath (server-only). */
  url: string;
  /** Original filename for Content-Disposition on download. */
  fileName: string;
  /** Bytes — surfaced on the product page as "12 KB / 1.4 MB" etc. */
  sizeBytes: number;
}

const REQUIRED_ENV = 'BLOB_READ_WRITE_TOKEN';

function assertBlobConfigured() {
  if (!process.env[REQUIRED_ENV]) {
    throw new Error(
      `${REQUIRED_ENV} is not set. Add it in Vercel project settings ` +
        `(Storage → Blob) and pull it down with \`vercel env pull .env.local\`.`
    );
  }
}

/**
 * Stream-upload a file to private blob storage.
 *
 * `addRandomSuffix: true` makes the resulting URL unguessable. The
 * URL is publicly fetchable BY DESIGN (Vercel Blob has no native ACL),
 * but the URL itself is the secret — never sent to the client. The
 * download API streams the bytes server-side so the blob URL never
 * leaves the server.
 */
export async function uploadPrivateFile(
  file: File | Blob,
  fileName: string
): Promise<UploadResult> {
  assertBlobConfigured();

  // Keep the original filename in the pathname so blob admins can
  // recognise files in the dashboard — the random suffix lives at
  // the URL level, not in our pathname.
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  const pathname = `store/private/${safe}`;

  const blob = await put(pathname, file, {
    // Vercel Blob v2 introduced private-access stores. The store
    // type itself dictates visibility — passing access:'public' on
    // a private store throws. We provisioned a private store
    // exactly because the downloads must NEVER be guessable, so
    // we set access:'private' here.
    access: 'private',
    addRandomSuffix: true,
    contentType: 'application/octet-stream',
    // Pass the rw token explicitly. The SDK otherwise auto-discovers
    // VERCEL_OIDC_TOKEN when present, which fails on dev envs that
    // don't have OIDC enabled (`BlobOidcEnvironmentNotAllowedError`).
    // Explicit token always wins over the OIDC path.
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });

  return {
    url: blob.url,
    fileName,
    sizeBytes:
      typeof (file as Blob).size === 'number' ? (file as Blob).size : 0,
  };
}

/**
 * Stream-upload a public cover image. Returned URL is intentionally
 * predictable (no random suffix) so it can be cached + displayed
 * directly in the catalog UI. Still goes via Vercel Blob — keeps the
 * "no Cloudinary dependency for the store" boundary.
 */
export async function uploadPublicCover(
  file: File | Blob,
  fileName: string
): Promise<UploadResult> {
  assertBlobConfigured();
  const safe = fileName.replace(/[^a-zA-Z0-9._-]/g, '_').slice(0, 120);
  const pathname = `store/covers/${safe}`;
  // Same private store backs both upload paths. The cover image is
  // served back to the buyer via a passthrough route, not a direct
  // <img src> — see /api/store/cover/[productId] for the public read.
  const blob = await put(pathname, file, {
    access: 'private',
    addRandomSuffix: true,
    // Same explicit-token reason as uploadPrivateFile above.
    token: process.env.BLOB_READ_WRITE_TOKEN,
  });
  return {
    url: blob.url,
    fileName,
    sizeBytes:
      typeof (file as Blob).size === 'number' ? (file as Blob).size : 0,
  };
}

/** Delete a blob by its full URL. Used when admin replaces a file. */
export async function deletePrivateFile(url: string): Promise<void> {
  assertBlobConfigured();
  try {
    await del(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
  } catch (e) {
    // 404 from del means the blob is already gone — acceptable.
    console.warn('[store/storage] del failed (continuing):', e);
  }
}

/** Probe — returns true if the blob exists and the URL is reachable. */
export async function blobExists(url: string): Promise<boolean> {
  assertBlobConfigured();
  try {
    await head(url, { token: process.env.BLOB_READ_WRITE_TOKEN });
    return true;
  } catch {
    return false;
  }
}
