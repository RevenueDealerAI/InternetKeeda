'use client';

import { useTheme } from '@/themes/ThemeContext';
import { NewsIndex as ThemeOneNewsIndex } from '@/themes/theme-one/pages/news/index';
import { NewsIndex as ThemeTwoNewsIndex } from '@/themes/theme-two/pages/news/index';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

export default function NewsPage() {
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <ThemeOneNewsIndex />;
  }

  return <ThemeTwoNewsIndex />;
}

