'use client';

import { useTheme } from '@/themes/ThemeContext';
import ThemeOneCategoryPage from '@/themes/theme-one/pages/category/[id]';
import ThemeTwoCategoryPage from '@/themes/theme-two/pages/category/[id]';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';
import { ParamsProvider } from '@/app/ParamsProvider';

export default function CategoryDetailClient({ id }: { id: string }) {
  const { currentTheme } = useTheme();
  const safeTheme =
    currentTheme && currentTheme.path
      ? currentTheme
      : THEMES.find((t) => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';
  return (
    <ParamsProvider params={{ id }}>
      {shouldShowThemeOne ? <ThemeOneCategoryPage /> : <ThemeTwoCategoryPage />}
    </ParamsProvider>
  );
}
