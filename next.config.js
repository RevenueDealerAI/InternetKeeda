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
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      }
    ],
    unoptimized: true,
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
};

export default nextConfig;

