import type { Metadata } from 'next';
import { connectDB } from '@/app/api/lib/db';
import { BlogPost } from '@/app/api/models/BlogPost';
import { BRAND } from '@/lib/brand';
import BlogPostClient from './ClientView';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  let title: string = `Blog post — ${BRAND.name}`;
  let description: string = BRAND.defaultMetaDescription;
  try {
    await connectDB();
    const post = await BlogPost.findOne({ slug, status: 'published' })
      .select('title excerpt')
      .lean();
    if (post) {
      title = `${post.title} — ${BRAND.name}`;
      const raw = (post.excerpt || '').replace(/\s+/g, ' ');
      description = raw.length > 160 ? `${raw.slice(0, 157)}…` : raw || description;
    }
  } catch (e) {
    console.warn('[blog/[slug]] generateMetadata DB error:', e);
  }
  return {
    title,
    description,
    alternates: { canonical: `/blog/${slug}` },
    openGraph: { url: `/blog/${slug}`, title, description, type: 'article' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function BlogPostPage({ params }: RouteParams) {
  const { slug } = await params;
  return <BlogPostClient slug={slug} />;
}
