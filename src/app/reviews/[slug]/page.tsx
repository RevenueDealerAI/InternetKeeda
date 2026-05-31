'use client';

import { use } from 'react';
import { useTheme } from '@/themes/ThemeContext';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';
import { NewsDetail } from '@/themes/theme-one/pages/news/[slug]';
import { NewsDetail as ThemeTwoNewsDetail } from '@/themes/theme-two/pages/news/[slug]';
import { ParamsProvider } from '@/app/ParamsProvider';

// Canonical review-detail route. /news/:slug 308-redirects here
// via next.config.js. The detail component is still NewsDetail
// (under themes/*/pages/news/[slug]) — internal naming preserved
// since the Mongo model is still called NewsPost, only the
// public URL changed.
export default function ReviewDetailPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const resolvedParams = use(params);
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
    <ParamsProvider params={resolvedParams}>
      {shouldShowThemeOne ? <NewsDetail /> : <ThemeTwoNewsDetail />}
    </ParamsProvider>
  );
}
