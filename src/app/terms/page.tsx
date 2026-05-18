'use client';

import { useTheme } from '@/themes/ThemeContext';
import ThemeOneTermsPage from '@/themes/theme-one/pages/Terms';
import ThemeTwoTermsPage from '@/themes/theme-two/pages/Terms';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

export default function TermsPage() {
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <ThemeOneTermsPage />;
  }

  return <ThemeTwoTermsPage />;
}

