import type { Metadata } from 'next';
import UpcomingPageClient from './ClientView';

export const metadata: Metadata = {
  title: 'Recently added AI tools',
  description: 'The newest submissions to Internet Keeda — added in the last 30 days.',
  alternates: { canonical: '/recently-added' },
  openGraph: { url: '/recently-added', title: 'Recently added AI tools', description: 'The newest submissions to Internet Keeda — added in the last 30 days.' },
};

export default function UpcomingPage() {
  return <UpcomingPageClient />;
}