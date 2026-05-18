'use client';

import React, { useEffect, Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSiteConfig } from '@/contexts/SiteConfigContext';
import { usePathname, useSearchParams } from 'next/navigation';

function AnalyticsContent() {
  const { config } = useSiteConfig();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  // Track page views when the location changes
  useEffect(() => {
    if (config?.analyticsId && typeof window !== 'undefined' && 'gtag' in window && typeof (window as { gtag?: unknown }).gtag === 'function') {
      const search = searchParams ? `?${searchParams.toString()}` : '';
      (window as { gtag: (command: string, targetId: string, config?: Record<string, unknown>) => void }).gtag('config', config.analyticsId, {
        page_path: (pathname || '/') + search,
      });
    }
  }, [pathname, searchParams, config?.analyticsId]);

  // Don't render anything if no analytics ID is provided
  if (!config?.analyticsId) {
    return null;
  }

  return (
    <Helmet>
      {/* Global Site Tag (gtag.js) - Google Analytics */}
      <script async src={`https://www.googletagmanager.com/gtag/js?id=${config.analyticsId}`}></script>
      <script>
        {`
          window.dataLayer = window.dataLayer || [];
          function gtag(){dataLayer.push(arguments);}
          gtag('js', new Date());
          gtag('config', '${config.analyticsId}');
        `}
      </script>
    </Helmet>
  );
}

export const Analytics: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <AnalyticsContent />
    </Suspense>
  );
}; 