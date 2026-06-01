import type { Metadata } from 'next';
import TopProductsPageClient from './ClientView';

export const metadata: Metadata = {
  title: 'Top AI tools',
  description: 'The highest-rated AI tools across every category — community + editorial picks.',
  alternates: { canonical: '/top-products' },
  openGraph: { url: '/top-products', title: 'Top AI tools', description: 'The highest-rated AI tools across every category — community + editorial picks.' },
};

export default function TopProductsPage() {
  return <TopProductsPageClient />;
}