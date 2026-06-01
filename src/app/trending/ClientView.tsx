'use client';

import { useTheme } from '@/themes/ThemeContext';
import ThemeOneTrendingPage from '@/themes/theme-one/pages/trending';
import ThemeTwoTrendingPage from '@/themes/theme-two/pages/trending';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

export default function TrendingPageClient() {
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <ThemeOneTrendingPage />;
  }

  return <ThemeTwoTrendingPage />;
}

