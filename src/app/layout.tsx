'use client';

import { Geist, Geist_Mono, Instrument_Serif, JetBrains_Mono } from 'next/font/google';
import { SpiderWeb } from '@/components/editorial/SpiderWeb';
import { RoamingSpider } from '@/components/editorial/RoamingSpider';
import { ThemeToggle } from '@/components/editorial/ThemeToggle';

// No-FOUC theme init — runs BEFORE React hydrates so the page paints
// with the user's preferred theme on the first frame, no flash.
const THEME_INIT_SCRIPT = `
(function(){try{
  var saved=localStorage.getItem('ik-theme');
  var mql=window.matchMedia('(prefers-color-scheme: dark)');
  var theme=(saved==='dark'||saved==='light')?saved:(mql.matches?'dark':'light');
  document.documentElement.setAttribute('data-theme',theme);
}catch(e){document.documentElement.setAttribute('data-theme','light');}})();
`;
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { HelmetProvider } from 'react-helmet-async';
import { SponsoredListingsProvider } from '../contexts/SponsoredListingsContext';
import { SoftwarePagesProvider } from '../contexts/SoftwarePagesContext';
import { SiteConfigProvider } from '../contexts/SiteConfigContext';
import { AuthProvider } from "../contexts/AuthContext";
import { ThemeProvider } from '../themes/ThemeContext';
import { AuthModalManager } from "../components/AuthModalManager";
import { AffiliateTracker } from '../components/AffiliateTracker';
import { IframeDetectionBanner } from '../components/IframeDetectionBanner';
import { NextRouterAdapter } from './NextRouterAdapter';
import { PageTransition } from '../components/PageTransition';
import { ScrollProgress } from '@/themes/theme-one/components/ScrollProgress';
import { HeadFavicons } from '../components/HeadFavicons';
import { MobileSearchFab } from '../components/MobileSearchFab';
import { useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { initializeVoteCounts } from '../utils/voteUtils';
import '../index.css';

const geistSans = Geist({
  subsets: ['latin'],
  variable: '--font-geist-sans',
  display: 'swap',
});
const geistMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-geist-mono',
  display: 'swap',
});
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  variable: '--font-instrument-serif',
  display: 'swap',
});
const jetbrainsMono = JetBrains_Mono({
  subsets: ['latin'],
  variable: '--font-jetbrains-mono',
  display: 'swap',
});

const queryClient = new QueryClient();

function ScrollBehaviorFix() {
  const pathname = usePathname();

  useEffect(() => {
    const resetScrollStyles = () => {
      // Specifically ensure overflow and height don't block scrolling
      // without wiping out all inline styles (which breaks modal libraries like Radix)
      if (typeof window !== 'undefined') {
        document.body.style.overflow = 'auto';
        document.body.style.height = 'auto';
        document.documentElement.style.overflow = 'auto';
        document.documentElement.style.height = 'auto';

        document.body.classList.remove('overflow-hidden', 'fixed');
        document.documentElement.classList.remove('overflow-hidden', 'fixed');

        window.scrollTo({
          top: 0,
          left: 0,
          behavior: 'instant'
        });
      }
    };

    resetScrollStyles();

    const timeoutId = setTimeout(() => {
      resetScrollStyles();
      window.scrollTo(0, 0);
    }, 100);

    return () => {
      clearTimeout(timeoutId);
    };
  }, [pathname]);

  return null;
}

function AppInitializer() {
  useEffect(() => {
    console.log('App useEffect: Initializing app-level configurations.');
    initializeVoteCounts();
  }, []);

  return null;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable} ${instrumentSerif.variable} ${jetbrainsMono.variable}`}>
      <head>
        {/* No-FOUC theme init — must run synchronously before <body> */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased bg-background text-foreground">
        <div className="ik-film-grain" aria-hidden="true" />
        <SpiderWeb />
        <RoamingSpider />
        <ThemeToggle />
        <HelmetProvider>
          <HeadFavicons />
          {/* ClerkProvider is NOT mounted at the root anymore.
            * Public routes (home, category, trending, tool list, etc.)
            * use cookie-based useClerkSession() instead and never load
            * the Clerk SDK. Routes that genuinely need Clerk
            * (/sign-in, /sign-up, /dashboard, /admin, /verify-email,
            * /advertise, /ai-tools/[slug], /news/[slug]) each have a
            * per-route layout.tsx that wraps in ClerkRouteWrapper. */}
          <SiteConfigProvider>
            <AuthProvider>
              <AffiliateTracker />
              <SponsoredListingsProvider>
                <SoftwarePagesProvider>
                  <ThemeProvider>
                    <QueryClientProvider client={queryClient}>
                      <TooltipProvider>
                        <AppInitializer />
                        <ScrollBehaviorFix />
                        <ScrollProgress />
                        <NextRouterAdapter>
                          <PageTransition>{children}</PageTransition>
                        </NextRouterAdapter>
                        <MobileSearchFab />
                        <Toaster />
                        <Sonner position="top-right" />
                        <AuthModalManager />
                        <IframeDetectionBanner />
                      </TooltipProvider>
                    </QueryClientProvider>
                  </ThemeProvider>
                </SoftwarePagesProvider>
              </SponsoredListingsProvider>
            </AuthProvider>
          </SiteConfigProvider>
        </HelmetProvider>
      </body>
    </html>
  );
}
