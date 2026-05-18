import React from 'react';
import type { SponsoredListing } from '@/themes/theme-one/components/SponsoredListings';

interface AdContainerProps {
  position: 'header' | 'sidebar' | 'content-top' | 'content-middle' | 'content-bottom' | 'footer';
  children?: React.ReactNode;
  className?: string;
  maxAds?: number;
  listings?: SponsoredListing[];
}

export const AdContainer: React.FC<AdContainerProps> = ({ 
  position, 
  children, 
  className = '',
  maxAds = 1,
  listings = []
}) => {
  const containerClasses = {
    header: 'w-full py-4 border-b border-gray-200 bg-white',
    sidebar: 'w-full py-4 px-4 bg-gray-50 rounded-lg border border-gray-200',
    'content-top': 'w-full py-6 mb-8',
    'content-middle': 'w-full py-8 my-8 border-t border-b border-gray-200',
    'content-bottom': 'w-full py-6 mt-8',
    footer: 'w-full py-4 border-t border-gray-200 bg-gray-50'
  };

  const displayListings = listings.slice(0, maxAds);

  if (!children && (!listings || listings.length === 0)) {
    return null;
  }

  return (
    <div 
      className={`ad-container ad-${position} ${containerClasses[position]} ${className}`}
      data-ad-position={position}
    >
      {children || (
        displayListings.length > 0 && (
          <div className="ad-content">
            {displayListings.map((listing) => (
              <div key={listing.id} className="ad-item">
              </div>
            ))}
          </div>
        )
      )}
    </div>
  );
};

