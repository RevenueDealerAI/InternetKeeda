import React from 'react';
import { useSponsoredListings } from '@/contexts/SponsoredListingsContext';
import { SponsoredListings } from '@/themes/theme-one/components/SponsoredListings';
import { ThemeTwoSponsoredListings } from '@/themes/theme-two/components/ThemeTwoSponsoredListings';
import { useTheme } from '@/themes/ThemeContext';
import { useSiteConfig } from '@/contexts/SiteConfigContext';
import { AdSenseAdSlot } from './AdSenseAdSlot';

interface AdSlotProps {
  position: 'header' | 'sidebar' | 'content-top' | 'content-middle' | 'content-bottom' | 'footer';
  maxAds?: number;
  className?: string;
  showTitle?: boolean;
}

export const AdSlot: React.FC<AdSlotProps> = ({ 
  position, 
  maxAds = 4,
  className = '',
  showTitle = true
}) => {
  const { listings, isLoading } = useSponsoredListings();
  const { currentTheme } = useTheme();
  const { config } = useSiteConfig();
  const isThemeOne = currentTheme?.id === 'theme-one';

  const adsenseAdUnit = config?.adsenseEnabled && config?.adsenseAdUnits?.find(
    unit => unit.position === position && unit.enabled
  );

  if (adsenseAdUnit && ['header', 'sidebar', 'footer', 'content-top', 'content-bottom'].includes(position)) {
    return (
      <div 
        className={`ad-slot ad-slot-${position} ${className}`}
        data-ad-position={position}
        data-ad-slot={true}
      >
        <AdSenseAdSlot position={position as 'header' | 'sidebar' | 'footer' | 'content-top' | 'content-bottom'} />
      </div>
    );
  }

  if (isLoading || !listings || listings.length === 0) {
    return null;
  }

  const displayListings = listings.slice(0, maxAds);

  const containerClasses = {
    header: 'w-full py-4 border-b border-gray-200 bg-white',
    sidebar: 'w-full py-4 px-4 bg-gray-50 rounded-lg border border-gray-200',
    'content-top': 'w-full py-6 mb-8',
    'content-middle': 'w-full py-8 my-8 border-t border-b border-gray-200',
    'content-bottom': 'w-full py-6 mt-8',
    footer: 'w-full py-4 border-t border-gray-200 bg-gray-50'
  };

  return (
    <div 
      className={`ad-slot ad-slot-${position} ${containerClasses[position]} ${className}`}
      data-ad-position={position}
      data-ad-slot={true}
    >
      {showTitle && position === 'content-top' && (
        <div className="container mx-auto px-4 -mt-12 sm:-mt-4">
          {isThemeOne ? (
            <SponsoredListings listings={displayListings} />
          ) : (
            <ThemeTwoSponsoredListings listings={displayListings} />
          )}
        </div>
      )}
      {position !== 'content-top' && (
        <div className="container mx-auto px-4">
          {isThemeOne ? (
            <SponsoredListings listings={displayListings} />
          ) : (
            <ThemeTwoSponsoredListings listings={displayListings} />
          )}
        </div>
      )}
    </div>
  );
};

