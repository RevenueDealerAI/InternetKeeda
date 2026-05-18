'use client';

import { use } from 'react';
import { useTheme } from '@/themes/ThemeContext';
import ThemeOneCategoryPage from '@/themes/theme-one/pages/category/[id]';
import ThemeTwoCategoryPage from '@/themes/theme-two/pages/category/[id]';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';
import { ParamsProvider } from '@/app/ParamsProvider';

export default function CategoryDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  return (
    <ParamsProvider params={resolvedParams}>
      {shouldShowThemeOne ? <ThemeOneCategoryPage /> : <ThemeTwoCategoryPage />}
    </ParamsProvider>
  );
}

