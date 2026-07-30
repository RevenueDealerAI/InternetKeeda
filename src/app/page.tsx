import type { Metadata } from 'next';
import { Suspense } from 'react';
import ThemeOneIndex from '@/themes/theme-one/pages/Index';
import { DiscoverGrid } from '@/components/seo/DiscoverGrid';
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

// ISR: the DiscoverGrid below is a server component that reads the
// current wave from Mongo. revalidate keeps the server-rendered links
// fresh (hourly) without a redeploy, and lets Next serve a cached HTML
// shell to crawlers instead of hitting the DB on every request.
export const revalidate = 3600;

export default function Home() {
  // ThemeOneIndex is the (client) Nexus homepage; it calls
  // useSearchParams(), which makes Next BAIL the whole enclosing
  // Suspense boundary to client-side rendering on this statically
  // rendered route. Left as a bare sibling, that bailout swallows
  // DiscoverGrid too — its server HTML never reaches the initial
  // response (the original "home HTML = nav + footer only" bug).
  //
  // Wrapping ThemeOneIndex in its OWN Suspense contains the CSR bailout
  // to just that subtree. DiscoverGrid — an async SERVER component with
  // the real <a href="/ai-tools/..."> + <a href="/category/..."> links
  // — then renders to static HTML in the initial response, landing
  // directly above the global footer.
  return (
    <>
      <Suspense fallback={null}>
        <ThemeOneIndex />
      </Suspense>
      <Suspense fallback={null}>
        <DiscoverGrid />
      </Suspense>
    </>
  );
}
