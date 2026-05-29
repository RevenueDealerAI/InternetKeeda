'use client';

import { Suspense } from 'react';
import dynamic from 'next/dynamic';
import { usePathname } from 'next/navigation';
import { MetaTagsManager } from '@/components/MetaTagsManager';
import { Analytics } from '@/components/Analytics';
import { AdSense } from '@/components/AdSense';
import { Nav } from '@/components/nexus/Nav';
import { Footer } from '@/components/nexus/Footer';

// KeedaChat lives in its own chunk — it brings localStorage hydration
// + a window event listener that aren't critical-path. Defer it.
const KeedaChat = dynamic(() => import('@/components/nexus/KeedaChat').then(m => m.KeedaChat), {
  ssr: false,
});

interface NextRouterAdapterProps {
  children: React.ReactNode;
}

// Editorial Nav + Footer are now mounted SITE-WIDE so the cinematic
// dark/light theme covers every page consistently. The legacy
// ThemeOneNavigation / ThemeOneFooter / ThemeOneBackgroundAnimation
// (which hardcoded bg-white + orange gradient backdrops) are no longer
// rendered — they fought the theme tokens on every non-home route.
//
// Admin pages keep their own internal layout (no editorial chrome).
export function NextRouterAdapter({ children }: NextRouterAdapterProps) {
  const pathname = usePathname();
  const isAdminRoute = pathname?.startsWith('/admin') || false;

  return (
    <div className="min-h-screen">
      <MetaTagsManager />
      <Analytics />
      <AdSense />

      {!isAdminRoute && <Nav />}

      {/* Suspense wraps children so pages that call useSearchParams()
          (e.g. /payment/return, /subscription/return) can stream during
          static prerender. */}
      <Suspense fallback={null}>{children}</Suspense>

      {!isAdminRoute && <Footer />}
      <KeedaChat />
    </div>
  );
}
