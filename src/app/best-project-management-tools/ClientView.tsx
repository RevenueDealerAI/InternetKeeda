'use client';

import { Suspense } from 'react';
import { useTheme } from '@/themes/ThemeContext';
import ThemeOneBestProjectManagementTools from '@/themes/theme-one/pages/best-project-management-tools';
import ThemeTwoBestProjectManagementTools from '@/themes/theme-two/pages/best-project-management-tools';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

function BestProjectManagementToolsContent() {
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <ThemeOneBestProjectManagementTools />;
  }

  return <ThemeTwoBestProjectManagementTools />;
}

export default function BestProjectManagementToolsPageClient() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BestProjectManagementToolsContent />
    </Suspense>
  );
}

