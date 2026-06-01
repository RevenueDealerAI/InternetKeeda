'use client';

import { useTheme } from '@/themes/ThemeContext';
import { LatestNews as ThemeOneLatestNews } from '@/themes/theme-one/pages/latest-news';
import { LatestNews as ThemeTwoLatestNews } from '@/themes/theme-two/pages/latest-news';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

// Canonical reviews route. The original /latest-news and /news
// paths 308-redirect here via next.config.js so old links keep
// working. The page component itself still lives under
// themes/*/pages/latest-news.tsx â€” only the URL slug changed.
export default function ReviewsPageClient() {
  const { currentTheme } = useTheme();
  const safeTheme =
    currentTheme && currentTheme.path
      ? currentTheme
      : THEMES.find((t) => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';
  return shouldShowThemeOne ? <ThemeOneLatestNews /> : <ThemeTwoLatestNews />;
}
