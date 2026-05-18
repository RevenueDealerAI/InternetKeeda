'use client';

import { useTheme } from '@/themes/ThemeContext';
import ThemeOneAboutPage from '@/themes/theme-one/pages/about';
import ThemeTwoAboutPage from '@/themes/theme-two/pages/about';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

export default function AboutPage() {
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <ThemeOneAboutPage />;
  }

  return <ThemeTwoAboutPage />;
}

