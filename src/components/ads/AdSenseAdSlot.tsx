'use client';

import React, { useEffect, useRef } from 'react';
import { useSiteConfig } from '@/contexts/SiteConfigContext';

interface AdSenseAdSlotProps {
  position: 'header' | 'sidebar' | 'footer' | 'content-top' | 'content-middle' | 'content-bottom';
  format?: 'auto' | 'rectangle' | 'vertical' | 'horizontal';
  className?: string;
}

export const AdSenseAdSlot: React.FC<AdSenseAdSlotProps> = ({ 
  position, 
  format = 'auto',
  className = '' 
}) => {
  const { config } = useSiteConfig();
  const adSlotRef = useRef<HTMLDivElement>(null);
  const initializedRef = useRef(false);

  useEffect(() => {
    if (!config?.adsenseEnabled || !config?.adsensePublisherId) {
      return;
    }

    const adUnit = config.adsenseAdUnits?.find(
      unit => unit.position === position && unit.enabled
    );

    if (!adUnit || initializedRef.current) {
      return;
    }

    const initializeAd = () => {
      if (typeof window !== 'undefined' && (window as any).adsbygoogle) {
        try {
          ((window as any).adsbygoogle = (window as any).adsbygoogle || []).push({});
          initializedRef.current = true;
        } catch (e) {
          console.error('AdSense initialization error:', e);
        }
      } else {
        setTimeout(initializeAd, 100);
      }
    };

    initializeAd();
  }, [config, position]);

  if (!config?.adsenseEnabled || !config?.adsensePublisherId) {
    return null;
  }

  const adUnit = config.adsenseAdUnits?.find(
    unit => unit.position === position && unit.enabled
  );

  if (!adUnit) {
    return null;
  }

  return (
    <div className={`adsense-ad-slot adsense-${position} ${className}`} ref={adSlotRef}>
      <ins
        className="adsbygoogle"
        style={{ display: 'block' }}
        data-ad-client={config.adsensePublisherId}
        data-ad-slot={adUnit.adUnitId}
        data-ad-format={format}
        data-full-width-responsive="true"
      />
    </div>
  );
};




