import type { Metadata } from 'next';
import BestProductivityToolsForADHDPageClient from './ClientView';

export const metadata: Metadata = {
  title: 'Best productivity tools for ADHD',
  description: 'Best productivity tools for ADHD — hand-picked, ranked, and reviewed by Internet Keeda.',
  alternates: { canonical: '/best-productivity-tools-for-adhd' },
  openGraph: { url: '/best-productivity-tools-for-adhd', title: 'Best productivity tools for ADHD', description: 'Best productivity tools for ADHD — hand-picked, ranked, and reviewed by Internet Keeda.' },
};

export default function BestProductivityToolsForADHDPage() {
  return <BestProductivityToolsForADHDPageClient />;
}