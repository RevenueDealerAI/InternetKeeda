'use client';

import { useTheme } from '@/themes/ThemeContext';
import ThemeOneCategories from '@/themes/theme-one/pages/categories';
import ThemeTwoCategories from '@/themes/theme-two/pages/categories';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

/**
 * `fallback` is the server-rendered <CategoryListSSR/> (real category
 * links). Rendered while the theme provider resolves — ThemeProvider
 * starts isLoading=true and flips it in a useEffect, so this fallback
 * ships in the INITIAL HTML and hydrates without mismatch, then gets
 * replaced by the themed interactive grid. Soft-404 fix for the hub:
 * the raw HTML now carries all category links instead of an empty
 * client shell.
 */
export default function CategoriesPageClient({
  fallback,
}: {
  fallback?: React.ReactNode;
}) {
  const { currentTheme, isLoading } = useTheme();

  if (isLoading && fallback) {
    return <>{fallback}</>;
  }

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <ThemeOneCategories />;
  }

  return <ThemeTwoCategories />;
}

