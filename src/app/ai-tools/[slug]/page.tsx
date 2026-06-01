import type { Metadata } from 'next';
import { connectDB } from '@/app/api/lib/db';
import { Tool } from '@/app/api/models/Tool';
import { BRAND } from '@/lib/brand';
import AIToolDetailClient from './ClientView';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * Per-tool metadata + canonical URL. Reads the tool name/description
 * from Mongo at request time so each tool detail page emits a unique
 * <title>, <meta description>, and self-referencing canonical
 * pointing at /ai-tools/<slug>. Gracefully degrades to a generic
 * title if the slug doesn't resolve — Next still renders the page
 * (the client view fetches its own data and shows a 404 inline if
 * the API returns nothing).
 */
export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  let title: string = `AI tool · ${BRAND.name}`;
  let description: string = BRAND.defaultMetaDescription;
  try {
    await connectDB();
    const tool = await Tool.findOne({
      slug,
      deletedAt: null,
      status: { $in: ['published', 'approved'] },
    })
      .select('name description description_ai category')
      .lean();
    if (tool) {
      title = `${tool.name} — ${tool.category} on ${BRAND.name}`;
      const rawDesc = (tool.description_ai || tool.description || '').replace(
        /\s+/g,
        ' ',
      );
      description = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}…` : rawDesc;
    }
  } catch (e) {
    // Don't let a metadata DB blip 500 the route — the page itself
    // will render and re-attempt the fetch client-side.
    console.warn('[ai-tools/[slug]] generateMetadata DB error:', e);
  }
  return {
    title,
    description,
    alternates: { canonical: `/ai-tools/${slug}` },
    openGraph: { url: `/ai-tools/${slug}`, title, description, type: 'article' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function AIToolDetailPage({ params }: RouteParams) {
  const { slug } = await params;
  return <AIToolDetailClient slug={slug} />;
}
