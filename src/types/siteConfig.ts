// Shared SiteConfig type definition
export interface SiteConfig {
  _id?: string;
  siteName: string;
  siteDescription: string;
  logo: string;
  logoLight: string;
  logoDark: string;
  favicon: string;
  primaryColor: string;
  secondaryColor: string;
  allowUserRegistration: boolean;
  allowUserSubmissions: boolean;
  requireApprovalForSubmissions: boolean;
  requireApprovalForReviews: boolean;
  footerText: string;
  contactEmail: string;
  showSiteNameWithLogo?: boolean;
  activeTheme?: string; // Admin-selected theme
  socialLinks: {
    twitter: string;
    facebook: string;
    instagram: string;
    linkedin: string;
    github: string;
  };
  analyticsId: string;
  customCss: string;
  customJs: string;
  adsenseEnabled?: boolean;
  adsensePublisherId?: string;
  adsenseAutoAds?: boolean;
  adsenseAdUnits?: Array<{
    id: string;
    adUnitId: string;
    position: 'header' | 'sidebar' | 'footer' | 'content-top' | 'content-bottom';
    enabled: boolean;
  }>;
  metaTags: {
    title: string;
    description: string;
    keywords: string;
    ogImage: string;
  };
  seoSettings?: {
    enableSitemap: boolean;
    enableRobotsTxt: boolean;
    robotsTxtContent: string;
  };
  features?: {
    enableBlog: boolean;
    enableNews: boolean;
    enableNewsletter: boolean;
    enableDiscussions: boolean;
    enableEvents: boolean;
  };
  integrations?: {
    googleAnalytics: string;
    googleTagManager: string;
    facebookPixel: string;
    customScripts: string;
  };
  defaultTheme?: 'light' | 'dark' | 'system';
  allowThemeToggle?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

