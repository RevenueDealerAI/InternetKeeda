import type { Metadata } from 'next';
import GuidesPageClient from './ClientView';

export const metadata: Metadata = {
  title: 'AI guides',
  description: 'Practical guides for getting the most out of AI tools, written for operators who ship.',
  alternates: { canonical: '/guides' },
  openGraph: { url: '/guides', title: 'AI guides', description: 'Practical guides for getting the most out of AI tools, written for operators who ship.' },
};

export default function GuidesPage() {
  return <GuidesPageClient />;
}