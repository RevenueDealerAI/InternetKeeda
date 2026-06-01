'use client';

import { useTheme } from '@/themes/ThemeContext';
import { Events as ThemeOneEvents } from '@/themes/theme-one/pages/events';
import { Events as ThemeTwoEvents } from '@/themes/theme-two/pages/events';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

export default function EventsPageClient() {
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <ThemeOneEvents />;
  }

  return <ThemeTwoEvents />;
}

