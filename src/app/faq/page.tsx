'use client';

import { useTheme } from '@/themes/ThemeContext';
import ThemeOneFAQPage from '@/themes/theme-one/pages/faq';
import ThemeTwoFAQPage from '@/themes/theme-two/pages/faq';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

export default function FAQPage() {
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <ThemeOneFAQPage />;
  }

  return <ThemeTwoFAQPage />;
}

