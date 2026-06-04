import type { Metadata } from 'next';
import { STORE_BRAND } from '@/features/store/config';
import MyDownloadsClient from '@/features/store/components/MyDownloadsClient';

export const metadata: Metadata = {
  title: `My downloads — ${STORE_BRAND.name}`,
  description: `Your library of ${STORE_BRAND.name} workflow purchases.`,
  alternates: { canonical: `${STORE_BRAND.routeBase}/my-downloads` },
  robots: { index: false, follow: false },
};

export default function MyDownloadsPage() {
  return <MyDownloadsClient />;
}
