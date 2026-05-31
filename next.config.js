import { fileURLToPath } from 'url';
import { resolve } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = resolve(__filename, '..');

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  // Note: Next 15 removed devIndicators.buildActivity / appIsrStatus
  // config — the small Next badge in dev mode is no longer suppressible.
  // It only appears during `next dev`; production builds never render it,
  // so the deployed site won't show the orphan icon.

  typescript: {
    ignoreBuildErrors: false,
  },
  
  eslint: {
    ignoreDuringBuilds: false,
  },
  
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: '**' },
      { protocol: 'http', hostname: '**' },
    ],
    // Optimization on by default. Components that genuinely need raw
    // bytes (SVGs, Clerk avatar URLs that 403 when proxied, blob URLs
    // from uploads in progress) opt out via `unoptimized` on the
    // <Image> itself.
    formats: ['image/avif', 'image/webp'],
    deviceSizes: [320, 420, 640, 768, 1024, 1280, 1536, 1920],
    imageSizes: [16, 32, 48, 64, 96, 128, 256],
    // Aggressive edge cache for optimized images. 1 hour minimum;
    // Next respects upstream Cache-Control beyond that.
    minimumCacheTTL: 3600,
  },
  
  webpack: (config) => {
    config.resolve.fallback = {
      ...config.resolve.fallback,
      fs: false,
    };
    
    config.resolve.alias = {
      ...config.resolve.alias,
      'react-router-dom': resolve(__dirname, 'src/lib/react-router-compat.tsx'),
    };
    
    return config;
  },
  
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },

  async redirects() {
    return [
      {
        source: '/upcoming',
        destination: '/recently-added',
        permanent: true,
      },
      // News → Reviews rebrand. The page contract is identical;
      // only the URL slug moved. 308 permanent so search engines
      // re-index against the new canonical paths.
      {
        source: '/latest-news',
        destination: '/reviews',
        permanent: true,
      },
      {
        source: '/news',
        destination: '/reviews',
        permanent: true,
      },
      {
        source: '/news/:slug',
        destination: '/reviews/:slug',
        permanent: true,
      },
    ];
  },
};

export default nextConfig;

