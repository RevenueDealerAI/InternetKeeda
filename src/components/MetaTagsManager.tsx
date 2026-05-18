import React, { useEffect } from 'react';
import { Helmet } from 'react-helmet-async';
import { useSiteConfig } from '@/contexts/SiteConfigContext';

export const MetaTagsManager: React.FC = () => {
  const { config } = useSiteConfig();

  useEffect(() => {
    // Force favicon update when config changes
    if (config?.favicon) {
      // Force browser to update favicon by removing and re-adding
      const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
      existingFavicons.forEach(link => link.remove());
      
      // Add new favicon immediately
      const newFavicon = document.createElement('link');
      newFavicon.rel = 'icon';
      newFavicon.type = config.favicon.includes('.ico') ? 'image/x-icon' : 'image/png';
      newFavicon.href = `${config.favicon}?v=${Date.now()}`;
      document.head.appendChild(newFavicon);
      
      // Also add shortcut icon for better compatibility
      const shortcutIcon = document.createElement('link');
      shortcutIcon.rel = 'shortcut icon';
      shortcutIcon.type = config.favicon.includes('.ico') ? 'image/x-icon' : 'image/png';
      shortcutIcon.href = `${config.favicon}?v=${Date.now()}`;
      document.head.appendChild(shortcutIcon);
    }
  }, [config?.metaTags, config?.favicon]);

  if (!config || !config.metaTags) {
    return null;
  }

  return (
    <Helmet>
      {/* Primary meta tags */}
      <title>{config.metaTags.title}</title>
      <meta name="description" content={config.metaTags.description} />
      <meta name="keywords" content={config.metaTags.keywords} />
      
      {/* OpenGraph meta tags */}
      <meta property="og:title" content={config.metaTags.title} />
      <meta property="og:description" content={config.metaTags.description} />
      {config.metaTags.ogImage && <meta property="og:image" content={config.metaTags.ogImage} />}
      <meta property="og:type" content="website" />
      
      {/* Favicon with cache busting and proper type detection */}
      {config.favicon && (
        <>
          <link 
            rel="icon" 
            type={config.favicon.includes('.ico') ? 'image/x-icon' : 'image/png'} 
            href={`${config.favicon}?v=${Date.now()}`} 
          />
          <link 
            rel="shortcut icon" 
            type={config.favicon.includes('.ico') ? 'image/x-icon' : 'image/png'} 
            href={`${config.favicon}?v=${Date.now()}`} 
          />
        </>
      )}
      
      {/* Apply custom CSS if available */}
      {config.customCss && (
        <style type="text/css">
          {config.customCss}
        </style>
      )}
      
      {/* Apply custom JS if available */}
      {config.customJs && (
        <script type="text/javascript">
          {config.customJs}
        </script>
      )}
    </Helmet>
  );
}; 