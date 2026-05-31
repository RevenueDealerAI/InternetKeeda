'use client';

import { Space_Grotesk, IBM_Plex_Mono, Instrument_Serif } from 'next/font/google';

// No-FOUC theme init — runs BEFORE React hydrates so the page paints
// with the user's preferred theme on the first frame, no flash.
// Also paints the body background-color INLINE during the init so the
// canvas color is correct on the very first frame, before our CSS
// stylesheet has fully resolved the --bg variable.
const THEME_INIT_SCRIPT = `
(function(){try{
  var saved=localStorage.getItem('ik-theme');
  // Default is DARK for new visitors. Operator-locked: we no longer
  // honor prefers-color-scheme on first load because the dark
  // canvas is the brand-canonical look; OS-light users would
  // otherwise land on a layout that doesn't match the marketing
  // screenshots. A user who explicitly toggles still gets their
  // choice persisted in localStorage.
  var theme=(saved==='dark'||saved==='light')?saved:'dark';
  document.documentElement.setAttribute('data-theme',theme);
  // Also drop the .dark class so Tailwind's dark: variant fires.
  // tailwind.config.ts uses darkMode:['class']; this keeps the
  // attribute (used by CSS variable selectors) AND the class
  // (used by dark: utilities) in sync.
  if(theme==='dark'){document.documentElement.classList.add('dark');}
  else{document.documentElement.classList.remove('dark');}
  var bg=theme==='dark'?'#0a0a0c':'#f7f5f2';
  var ink=theme==='dark'?'#f4f3f0':'#0f0f12';
  document.documentElement.style.background=bg;
  document.documentElement.style.color=ink;
}catch(e){
  document.documentElement.setAttribute('data-theme','dark');
  document.documentElement.classList.add('dark');
  document.documentElement.style.background='#0a0a0c';
}})();
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

// Nexus-spec fonts. Space Grotesk is the workhorse sans (body + headlines
// + nav links). IBM Plex Mono is reserved for labels / eyebrows / category
// counts / ticker / search input / section markers. Instrument Serif
// italic is the accent voice — used SPARINGLY on 1-2 words per headline
// only ("Learn.", "launches", "be seen.").
const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});
// Legacy aliases — kept so any consumer still reading the old vars
// renders correctly during the pivot.
const fontAliasesStyle = {
  '--font-geist-sans': 'var(--font-sans)',
  '--font-geist-mono': 'var(--font-mono)',
  '--font-instrument-serif': 'var(--font-serif)',
  '--font-jetbrains-mono': 'var(--font-mono)',
} as React.CSSProperties;

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

// React re-renders <html> during client hydration and strips any
// data-theme that the no-FOUC <head> script set. This hook re-applies
// the saved theme on the client side after hydration and keeps it
// pinned so the page never drops back to default light.
function ThemeAttributePersister() {
  useEffect(() => {
    const apply = () => {
      try {
        const saved = localStorage.getItem('ik-theme');
        // Mirrors THEME_INIT_SCRIPT — dark default, OS preference
        // ignored. Keep both `data-theme` attr (drives CSS-variable
        // selectors) and `.dark` class (drives Tailwind dark:
        // utilities) in sync so nothing visually drifts.
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
    // Re-apply on storage events from other tabs.
    window.addEventListener('storage', apply);
    return () => window.removeEventListener('storage', apply);
  }, []);
  return null;
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} ${instrumentSerif.variable}`}
      style={fontAliasesStyle}
    >
      <head>
        {/* No-FOUC theme init — must run synchronously before <body> */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="font-sans antialiased">
        {/* Nexus direction: no spider, no grid. The neural canvas is the
            signature element and gets mounted inline in the Hero +
            AgentSection + Final CTA — not as a global layer. */}
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
      </body>
    </html>
  );
}
