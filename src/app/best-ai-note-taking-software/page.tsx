import type { Metadata } from 'next';
import BestAINoteTakingSoftwarePageClient from './ClientView';

export const metadata: Metadata = {
  title: 'Best AI note-taking software',
  description: 'Best AI note-taking software — hand-picked, ranked, and reviewed by Internet Keeda.',
  alternates: { canonical: '/best-ai-note-taking-software' },
  openGraph: { url: '/best-ai-note-taking-software', title: 'Best AI note-taking software', description: 'Best AI note-taking software — hand-picked, ranked, and reviewed by Internet Keeda.' },
};

export default function BestAINoteTakingSoftwarePage() {
  return <BestAINoteTakingSoftwarePageClient />;
}