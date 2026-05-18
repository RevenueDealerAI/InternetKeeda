'use client';

import React, { Suspense } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSiteConfig } from '@/contexts/SiteConfigContext';

function AdSenseContent() {
  const { config } = useSiteConfig();

  if (!config?.adsenseEnabled || !config?.adsensePublisherId) {
    return null;
  }

  const publisherId = config.adsensePublisherId;

  return (
    <Helmet>
      <script
        async
        src={`https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${publisherId}`}
        crossOrigin="anonymous"
      />
    </Helmet>
  );
}

export const AdSense: React.FC = () => {
  return (
    <Suspense fallback={null}>
      <AdSenseContent />
    </Suspense>
  );
};




