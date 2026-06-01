import type { Metadata } from 'next';
import { connectDB } from '@/app/api/lib/db';
import { NewsPost } from '@/app/api/models/NewsPost';
import { BRAND } from '@/lib/brand';
import ReviewDetailClient from './ClientView';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  let title: string = `Review — ${BRAND.name}`;
  let description: string = BRAND.defaultMetaDescription;
  try {
    await connectDB();
    const post = await NewsPost.findOne({ slug, status: 'published' })
      .select('title excerpt')
      .lean();
    if (post) {
      title = `${post.title} — Reviewed by ${BRAND.name}`;
      const raw = (post.excerpt || '').replace(/\s+/g, ' ');
      description = raw.length > 160 ? `${raw.slice(0, 157)}…` : raw || description;
    }
  } catch (e) {
    console.warn('[reviews/[slug]] generateMetadata DB error:', e);
  }
  return {
    title,
    description,
    alternates: { canonical: `/reviews/${slug}` },
    openGraph: { url: `/reviews/${slug}`, title, description, type: 'article' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function ReviewDetailPage({ params }: RouteParams) {
  const { slug } = await params;
  return <ReviewDetailClient slug={slug} />;
}
