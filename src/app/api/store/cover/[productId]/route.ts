/**
 * GET /api/store/cover/[productId]
 *
 * Public passthrough for product cover images.
 *
 * Cover images live in the same Vercel Blob private store as the
 * downloadable files (Vercel Blob v2 stores are either public or
 * private — we picked private because the downloads need it, so
 * covers ride along on the same store). To render covers in <img>
 * tags from the storefront, we stream them through this route.
 *
 * Gate is intentionally weaker than /api/store/download/[purchaseId]:
 *   - No auth required (anyone browsing the catalog can see covers).
 *   - But the product MUST be status: 'published' — covers on draft
 *     or archived products 404, so admins can stage products without
 *     their covers leaking out.
 *
 * Cache hints are public so a CDN / browser can store the cover.
 * The blob URL itself stays server-side.
 */

import { NextRequest, NextResponse } from 'next/server';
import { get as blobGet } from '@vercel/blob';
import { connectDB } from '@/app/api/lib/db';
import { StoreProduct } from '@/features/store/models/StoreProduct';

export const dynamic = 'force-dynamic';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ productId: string }> }
) {
  const { productId } = await params;

  await connectDB();
  const product = await StoreProduct.findById(productId)
    .select('coverImageUrl status')
    .lean();
  if (!product || product.status !== 'published' || !product.coverImageUrl) {
    return NextResponse.json({ error: 'not-found' }, { status: 404 });
  }

  let stream: ReadableStream<Uint8Array>;
  let upstreamContentLengthHeader: string | null = null;
  let upstreamContentTypeHeader: string | null = null;
  let upstreamSize: number | null = null;
  let upstreamContentType: string | null = null;
  try {
    const result = await blobGet(product.coverImageUrl, {
      access: 'private',
      token: process.env.BLOB_READ_WRITE_TOKEN,
    });
    if (!result || result.statusCode !== 200) {
      return NextResponse.json({ error: 'gone' }, { status: 404 });
    }
    stream = result.stream;
    upstreamContentLengthHeader = result.headers.get('content-length');
    upstreamContentTypeHeader = result.headers.get('content-type');
    upstreamSize = result.blob?.size ?? null;
    upstreamContentType = result.blob?.contentType ?? null;
  } catch (e) {
    console.error('[store/cover] blob get failed', {
      productId,
      err: e instanceof Error ? e.message : String(e),
    });
    return NextResponse.json({ error: 'upstream' }, { status: 502 });
  }

  const headers = new Headers();
  headers.set(
    'Content-Type',
    upstreamContentType ||
      upstreamContentTypeHeader ||
      'application/octet-stream'
  );
  const upstreamLen =
    upstreamSize !== null ? String(upstreamSize) : upstreamContentLengthHeader;
  if (upstreamLen) headers.set('Content-Length', upstreamLen);
  // Cache aggressively — covers don't change often and a fresh upload
  // gets a fresh blob URL (random suffix) so cache-busting is built in.
  headers.set('Cache-Control', 'public, max-age=86400, immutable');

  return new NextResponse(stream, { status: 200, headers });
}
