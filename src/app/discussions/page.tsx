import type { Metadata } from 'next';
import DiscussionsPageClient from './ClientView';

export const metadata: Metadata = {
  title: 'Community discussions',
  description: 'Conversations about AI tools, workflows, and the indie stack.',
  alternates: { canonical: '/discussions' },
  openGraph: { url: '/discussions', title: 'Community discussions', description: 'Conversations about AI tools, workflows, and the indie stack.' },
};

export default function DiscussionsPage() {
  return <DiscussionsPageClient />;
}