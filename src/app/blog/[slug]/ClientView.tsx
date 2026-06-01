'use client';

import { useTheme } from '@/themes/ThemeContext';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';
import ThemeOneBlogPost from '@/themes/theme-one/pages/BlogPost';
import ThemeTwoBlogPost from '@/themes/theme-two/pages/BlogPost';
import { ParamsProvider } from '@/app/ParamsProvider';

export default function BlogPostClient({ slug }: { slug: string }) {
  const { currentTheme, isLoading } = useTheme();
  if (isLoading) {
    return (
      <div
        className="flex items-center justify-center min-h-screen"
        style={{ background: 'var(--bg)', color: 'var(--ink)' }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
            style={{ borderColor: 'var(--accent)' }}
          />
          <p style={{ color: 'var(--ink-soft)' }}>Loading…</p>
        </div>
      </div>
    );
  }
  const safeTheme =
    currentTheme && currentTheme.path
      ? currentTheme
      : THEMES.find((t) => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';
  return (
    <ParamsProvider params={{ slug }}>
      {shouldShowThemeOne ? <ThemeOneBlogPost /> : <ThemeTwoBlogPost />}
    </ParamsProvider>
  );
}
