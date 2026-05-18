'use client';

import { Suspense } from 'react';
import { useTheme } from '@/themes/ThemeContext';
import BestProductivityToolsForADHD from '@/themes/theme-one/pages/best-productivity-tools-for-adhd';
import ThemeTwoBestProductivityToolsForADHD from '@/themes/theme-two/pages/best-productivity-tools-for-adhd';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

function BestProductivityToolsForADHDContent() {
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <BestProductivityToolsForADHD />;
  }

  return <ThemeTwoBestProductivityToolsForADHD />;
}

export default function BestProductivityToolsForADHDPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BestProductivityToolsForADHDContent />
    </Suspense>
  );
}

