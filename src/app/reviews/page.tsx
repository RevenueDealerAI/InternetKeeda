import type { Metadata } from 'next';
import ReviewsPageClient from './ClientView';

export const metadata: Metadata = {
  title: 'AI tool reviews',
  description: 'Independent reviews of AI tools by Internet Keeda — real workflows, real failure modes, no marketing reprints.',
  alternates: { canonical: '/reviews' },
  openGraph: { url: '/reviews', title: 'AI tool reviews', description: 'Independent reviews of AI tools by Internet Keeda — real workflows, real failure modes, no marketing reprints.' },
};

export default function ReviewsPage() {
  return <ReviewsPageClient />;
}