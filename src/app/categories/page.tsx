'use client';

import { useTheme } from '@/themes/ThemeContext';
import ThemeOneCategories from '@/themes/theme-one/pages/categories';
import ThemeTwoCategories from '@/themes/theme-two/pages/categories';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

export default function CategoriesPage() {
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <ThemeOneCategories />;
  }

  return <ThemeTwoCategories />;
}

