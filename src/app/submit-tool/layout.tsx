'use client';

import { ClerkRouteWrapper } from '@/components/ClerkRouteWrapper';
import type { ReactNode } from 'react';

// /submit-tool calls useUser() to gate the form. Without this wrapper
// the page crashes on first paint with "useUser can only be used
// within the <ClerkProvider /> component." — the root layout drops
// ClerkProvider on public routes per the lazy-load refactor.
export default function SubmitToolLayout({ children }: { children: ReactNode }) {
  return <ClerkRouteWrapper>{children}</ClerkRouteWrapper>;
}
