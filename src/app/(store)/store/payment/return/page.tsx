import type { Metadata } from 'next';
import { Suspense } from 'react';
import { STORE_BRAND } from '@/features/store/config';
import PaymentReturnClient from '@/features/store/components/PaymentReturnClient';

export const metadata: Metadata = {
  title: `Payment confirmation — ${STORE_BRAND.name}`,
  robots: { index: false, follow: false },
};

export const dynamic = 'force-dynamic';

export default function StorePaymentReturnPage() {
  return (
    <Suspense fallback={null}>
      <PaymentReturnClient />
    </Suspense>
  );
}
