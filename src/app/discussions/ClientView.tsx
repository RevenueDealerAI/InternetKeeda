'use client';

import { useTheme } from '@/themes/ThemeContext';
import { Discussions as ThemeOneDiscussions } from '@/themes/theme-one/pages/discussions';
import { Discussions as ThemeTwoDiscussions } from '@/themes/theme-two/pages/discussions';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

export default function DiscussionsPageClient() {
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <ThemeOneDiscussions />;
  }

  return <ThemeTwoDiscussions />;
}

