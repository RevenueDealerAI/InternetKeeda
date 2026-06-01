'use client';

import { useTheme } from '@/themes/ThemeContext';
import ThemeOneSoftwarePageDetail from '@/themes/theme-one/pages/software/[slug]';
import ThemeTwoSoftwarePageDetail from '@/themes/theme-two/pages/software/[slug]';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';
import { ParamsProvider } from '@/app/ParamsProvider';

export default function SoftwareDetailClient({ slug }: { slug: string }) {
  const { currentTheme } = useTheme();
  const safeTheme =
    currentTheme && currentTheme.path
      ? currentTheme
      : THEMES.find((t) => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';
  return (
    <ParamsProvider params={{ slug }}>
      {shouldShowThemeOne ? <ThemeOneSoftwarePageDetail /> : <ThemeTwoSoftwarePageDetail />}
    </ParamsProvider>
  );
}
