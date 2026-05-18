'use client';

import { useTheme } from '@/themes/ThemeContext';
import { LatestNews as ThemeOneLatestNews } from '@/themes/theme-one/pages/latest-news';
import { LatestNews as ThemeTwoLatestNews } from '@/themes/theme-two/pages/latest-news';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

export default function LatestNewsPage() {
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <ThemeOneLatestNews />;
  }

  return <ThemeTwoLatestNews />;
}

