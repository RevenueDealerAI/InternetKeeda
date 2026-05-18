'use client';

import { useTheme } from '@/themes/ThemeContext';
import ThemeOnePrivacyPolicyPage from '@/themes/theme-one/pages/Privacy';
import ThemeTwoPrivacyPolicyPage from '@/themes/theme-two/pages/Privacy';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

export default function PrivacyPage() {
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <ThemeOnePrivacyPolicyPage />;
  }

  return <ThemeTwoPrivacyPolicyPage />;
}

