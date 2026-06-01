import type { Metadata } from 'next';
import EventsPageClient from './ClientView';

export const metadata: Metadata = {
  title: 'AI events',
  description: 'Conferences, meetups, launches — AI events worth tracking.',
  alternates: { canonical: '/events' },
  openGraph: { url: '/events', title: 'AI events', description: 'Conferences, meetups, launches — AI events worth tracking.' },
};

export default function EventsPage() {
  return <EventsPageClient />;
}