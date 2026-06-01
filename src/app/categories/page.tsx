import type { Metadata } from 'next';
import CategoriesPageClient from './ClientView';

export const metadata: Metadata = {
  title: 'AI tool categories',
  description: 'Browse 678+ categories of AI tools — find tools for writing, design, code, audio, video, research and more.',
  alternates: { canonical: '/categories' },
  openGraph: { url: '/categories', title: 'AI tool categories', description: 'Browse 678+ categories of AI tools — find tools for writing, design, code, audio, video, research and more.' },
};

export default function CategoriesPage() {
  return <CategoriesPageClient />;
}