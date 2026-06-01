import type { Metadata } from 'next';
import BestAIMeetingToolsPageClient from './ClientView';

export const metadata: Metadata = {
  title: 'Best AI meeting tools',
  description: 'Best AI meeting tools — hand-picked, ranked, and reviewed by Internet Keeda.',
  alternates: { canonical: '/best-ai-meeting-tools' },
  openGraph: { url: '/best-ai-meeting-tools', title: 'Best AI meeting tools', description: 'Best AI meeting tools — hand-picked, ranked, and reviewed by Internet Keeda.' },
};

export default function BestAIMeetingToolsPage() {
  return <BestAIMeetingToolsPageClient />;
}