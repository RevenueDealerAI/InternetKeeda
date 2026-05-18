'use client';

import { use } from 'react';
import { useTheme } from '@/themes/ThemeContext';
import ThemeOneSoftwarePageDetail from '@/themes/theme-one/pages/software/[slug]';
import ThemeTwoSoftwarePageDetail from '@/themes/theme-two/pages/software/[slug]';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';
import { ParamsProvider } from '@/app/ParamsProvider';

export default function SoftwareDetailPage({ params }: { params: Promise<{ slug: string }> }) {
  const resolvedParams = use(params);
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  return (
    <ParamsProvider params={resolvedParams}>
      {shouldShowThemeOne ? <ThemeOneSoftwarePageDetail /> : <ThemeTwoSoftwarePageDetail />}
    </ParamsProvider>
  );
}

