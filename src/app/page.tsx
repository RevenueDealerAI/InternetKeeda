'use client';

import ThemeOneIndex from '@/themes/theme-one/pages/Index';

// The Nexus homepage is the only homepage. No theme switching here —
// the previous useTheme()-routed branch caused a flash of the
// alternate theme on first paint while the SiteConfig provider
// resolved which theme was active. ThemeOneIndex is the Nexus build;
// render it directly.
export default function Home() {
  return <ThemeOneIndex />;
}
