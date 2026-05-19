'use client';

import { useTheme } from '@/themes/ThemeContext';
import { Upcoming as ThemeOneUpcoming } from '@/themes/theme-one/pages/upcoming';
import { Upcoming as ThemeTwoUpcoming } from '@/themes/theme-two/pages/upcoming';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

export default function UpcomingPage() {
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <ThemeOneUpcoming />;
  }

  return <ThemeTwoUpcoming />;
}

