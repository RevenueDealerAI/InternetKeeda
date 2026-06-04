import type { Metadata } from 'next';
import { connectDB } from '@/app/api/lib/db';
import { StoreProduct } from '@/features/store/models/StoreProduct';
import { STORE_BRAND } from '@/features/store/config';
import ProductDetailClient from '@/features/store/components/ProductDetailClient';

interface RouteParams {
  params: Promise<{ slug: string }>;
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
  return <ProductDetailClient slug={slug} />;
}
