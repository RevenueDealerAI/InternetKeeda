import type { Metadata } from 'next';
import BlogPageClient from './ClientView';

export const metadata: Metadata = {
  title: 'Blog — long-form on AI',
  description: 'Long-form writing on AI tools, workflows, and the indie operator stack.',
  alternates: { canonical: '/blog' },
  openGraph: { url: '/blog', title: 'Blog — long-form on AI', description: 'Long-form writing on AI tools, workflows, and the indie operator stack.' },
};

export default function BlogPage() {
  return <BlogPageClient />;
}