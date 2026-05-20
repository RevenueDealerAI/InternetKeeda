'use client';

import { ClerkRouteWrapper } from '@/components/ClerkRouteWrapper';
import type { ReactNode } from 'react';

export default function SignUpLayout({ children }: { children: ReactNode }) {
  return <ClerkRouteWrapper>{children}</ClerkRouteWrapper>;
}
