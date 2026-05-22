'use client';

import { ClerkRouteWrapper } from '@/components/ClerkRouteWrapper';
import type { ReactNode } from 'react';

// /payment/return polls /api/payments/status which requires the
// signed-in user. The polling hook reads the Clerk session via
// fetch+credentials, but the return page imports payments hooks
// that may resolve Clerk context. Mount ClerkProvider for the whole
// /payment subtree so any future child route inherits it cleanly.
export default function PaymentLayout({ children }: { children: ReactNode }) {
  return <ClerkRouteWrapper>{children}</ClerkRouteWrapper>;
}
