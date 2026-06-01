import type { Metadata } from 'next';
import BestAIEmailManagementToolsPageClient from './ClientView';

export const metadata: Metadata = {
  title: 'Best AI email management tools',
  description: 'Best AI email management tools — hand-picked, ranked, and reviewed by Internet Keeda.',
  alternates: { canonical: '/best-ai-email-management-tools' },
  openGraph: { url: '/best-ai-email-management-tools', title: 'Best AI email management tools', description: 'Best AI email management tools — hand-picked, ranked, and reviewed by Internet Keeda.' },
};

export default function BestAIEmailManagementToolsPage() {
  return <BestAIEmailManagementToolsPageClient />;
}