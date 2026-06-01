import type { Metadata } from 'next';
import TrendingPageClient from './ClientView';

export const metadata: Metadata = {
  title: 'Trending AI tools',
  description: 'AI tools rising on Internet Keeda — ranked by votes, views, and editorial picks.',
  alternates: { canonical: '/trending' },
  openGraph: { url: '/trending', title: 'Trending AI tools', description: 'AI tools rising on Internet Keeda — ranked by votes, views, and editorial picks.' },
};

export default function TrendingPage() {
  return <TrendingPageClient />;
}