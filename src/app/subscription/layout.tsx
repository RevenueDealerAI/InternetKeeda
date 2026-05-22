'use client';

import { ClerkRouteWrapper } from '@/components/ClerkRouteWrapper';
import type { ReactNode } from 'react';

// /subscription/return polls /api/subscriptions/status while
// authenticated. Mount ClerkProvider for the /subscription subtree
// so the page (and any sibling routes added later) inherit it.
export default function SubscriptionLayout({ children }: { children: ReactNode }) {
  return <ClerkRouteWrapper>{children}</ClerkRouteWrapper>;
}
