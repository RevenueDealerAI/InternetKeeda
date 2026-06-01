import type { Metadata } from 'next';
import { connectDB } from '@/app/api/lib/db';
import { Category } from '@/app/api/models/Category';
import { BRAND } from '@/lib/brand';
import CategoryDetailClient from './ClientView';

interface RouteParams {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { id } = await params;
  let title: string = `${id} — AI tools on ${BRAND.name}`;
  let description: string = `AI tools in the ${id} category on ${BRAND.name}.`;
  try {
    await connectDB();
    const cat = await Category.findOne({ slug: id }).select('name description').lean();
    if (cat) {
      title = `${cat.name} — AI tools on ${BRAND.name}`;
      description =
        (cat as { description?: string }).description ||
        `AI tools in the ${cat.name} category on ${BRAND.name}.`;
    }
  } catch (e) {
    console.warn('[category/[id]] generateMetadata DB error:', e);
  }
  return {
    title,
    description,
    alternates: { canonical: `/category/${id}` },
    openGraph: { url: `/category/${id}`, title, description, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

export default async function CategoryDetailPage({ params }: RouteParams) {
  const { id } = await params;
  return <CategoryDetailClient id={id} />;
}
