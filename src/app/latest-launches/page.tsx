import type { Metadata } from 'next';
import LatestLaunchesPageClient from './ClientView';

export const metadata: Metadata = {
  title: 'Latest AI tool launches',
  description: 'New AI tools that shipped this week — fresh launches indexed daily.',
  alternates: { canonical: '/latest-launches' },
  openGraph: { url: '/latest-launches', title: 'Latest AI tool launches', description: 'New AI tools that shipped this week — fresh launches indexed daily.' },
};

export default function LatestLaunchesPage() {
  return <LatestLaunchesPageClient />;
}