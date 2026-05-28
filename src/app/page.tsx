'use client';

import { useTheme } from '@/themes/ThemeContext';
import ThemeOneIndex from '@/themes/theme-one/pages/Index';
import { ThemeTwoHomePage } from '@/themes/theme-two/pages/ThemeTwoHomePage';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

export default function Home() {
  const { currentTheme } = useTheme();

  // Render the editorial homepage immediately — don't gate on
  // ThemeContext's isLoading. The cinematic theme tokens come from
  // CSS vars in index.css and the no-FOUC init script in layout.tsx,
  // not from this context. Blocking the homepage on isLoading was
  // showing a light "Loading..." spinner that broke the dark canvas.
  const safeTheme =
    currentTheme && currentTheme.path
      ? currentTheme
      : THEMES.find((t) => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) return <ThemeOneIndex />;
  return <ThemeTwoHomePage />;
}
