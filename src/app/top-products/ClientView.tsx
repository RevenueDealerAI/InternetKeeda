'use client';

import { useTheme } from '@/themes/ThemeContext';
import { TopProducts as ThemeOneTopProducts } from '@/themes/theme-one/pages/top-products';
import { TopProducts as ThemeTwoTopProducts } from '@/themes/theme-two/pages/top-products';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

export default function TopProductsPageClient() {
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <ThemeOneTopProducts />;
  }

  return <ThemeTwoTopProducts />;
}

