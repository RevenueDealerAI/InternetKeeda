/**
 * GET /api/store/products/[slug]
 *
 * Public product-detail endpoint. Returns the same PUBLIC_FIELDS as
 * the list endpoint plus description, includes, previewImages,
 * fileName, fileSizeBytes. `filePath` (private blob URL) is excluded
 * — buyers only ever see filename + size, never the storage URL.
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/api/lib/db';
import { StoreProduct } from '@/features/store/models/StoreProduct';

const PUBLIC_FIELDS =
  'title slug description shortDescription category coverImageUrl ' +
  'previewImages priceUsdMinor priceInrMinor salesCount tags includes ' +
  'fileName fileSizeBytes';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ slug: string }> }
) {
  const { slug } = await params;
  await connectDB();
  const doc = await StoreProduct.findOne({ slug, status: 'published' })
    .select(PUBLIC_FIELDS)
    .lean();
  if (!doc) return NextResponse.json({ error: 'not-found' }, { status: 404 });
  // Replace the private-blob coverImageUrl with the passthrough URL
  // so the client renders the image via /api/store/cover/[_id]. The
  // raw blob URL never leaves the server. Same treatment for
  // previewImages once admin upload supports them.
  const id = String(doc._id);
  const data = {
    ...doc,
    coverImageUrl: doc.coverImageUrl ? `/api/store/cover/${id}` : '',
  };
  return NextResponse.json({ data });
}
