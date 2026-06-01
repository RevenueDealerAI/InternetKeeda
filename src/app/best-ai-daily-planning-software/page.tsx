import type { Metadata } from 'next';
import BestAIDailyPlanningSoftwarePageClient from './ClientView';

export const metadata: Metadata = {
  title: 'Best AI daily planning software',
  description: 'Best AI daily planning software — hand-picked, ranked, and reviewed by Internet Keeda.',
  alternates: { canonical: '/best-ai-daily-planning-software' },
  openGraph: { url: '/best-ai-daily-planning-software', title: 'Best AI daily planning software', description: 'Best AI daily planning software — hand-picked, ranked, and reviewed by Internet Keeda.' },
};

export default function BestAIDailyPlanningSoftwarePage() {
  return <BestAIDailyPlanningSoftwarePageClient />;
}