'use client';

import { useTheme } from '@/themes/ThemeContext';
import { Blog as ThemeOneBlog } from '@/themes/theme-one/pages/blog';
import { Blog as ThemeTwoBlog } from '@/themes/theme-two/pages/blog';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

export default function BlogPage() {
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <ThemeOneBlog />;
  }

  return <ThemeTwoBlog />;
}

