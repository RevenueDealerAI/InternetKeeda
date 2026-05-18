'use client';

import { Suspense } from 'react';
import { useTheme } from '@/themes/ThemeContext';
import BestCRMSoftwareForTeams from '@/themes/theme-one/pages/best-crm-software-for-teams';
import ThemeTwoBestCRMSoftwareForTeams from '@/themes/theme-two/pages/best-crm-software-for-teams';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

function BestCRMSoftwareForTeamsContent() {
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <BestCRMSoftwareForTeams />;
  }

  return <ThemeTwoBestCRMSoftwareForTeams />;
}

export default function BestCRMSoftwareForTeamsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BestCRMSoftwareForTeamsContent />
    </Suspense>
  );
}

