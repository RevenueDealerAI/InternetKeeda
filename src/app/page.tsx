import type { Metadata } from 'next';
import ThemeOneIndex from '@/themes/theme-one/pages/Index';
import { BRAND } from '@/lib/brand';

// Server component — exports route-level metadata + canonical so
// crawlers see a self-referencing canonical tag for the root path.
// The actual page UI (ThemeOneIndex) is still a client component;
// it renders fine inside the server wrapper because a server
// component is allowed to render a client child.
//
// The Nexus homepage is the only homepage. No theme switching here —
// the previous useTheme()-routed branch caused a flash of the
// alternate theme on first paint while the SiteConfig provider
// resolved which theme was active. ThemeOneIndex is the Nexus build;
// render it directly.

export const metadata: Metadata = {
  title: `${BRAND.name} — ${BRAND.tagline}`,
  description: BRAND.defaultMetaDescription,
  alternates: { canonical: '/' },
  openGraph: { url: '/', title: `${BRAND.name} — ${BRAND.tagline}` },
};

export default function Home() {
  return <ThemeOneIndex />;
}
