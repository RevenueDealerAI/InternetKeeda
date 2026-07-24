import type { Metadata } from 'next';
import { connectDB } from '@/app/api/lib/db';
import { Category } from '@/app/api/models/Category';
import {
  CategoryListSSR,
  type CategoryListItem,
} from '@/components/seo/CategoryListSSR';
import CategoriesPageClient from './ClientView';

// ISR: regenerate the server-rendered category fallback hourly so new
// categories reach the crawler HTML without a redeploy. The interactive
// client grid always fetches live, so real users are never stale.
export const revalidate = 3600;

export const metadata: Metadata = {
  title: 'AI tool categories',
  description: 'Browse 678+ categories of AI tools — find tools for writing, design, code, audio, video, research and more.',
  alternates: { canonical: '/categories' },
  openGraph: { url: '/categories', title: 'AI tool categories', description: 'Browse 678+ categories of AI tools — find tools for writing, design, code, audio, video, research and more.' },
};

/**
 * Server component. Fetches the category list server-side and hands it
 * to the client hub as a server-rendered fallback so the raw HTML
 * carries every /category/{slug} link (soft-404 fix + crawl hub). The
 * interactive themed grid takes over on hydration.
 */
export default async function CategoriesPage() {
  let categories: CategoryListItem[] = [];
  try {
    await connectDB();
    categories = (await Category.find({ isActive: { $ne: false } })
      .select('slug name')
      .sort({ name: 1 })
      .lean()) as CategoryListItem[];
  } catch (e) {
    console.warn('[categories] SSR fetch failed:', e);
  }

  return (
    <CategoriesPageClient
      fallback={
        categories.length > 0 ? (
          <CategoryListSSR categories={categories} />
        ) : undefined
      }
    />
  );
}