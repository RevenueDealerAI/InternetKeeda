import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connectDB } from '@/app/api/lib/db';
import { StoreProduct } from '@/features/store/models/StoreProduct';
import { STORE_BRAND } from '@/features/store/config';
import ProductDetailSSR from '@/features/store/components/ProductDetailSSR';
import type { StoreProductDetail } from '@/features/store/types';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/** PUBLIC fields only — mirrors /api/store/products/[slug]. `filePath`
 *  (private blob URL) is NEVER selected, so it cannot reach the client
 *  even though this is server-rendered. */
const PUBLIC_FIELDS =
  'title slug description shortDescription category coverImageUrl ' +
  'previewImages priceUsdMinor priceInrMinor salesCount tags includes ' +
  'fileName fileSizeBytes';

/** Load a published product for SSR. Returns the public-shaped detail
 *  object (the same one the client API returns) or null when missing. */
async function loadProduct(slug: string): Promise<StoreProductDetail | null> {
  try {
    await connectDB();
    const doc = await StoreProduct.findOne({ slug, status: 'published' })
      .select(PUBLIC_FIELDS)
      .lean();
    if (!doc) return null;
    const id = String(doc._id);
    return {
      _id: id,
      title: doc.title,
      slug: doc.slug,
      description: doc.description,
      shortDescription: doc.shortDescription || '',
      category: doc.category,
      // Map the private-blob cover to the public passthrough BEFORE it
      // enters component props. Server-component props are serialized
      // into the RSC payload embedded in the HTML, so passing the raw
      // blob URL here would leak it into page source. Mirrors the exact
      // transform /api/store/products/[slug] applies.
      coverImageUrl: doc.coverImageUrl ? `/api/store/cover/${id}` : null,
      previewImages: doc.previewImages || [],
      priceUsdMinor: doc.priceUsdMinor,
      priceInrMinor: doc.priceInrMinor,
      salesCount: doc.salesCount || 0,
      tags: doc.tags || [],
      includes: doc.includes || [],
      fileName: doc.fileName,
      fileSizeBytes: doc.fileSizeBytes || 0,
    };
  } catch (e) {
    console.warn('[store/[slug]] loadProduct error:', e);
    return null;
  }
}

export async function generateMetadata({
  params,
}: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  let title: string = `${STORE_BRAND.name} — workflow`;
  let description: string = STORE_BRAND.defaultMetaDescription;
  try {
    await connectDB();
    const doc = await StoreProduct.findOne({ slug, status: 'published' })
      .select('title shortDescription description')
      .lean();
    if (doc) {
      title = `${doc.title} — ${STORE_BRAND.name}`;
      const raw = (doc.shortDescription || doc.description || '')
        .replace(/\s+/g, ' ')
        .trim();
      description = raw.length > 160 ? `${raw.slice(0, 157)}…` : raw || description;
    }
  } catch (e) {
    console.warn('[store/[slug]] generateMetadata error:', e);
  }
  return {
    title,
    description,
    alternates: { canonical: `${STORE_BRAND.routeBase}/${slug}` },
    openGraph: {
      url: `${STORE_BRAND.routeBase}/${slug}`,
      title,
      description,
      type: 'article',
    },
  };
}

export default async function StoreProductPage({ params }: RouteParams) {
  const { slug } = await params;
  const product = await loadProduct(slug);
  if (!product) notFound();
  return <ProductDetailSSR product={product} />;
}
