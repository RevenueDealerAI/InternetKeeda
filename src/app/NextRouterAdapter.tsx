'use client';

import { usePathname } from 'next/navigation';
import { useTheme } from '@/themes/ThemeContext';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';
import { Navigation as ThemeOneNavigation } from '@/themes/theme-one/components/Navigation';
import { Footer as ThemeOneFooter } from '@/themes/theme-one/components/Footer';
import { BackgroundAnimation as ThemeOneBackgroundAnimation } from '@/themes/theme-one/components/BackgroundAnimation';
import { ThemeTwoNavigation } from '@/themes/theme-two/components/ThemeTwoNavigation';
import { ThemeTwoFooter } from '@/themes/theme-two/components/ThemeTwoFooter';
import { ThemeTwoBackgroundAnimation } from '@/themes/theme-two/components/ThemeTwoBackgroundAnimation';
import { MetaTagsManager } from '@/components/MetaTagsManager';
import { Analytics } from '@/components/Analytics';
import { AdSense } from '@/components/AdSense';

interface NextRouterAdapterProps {
  children: React.ReactNode;
}

export function NextRouterAdapter({ children }: NextRouterAdapterProps) {
  const pathname = usePathname();
  const { currentTheme, isLoading } = useTheme();

  // Don't render navigation/footer until theme is determined to prevent flash
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <MetaTagsManager />
        <Analytics />
        <AdSense />
        <div className="flex items-center justify-center min-h-screen">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading...</p>
          </div>
        </div>
      </div>
    );
  }

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';
  const isAdminRoute = pathname?.startsWith('/admin') || false;
  // Homepage owns its own editorial Nav + Footer (the reference design
  // wants them rendered inline). Skip the global ones there to avoid
  // a double navbar.
  const isHomeRoute = pathname === '/';

  return (
    <div className="min-h-screen">
      <MetaTagsManager />
      <Analytics />
      <AdSense />

      {!isAdminRoute && !isHomeRoute && shouldShowThemeOne && <ThemeOneNavigation />}
      {!isAdminRoute && !isHomeRoute && shouldShowThemeOne && <ThemeOneBackgroundAnimation />}

      {!isAdminRoute && !isHomeRoute && !shouldShowThemeOne && <ThemeTwoNavigation />}
      {!isAdminRoute && !isHomeRoute && !shouldShowThemeOne && <ThemeTwoBackgroundAnimation />}

      {children}

      {!isAdminRoute && !isHomeRoute && shouldShowThemeOne && <ThemeOneFooter />}
      {!isAdminRoute && !shouldShowThemeOne && <ThemeTwoFooter />}
    </div>
  );
}

