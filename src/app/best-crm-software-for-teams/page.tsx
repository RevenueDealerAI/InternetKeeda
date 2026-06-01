import type { Metadata } from 'next';
import BestCRMSoftwareForTeamsPageClient from './ClientView';

export const metadata: Metadata = {
  title: 'Best CRM software for teams',
  description: 'Best CRM software for teams — hand-picked, ranked, and reviewed by Internet Keeda.',
  alternates: { canonical: '/best-crm-software-for-teams' },
  openGraph: { url: '/best-crm-software-for-teams', title: 'Best CRM software for teams', description: 'Best CRM software for teams — hand-picked, ranked, and reviewed by Internet Keeda.' },
};

export default function BestCRMSoftwareForTeamsPage() {
  return <BestCRMSoftwareForTeamsPageClient />;
}