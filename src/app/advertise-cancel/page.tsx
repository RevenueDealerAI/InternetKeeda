'use client';

import { useTheme } from '@/themes/ThemeContext';
import { AdvertiseCancel as ThemeOneAdvertiseCancel } from '@/themes/theme-one/pages/AdvertiseCancel';
import { AdvertiseCancel as ThemeTwoAdvertiseCancel } from '@/themes/theme-two/pages/AdvertiseCancel';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

export default function AdvertiseCancelPage() {
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <ThemeOneAdvertiseCancel />;
  }

  return <ThemeTwoAdvertiseCancel />;
}

