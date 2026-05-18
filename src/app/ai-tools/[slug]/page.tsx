'use client';

import { use } from 'react';
import { useTheme } from '@/themes/ThemeContext';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';
import { AIToolDetail } from '@/themes/theme-one/pages/AIToolDetail';
import { AIToolDetail as ThemeTwoAIToolDetail } from '@/themes/theme-two/pages/AIToolDetail';
import { ParamsProvider } from '@/app/ParamsProvider';

export default function AIToolDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const { currentTheme, isLoading } = useTheme();

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  return (
    <ParamsProvider params={resolvedParams}>
      {shouldShowThemeOne ? <AIToolDetail /> : <ThemeTwoAIToolDetail />}
    </ParamsProvider>
  );
}

