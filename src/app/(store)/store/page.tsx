import type { Metadata } from 'next';
import { STORE_BRAND } from '@/features/store/config';
import StoreLandingClient from '@/features/store/components/StoreLandingClient';

export const metadata: Metadata = {
  title: `${STORE_BRAND.name} — ${STORE_BRAND.tagline}`,
  description: STORE_BRAND.defaultMetaDescription,
  alternates: { canonical: STORE_BRAND.routeBase },
  openGraph: {
    url: STORE_BRAND.routeBase,
    title: `${STORE_BRAND.name} — ${STORE_BRAND.tagline}`,
    description: STORE_BRAND.defaultMetaDescription,
  },
};

export default function StorePage() {
  return <StoreLandingClient />;
}
