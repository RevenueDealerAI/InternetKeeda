import type { Metadata } from 'next';
import { Space_Grotesk, IBM_Plex_Mono, Instrument_Serif } from 'next/font/google';
import { ClientProviders } from './ClientProviders';
import { BRAND } from '@/lib/brand';
import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';
import '../index.css';

// No-FOUC theme init — runs BEFORE React hydrates so the page paints
// with the user's preferred theme on the first frame, no flash.
// Also paints the body background-color INLINE during the init so the
// canvas color is correct on the very first frame, before our CSS
// stylesheet has fully resolved the --bg variable.
//
// DEFAULT IS DARK for new visitors. Operator-locked: prefers-color-
// scheme is no longer honored on first load; the dark canvas is the
// brand-canonical look. Explicit user toggle still persists in
// localStorage and overrides.
const THEME_INIT_SCRIPT = `
(function(){try{
  var saved=localStorage.getItem('ik-theme');
  var theme=(saved==='dark'||saved==='light')?saved:'dark';
  document.documentElement.setAttribute('data-theme',theme);
  if(theme==='dark'){document.documentElement.classList.add('dark');}
  else{document.documentElement.classList.remove('dark');}
  var bg=theme==='dark'?'#0a0a0c':'#f7f5f2';
  var ink=theme==='dark'?'#f4f3f0':'#0f0f12';
  document.documentElement.style.background=bg;
  document.documentElement.style.color=ink;
}catch(e){
  document.documentElement.setAttribute('data-theme','dark');
  document.documentElement.classList.add('dark');
  document.documentElement.style.background='#0a0a0c';
}})();
`;

// metadataBase governs how every page-level alternates.canonical +
// openGraph.url + twitter URL is resolved against an absolute origin.
// Shared with sitemap, robots, BreadcrumbSSR, and /items/* 410 page
// via the centralized SITE_ORIGIN constant so they never disagree
// about www vs apex — a mismatch produces "Duplicate, Google chose a
// different canonical" in Search Console and silent de-indexing.
export const metadata: Metadata = {
  metadataBase: new URL(SITE_ORIGIN),
  title: {
    default: `${BRAND.name} — ${BRAND.tagline}`,
    template: `%s · ${BRAND.name}`,
  },
  description: BRAND.defaultMetaDescription,
  alternates: { canonical: '/' },
  openGraph: {
    type: 'website',
    siteName: BRAND.name,
    url: '/',
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.defaultMetaDescription,
  },
  twitter: {
    card: 'summary_large_image',
    title: `${BRAND.name} — ${BRAND.tagline}`,
    description: BRAND.defaultMetaDescription,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: { index: true, follow: true, 'max-image-preview': 'large' },
  },
};

const spaceGrotesk = Space_Grotesk({
  subsets: ['latin'],
  weight: ['300', '400', '500', '600', '700'],
  variable: '--font-sans',
  display: 'swap',
});
const ibmPlexMono = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '600'],
  variable: '--font-mono',
  display: 'swap',
});
const instrumentSerif = Instrument_Serif({
  subsets: ['latin'],
  weight: '400',
  style: ['normal', 'italic'],
  variable: '--font-serif',
  display: 'swap',
});

// Legacy CSS-var aliases — kept so any consumer still reading the
// old vars renders correctly during the pivot.
const fontAliasesStyle = {
  '--font-geist-sans': 'var(--font-sans)',
  '--font-geist-mono': 'var(--font-mono)',
  '--font-instrument-serif': 'var(--font-serif)',
  '--font-jetbrains-mono': 'var(--font-mono)',
} as React.CSSProperties;

// Organization JSON-LD. Ships in the initial HTML of every page so
// Google has a stable entity to associate the site, logo, and brand
// name with — feeds Knowledge Graph and Sitelinks. Constant-string,
// no untrusted input.
const ORGANIZATION_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'Organization',
  name: BRAND.name,
  url: SITE_ORIGIN,
  logo: `${SITE_ORIGIN}/apple-touch-icon.png`,
  sameAs: [
    // Add real social profile URLs here as they go live — currently
    // empty rather than fake so Google doesn't crawl 404s.
  ],
});

// WebSite JSON-LD with SearchAction. Tells Google about the in-site
// search so SERP can render a sitelinks searchbox under the brand
// result. Search URL pattern matches the existing on-site search.
const WEBSITE_LD = JSON.stringify({
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: BRAND.name,
  url: SITE_ORIGIN,
  potentialAction: {
    '@type': 'SearchAction',
    target: `${SITE_ORIGIN}/?q={search_term_string}`,
    'query-input': 'required name=search_term_string',
  },
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${spaceGrotesk.variable} ${ibmPlexMono.variable} ${instrumentSerif.variable}`}
      style={fontAliasesStyle}
    >
      <head>
        {/* No-FOUC theme init — must run synchronously before <body> */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: ORGANIZATION_LD }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: WEBSITE_LD }}
        />
      </head>
      <body className="font-sans antialiased">
        <ClientProviders>{children}</ClientProviders>
      </body>
    </html>
  );
}
