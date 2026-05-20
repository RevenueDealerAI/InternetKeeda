"use client";

import { Helmet } from "react-helmet-async";

/** Inject the explicit favicon + apple-touch-icon + OG image link tags.
 * Standalone client component so it can sit inside the HelmetProvider tree
 * already mounted in app/layout.tsx without conflicting with Next.js's
 * file-based metadata API (the layout is a 'use client' component which
 * can't export Metadata directly). */
export const HeadFavicons = () => (
  <Helmet>
    <link rel="icon" type="image/x-icon" href="/favicon.ico" />
    <link rel="icon" type="image/png" sizes="16x16" href="/favicon-16x16.png" />
    <link rel="icon" type="image/png" sizes="32x32" href="/favicon-32x32.png" />
    <link rel="apple-touch-icon" sizes="180x180" href="/apple-touch-icon.png" />
    <meta property="og:image" content="/branding/logo-dark.png" />
    <meta name="theme-color" content="#DC2626" />
  </Helmet>
);
