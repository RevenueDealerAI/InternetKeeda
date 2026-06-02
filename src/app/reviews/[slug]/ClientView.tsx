'use client';

import { useTheme } from '@/themes/ThemeContext';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';
import { NewsDetail } from '@/themes/theme-one/pages/news/[slug]';
import { NewsDetail as ThemeTwoNewsDetail } from '@/themes/theme-two/pages/news/[slug]';
import { ParamsProvider } from '@/app/ParamsProvider';
import { getSampleReview } from '@/data/sample-reviews';
import SampleReviewLayout from '@/themes/theme-one/components/SampleReviewLayout';

/**
 * Client view for /reviews/[slug]. Detail component is still NewsDetail
 * internally since the Mongo model is called NewsPost — only the
 * public URL slug changed in the news → reviews rebrand.
 *
 * Sample slugs short-circuit to SampleReviewLayout directly, before
 * NewsDetail mounts. NewsDetail calls useAuth() unconditionally, which
 * throws on /reviews/[slug] because no ClerkProvider wraps this route —
 * so the sample branch must avoid mounting NewsDetail entirely.
 */
export default function ReviewDetailClient({ slug }: { slug: string }) {
  const sample = getSampleReview(slug);
  const { currentTheme, isLoading } = useTheme();
  if (sample) {
    return <SampleReviewLayout review={sample} />;
  }
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
      {shouldShowThemeOne ? <NewsDetail /> : <ThemeTwoNewsDetail />}
    </ParamsProvider>
  );
}
