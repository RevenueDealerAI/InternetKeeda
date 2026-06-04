/**
 * GET /api/store/products
 *
 * Public catalog endpoint. Returns published store products with the
 * PUBLIC subset of fields only — `filePath` (private blob URL) is
 * explicitly excluded so it cannot leak to the client.
 *
 * Query:
 *   ?category=n8n-workflow     filter by category
 *   ?featured=1                sales-ranked top products
 *   ?limit=12                  page size (default 24, max 60)
 */

import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/app/api/lib/db';
import { StoreProduct } from '@/features/store/models/StoreProduct';

const PUBLIC_FIELDS =
  'title slug shortDescription category coverImageUrl ' +
  'priceUsdMinor priceInrMinor salesCount tags';

/** The raw Vercel-Blob URL stored in coverImageUrl is private and
 *  not directly fetchable by an `<img src>`. Replace it with the
 *  /api/store/cover/[productId] passthrough so the client can render
 *  it directly, and the underlying blob URL never reaches the wire. */
function publicCoverUrl(rawUrl: string | undefined, id: string): string {
  if (!rawUrl) return '';
  return `/api/store/cover/${id}`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const category = searchParams.get('category');
  const featured = searchParams.get('featured');
  const limit = Math.min(
    60,
    Math.max(1, parseInt(searchParams.get('limit') || '24', 10))
  );

  await connectDB();
  const filter: Record<string, unknown> = { status: 'published' };
  if (category) filter.category = category;

  const sort = featured ? { salesCount: -1 as const } : { createdAt: -1 as const };
  const items = await StoreProduct.find(filter)
    .sort(sort)
    .limit(limit)
    .select(PUBLIC_FIELDS)
    .lean();

  const data = items.map((p) => ({
    ...p,
    coverImageUrl: publicCoverUrl(p.coverImageUrl, String(p._id)),
  }));

  return NextResponse.json({ data });
}
