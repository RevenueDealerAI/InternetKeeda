'use client';

/**
 * Client-side root tree. Wraps every public/private route with the
 * provider stack that needs to live inside React's client boundary:
 *   - HelmetProvider (legacy head metadata fallback for places
 *     not yet migrated to the Next.js Metadata API)
 *   - SiteConfigProvider + AuthProvider + ThemeProvider
 *   - QueryClientProvider (TanStack Query)
 *   - TooltipProvider (Radix UI)
 *
 * Plus the lifecycle components that need useEffect / usePathname:
 *   - AppInitializer (vote counts hydrate)
 *   - ThemeAttributePersister (data-theme + .dark class)
 *   - ScrollBehaviorFix (per-route scroll reset)
 *   - ScrollProgress (top progress bar)
 *   - NextRouterAdapter + PageTransition
 *   - Mobile search FAB, toasts, auth modal, iframe banner
 *
 * Lifted out of app/layout.tsx so the layout itself can be a
 * server component and export the Next.js `metadata` (which is the
 * only place metadataBase can live).
 */

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

const queryClient = new QueryClient();

function ScrollBehaviorFix() {
  const pathname = usePathname();

  useEffect(() => {
    const resetScrollStyles = () => {
      if (typeof window !== 'undefined') {
        document.body.style.overflow = 'auto';
        document.body.style.height = 'auto';
        document.documentElement.style.overflow = 'auto';
        document.documentElement.style.height = 'auto';
        document.body.classList.remove('overflow-hidden', 'fixed');
        document.documentElement.classList.remove('overflow-hidden', 'fixed');
        window.scrollTo({ top: 0, left: 0, behavior: 'instant' });
      }
    };
    resetScrollStyles();
    const timeoutId = setTimeout(() => {
      resetScrollStyles();
      window.scrollTo(0, 0);
    }, 100);
    return () => clearTimeout(timeoutId);
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

/** React re-renders <html> during client hydration and strips any
 * data-theme that the no-FOUC <head> script set. This hook re-applies
 * the saved theme on the client side after hydration and keeps it
 * pinned. Dark default mirrors THEME_INIT_SCRIPT. */
function ThemeAttributePersister() {
  useEffect(() => {
    const apply = () => {
      try {
        const saved = localStorage.getItem('ik-theme');
        const theme: 'dark' | 'light' =
          saved === 'dark' || saved === 'light' ? saved : 'dark';
        const root = document.documentElement;
        if (root.getAttribute('data-theme') !== theme) {
          root.setAttribute('data-theme', theme);
        }
        root.classList.toggle('dark', theme === 'dark');
      } catch {
        document.documentElement.setAttribute('data-theme', 'dark');
        document.documentElement.classList.add('dark');
      }
    };
    apply();
    window.addEventListener('storage', apply);
    return () => window.removeEventListener('storage', apply);
  }, []);
  return null;
}

export function ClientProviders({ children }: { children: React.ReactNode }) {
  return (
    <HelmetProvider>
      <HeadFavicons />
      {/* ClerkProvider is NOT mounted at the root. Public routes
       * use cookie-based useClerkSession() and never load the
       * Clerk SDK. Routes that need Clerk have a per-route
       * layout.tsx that wraps in ClerkRouteWrapper. */}
      <SiteConfigProvider>
        <AuthProvider>
          <AffiliateTracker />
          <SponsoredListingsProvider>
            <SoftwarePagesProvider>
              <ThemeProvider>
                <QueryClientProvider client={queryClient}>
                  <TooltipProvider>
                    <AppInitializer />
                    <ThemeAttributePersister />
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
  );
}
