'use client';

import { Geist, Geist_Mono } from 'next/font/google';
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
import { ConditionalClerkProvider } from '../components/ConditionalClerkProvider';
import { NextRouterAdapter } from './NextRouterAdapter';
import { PageTransition } from '../components/PageTransition';
import { ScrollProgress } from '@/themes/theme-one/components/ScrollProgress';
import { HeadFavicons } from '../components/HeadFavicons';
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
  const clerkPublishableKey = process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY || '';

  return (
    <html lang="en" className={`${geistSans.variable} ${geistMono.variable}`}>
      <body className="font-sans antialiased">
        <HelmetProvider>
          <HeadFavicons />
          <ConditionalClerkProvider
            publishableKey={clerkPublishableKey}
          >
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
          </ConditionalClerkProvider>
        </HelmetProvider>
      </body>
    </html>
  );
}
