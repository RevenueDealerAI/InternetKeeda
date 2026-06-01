'use client';

import { Suspense } from 'react';
import { useTheme } from '@/themes/ThemeContext';
import BestAIEmailManagementTools from '@/themes/theme-one/pages/best-ai-email-management-tools';
import ThemeTwoBestAIEmailManagementTools from '@/themes/theme-two/pages/best-ai-email-management-tools';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

function BestAIEmailManagementToolsContent() {
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <BestAIEmailManagementTools />;
  }

  return <ThemeTwoBestAIEmailManagementTools />;
}

export default function BestAIEmailManagementToolsPageClient() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BestAIEmailManagementToolsContent />
    </Suspense>
  );
}

