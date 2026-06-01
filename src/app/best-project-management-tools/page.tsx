import type { Metadata } from 'next';
import BestProjectManagementToolsPageClient from './ClientView';

export const metadata: Metadata = {
  title: 'Best project management tools',
  description: 'Best project management tools — hand-picked, ranked, and reviewed by Internet Keeda.',
  alternates: { canonical: '/best-project-management-tools' },
  openGraph: { url: '/best-project-management-tools', title: 'Best project management tools', description: 'Best project management tools — hand-picked, ranked, and reviewed by Internet Keeda.' },
};

export default function BestProjectManagementToolsPage() {
  return <BestProjectManagementToolsPageClient />;
}