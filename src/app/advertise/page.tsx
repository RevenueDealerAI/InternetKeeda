'use client';

import { useTheme } from '@/themes/ThemeContext';
import { Advertise as ThemeOneAdvertise } from '@/themes/theme-one/pages/advertise';
import { Advertise as ThemeTwoAdvertise } from '@/themes/theme-two/pages/advertise';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

export default function AdvertisePage() {
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <ThemeOneAdvertise />;
  }

  return <ThemeTwoAdvertise />;
}

