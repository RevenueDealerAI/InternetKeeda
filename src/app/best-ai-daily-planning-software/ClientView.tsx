'use client';

import { Suspense } from 'react';
import { useTheme } from '@/themes/ThemeContext';
import BestAIDailyPlanningSoftware from '@/themes/theme-one/pages/best-ai-daily-planning-software';
import ThemeTwoBestAIDailyPlanningSoftware from '@/themes/theme-two/pages/best-ai-daily-planning-software';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

function BestAIDailyPlanningSoftwareContent() {
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <BestAIDailyPlanningSoftware />;
  }

  return <ThemeTwoBestAIDailyPlanningSoftware />;
}

export default function BestAIDailyPlanningSoftwarePageClient() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BestAIDailyPlanningSoftwareContent />
    </Suspense>
  );
}

