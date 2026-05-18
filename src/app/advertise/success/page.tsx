'use client';

import { Suspense } from 'react';
import { useTheme } from '@/themes/ThemeContext';
import { AdvertiseSuccess as ThemeOneAdvertiseSuccess } from '@/themes/theme-one/pages/AdvertiseSuccess';
import { AdvertiseSuccess as ThemeTwoAdvertiseSuccess } from '@/themes/theme-two/pages/AdvertiseSuccess';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

function AdvertiseSuccessContent() {
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <ThemeOneAdvertiseSuccess />;
  }

  return <ThemeTwoAdvertiseSuccess />;
}

export default function AdvertiseSuccessPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <AdvertiseSuccessContent />
    </Suspense>
  );
}




