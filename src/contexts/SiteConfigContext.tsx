import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

// Import the SiteConfig type from the settings page
import { SiteConfig } from '@/types/siteConfig';

type SiteConfigContextType = {
  config: SiteConfig | null;
  loading: boolean;
  error: string | null;
  refreshConfig: () => Promise<void>;
  lastRefreshTime: number;
};

const SiteConfigContext = createContext<SiteConfigContextType | undefined>(undefined);

const defaultConfig: SiteConfig = {
  siteName: 'Internet Keeda',
  siteDescription: 'A hand-curated directory of the best AI tools, updated daily.',
  logo: '',
  logoLight: '',
  logoDark: '',
  favicon: '/favicon.ico',
  primaryColor: '#DC2626',
  secondaryColor: '#0F172A',
  allowUserRegistration: true,
  allowUserSubmissions: true,
  requireApprovalForSubmissions: true,
  requireApprovalForReviews: true,
  footerText: `© ${new Date().getFullYear()} Internet Keeda. All rights reserved.`,
  contactEmail: '',
  socialLinks: {
    twitter: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    github: ''
  },
  analyticsId: '',
  customCss: '',
  customJs: '',
  adsenseEnabled: false,
  adsensePublisherId: '',
  adsenseAutoAds: true,
  adsenseAdUnits: [],
  metaTags: {
    title: 'Internet Keeda — Discover the Best AI Tools',
    description: 'A hand-curated directory of the best AI tools for builders, marketers, and creators. Updated daily.',
    keywords: 'AI tools directory, best AI tools, AI software, AI for productivity, AI for creators',
    ogImage: '/og-image.svg'
  },
  defaultTheme: 'system',
  allowThemeToggle: true,
  activeTheme: 'theme-one'
};

export const SiteConfigProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [config, setConfig] = useState<SiteConfig | null>(defaultConfig);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [lastRefreshTime, setLastRefreshTime] = useState<number>(Date.now());
  const [isInitialized, setIsInitialized] = useState(false);

  const refreshConfig = useCallback(async (isBackgroundRefresh = false) => {
    if (!isBackgroundRefresh) {
      setLoading(true);
    }
    setError(null);
    
    try {
      const response = await axios.get(`/api/config`, {
        params: { _t: Date.now() },
        timeout: 5000,
        headers: {
          'Cache-Control': 'no-cache'
        }
      });
      
      // Normalize config, especially legacy values like ogImage JPG path
      const rawConfig = response.data as SiteConfig;
      const normalizedMetaTags: SiteConfig['metaTags'] = {
        title: rawConfig.metaTags?.title || defaultConfig.metaTags.title,
        description: rawConfig.metaTags?.description || defaultConfig.metaTags.description,
        keywords: rawConfig.metaTags?.keywords || defaultConfig.metaTags.keywords,
        ogImage: rawConfig.metaTags?.ogImage || defaultConfig.metaTags.ogImage,
      };
      if (normalizedMetaTags.ogImage === '/og-image.jpg') {
        normalizedMetaTags.ogImage = '/og-image.svg';
      }
      const normalizedConfig: SiteConfig = {
        ...rawConfig,
        metaTags: normalizedMetaTags,
      };

      setConfig(normalizedConfig);
      setLastRefreshTime(Date.now());
      setIsInitialized(true);
    } catch (err: unknown) {
      if (!isBackgroundRefresh) {
        if (axios.isAxiosError(err) && err.code === 'ECONNABORTED') {
          setError('Configuration request timed out. Using cached/default configuration.');
        } else {
          setError('Failed to load site configuration. Using defaults.');
        }
        setConfig(prevConfig => prevConfig || defaultConfig);
        setIsInitialized(true);
      }
    } finally {
      if (!isBackgroundRefresh) {
        setLoading(false);
      }
    }
  }, []);

  useEffect(() => {
    refreshConfig();
  }, [refreshConfig]);

  useEffect(() => {
    const intervalId = setInterval(() => {
      refreshConfig(true);
    }, 30 * 60 * 1000);

    return () => clearInterval(intervalId);
  }, [refreshConfig]);

  const value = React.useMemo(() => ({
    config: config || defaultConfig,
    loading,
    error,
    refreshConfig,
    lastRefreshTime
  }), [config, loading, error, refreshConfig, lastRefreshTime]);

  return (
    <SiteConfigContext.Provider value={value}>
      {children}
    </SiteConfigContext.Provider>
  );
};

export const useSiteConfig = (): SiteConfigContextType => {
  const context = useContext(SiteConfigContext);
  
  if (context === undefined) {
    throw new Error('useSiteConfig must be used within a SiteConfigProvider');
  }
  
  return context;
}; 