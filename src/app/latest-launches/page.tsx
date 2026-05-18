'use client';

import { useTheme } from '@/themes/ThemeContext';
import { LatestLaunches as ThemeOneLatestLaunches } from '@/themes/theme-one/pages/latest-launches';
import { LatestLaunches as ThemeTwoLatestLaunches } from '@/themes/theme-two/pages/latest-launches';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

export default function LatestLaunchesPage() {
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <ThemeOneLatestLaunches />;
  }

  return <ThemeTwoLatestLaunches />;
}

