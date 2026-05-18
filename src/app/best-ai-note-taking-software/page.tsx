'use client';

import { Suspense } from 'react';
import { useTheme } from '@/themes/ThemeContext';
import BestAINoteTrackingSoftware from '@/themes/theme-one/pages/best-ai-note-taking-software';
import ThemeTwoBestAINoteTrackingSoftware from '@/themes/theme-two/pages/best-ai-note-taking-software';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

function BestAINoteTakingSoftwareContent() {
  const { currentTheme } = useTheme();

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  if (shouldShowThemeOne) {
    return <BestAINoteTrackingSoftware />;
  }

  return <ThemeTwoBestAINoteTrackingSoftware />;
}

export default function BestAINoteTakingSoftwarePage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <BestAINoteTakingSoftwareContent />
    </Suspense>
  );
}

