/**
 * GET /api/store/download/[purchaseId]
 *
 * The one and only public download surface. Stages:
 *   1. requireUser — anonymous → 401
 *   2. getEntitlementForDownload — purchase not yours / not paid → 403
 *   3. Load StoreProduct.filePath (private Vercel Blob URL)
 *   4. Stream the blob through this route to the client
 *
 * The raw blob URL is never sent to the client; the server fetches it
 * and pipes the body, so even if the buyer copies their browser's
 * Network panel the only URL they see is the same /api/store/download
 * URL — which requires their Clerk session to use.
 *
 * `Content-Disposition: attachment` forces a download with the
 * original filename. Files are small (n8n JSON is KB; packs are MB)
 * so streaming through the function is well within Vercel limits.
 */

import { NextRequest, NextResponse } from 'next/server';
import { get as blobGet } from '@vercel/blob';
import { requireUser } from '@/lib/auth/user';
import { connectDB } from '@/app/api/lib/db';
import { getEntitlementForDownload } from '@/features/store/server/entitlements';
import { StoreProduct } from '@/features/store/models/StoreProduct';
import { StorePurchase } from '@/features/store/models/StorePurchase';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ purchaseId: string }> }
) {
  const { purchaseId } = await params;

  const auth = await requireUser();
  if (auth.kind !== 'ok') {
    return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
  }

  await connectDB();
  const check = await getEntitlementForDownload(purchaseId, auth.userId);
  if (!check) {
    return NextResponse.json(
      { error: 'forbidden', message: 'No active entitlement for this download.' },
      { status: 403 }
    );
  }

  const product = await StoreProduct.findById(check.purchase.productId).select(
    'filePath fileName fileSizeBytes'
  );
  if (!product?.filePath) {
    return NextResponse.json(
      { error: 'gone', message: 'Product file is no longer available.' },
      { status: 410 }
    );
  }

  // Vercel Blob v2 private store: the canonical filePath URL is not
  // directly fetchable. The SDK's get() opens an authenticated stream
  // server-side and returns it — we pipe that straight to the
  // client. The blob URL never reaches the buyer.
  let stream: ReadableStream<Uint8Array>;
  // The SDK returns undici Headers, structurally compatible with the
  // platform Headers but typed nominally differently — keep the
  // narrow shape we actually consume.
  let upstreamContentLengthHeader: string | null = null;
  let upstreamContentTypeHeader: string | null = null;
  let upstreamSize: number | null = null;
  let upstreamContentType: string | null = null;
  try {
    const result = await blobGet(product.filePath, {
      access: 'private',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    if (!result || result.statusCode !== 200) {
      return NextResponse.json(
        { error: 'gone', message: 'Product file is no longer available.' },
        { status: 410 }
      );
    }
    stream = result.stream;
    upstreamContentLengthHeader = result.headers.get('content-length');
    upstreamContentTypeHeader = result.headers.get('content-type');
    upstreamSize = result.blob?.size ?? null;
    upstreamContentType = result.blob?.contentType ?? null;
  } catch (e) {
    console.error('[store/download] blob get failed', {
      productId: String(product._id),
      err: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json(
      { error: 'upstream', message: 'Failed to retrieve file.' },
      { status: 502 }
    );
  }

  // Soft analytics — fire-and-forget, doesn't block the stream.
  StorePurchase.updateOne(
    { _id: check.purchase._id },
    {
      $set: { lastDownloadedAt: new Date() },
      $inc: { downloadCount: 1 },
    }
  ).catch((e) => console.warn('[store/download] analytics update failed', e));

  const headers = new Headers();
  headers.set(
    'Content-Disposition',
    `attachment; filename="${encodeFilename(product.fileName)}"`
  );
  headers.set(
    'Content-Type',
    upstreamContentType ||
      upstreamContentTypeHeader ||
      'application/octet-stream'
  );
  const upstreamLen =
    upstreamSize !== null ? String(upstreamSize) : upstreamContentLengthHeader;
  if (upstreamLen) headers.set('Content-Length', upstreamLen);
  // Block intermediate caches — the URL is per-purchase and access-
  // gated; we don't want a CDN serving stale entitlement state.
  headers.set('Cache-Control', 'private, no-store');

  return new NextResponse(stream, { status: 200, headers });
}

/** RFC 5987 filename* falls back to a sanitized ASCII filename. */
function encodeFilename(raw: string): string {
  return raw.replace(/[\\/:*?"<>|]/g, '_').replace(/"/g, "'");
}
