'use client';

import { useTheme } from '@/themes/ThemeContext';
import ThemeOneGuidesPage from '@/themes/theme-one/pages/guides';
import ThemeTwoGuidesPage from '@/themes/theme-two/pages/guides';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

export default function GuidesPage() {
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <ThemeOneGuidesPage />;
  }

  return <ThemeTwoGuidesPage />;
}

