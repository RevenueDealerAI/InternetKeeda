import type { Metadata } from 'next';
import FAQPageClient from './ClientView';

export const metadata: Metadata = {
  title: 'FAQ',
  description: 'Frequently asked questions about listing, boosting, and using Internet Keeda.',
  alternates: { canonical: '/faq' },
  openGraph: { url: '/faq', title: 'FAQ', description: 'Frequently asked questions about listing, boosting, and using Internet Keeda.' },
};

export default function FAQPage() {
  return <FAQPageClient />;
}