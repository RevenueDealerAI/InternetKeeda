'use client';

import { useTheme } from '@/themes/ThemeContext';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';
import { AIToolDetail } from '@/themes/theme-one/pages/AIToolDetail';
import { AIToolDetail as ThemeTwoAIToolDetail } from '@/themes/theme-two/pages/AIToolDetail';
import { ParamsProvider } from '@/app/ParamsProvider';

/**
 * Client view for /ai-tools/[slug]. Houses the theme-routing
 * logic (useTheme — client-only). The server page.tsx upstream
 * passes params already-resolved so this file doesn't need to
 * `use()` a promise.
 *
 * `fallback` is server-rendered content (the <ToolArticleSSR/> article
 * with the tool's real name/description/features) shown while the
 * theme provider resolves. Because ThemeProvider starts isLoading=true
 * and only flips it in a useEffect, both the server render and the
 * first client (hydration) render emit this fallback — so it lands in
 * the INITIAL HTML for crawlers, hydrates without mismatch, and is
 * then replaced by the full interactive UI. This is the soft-404 fix:
 * no more empty "Loading…" shell in the raw HTML. When no fallback is
 * supplied (e.g. the SSR tool fetch failed), we degrade to the spinner.
 */
export default function AIToolDetailClient({
  slug,
  fallback,
}: {
  slug: string;
  fallback?: React.ReactNode;
}) {
  const { currentTheme, isLoading } = useTheme();

  if (isLoading) {
    if (fallback) return <>{fallback}</>;
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
      {shouldShowThemeOne ? <AIToolDetail /> : <ThemeTwoAIToolDetail />}
    </ParamsProvider>
  );
}
