'use client';

import { Suspense } from 'react';
import { useTheme } from '@/themes/ThemeContext';
import BestAIMeetingTools from '@/themes/theme-one/pages/best-ai-meeting-tools';
import ThemeTwoBestAIMeetingTools from '@/themes/theme-two/pages/best-ai-meeting-tools';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

function BestAIMeetingToolsContent() {
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <BestAIMeetingTools />;
  }

  return <ThemeTwoBestAIMeetingTools />;
}

export default function BestAIMeetingToolsPageClient() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BestAIMeetingToolsContent />
    </Suspense>
  );
}

