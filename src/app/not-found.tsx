'use client';

import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { SiteLogo } from '@/themes/theme-one/components/SiteLogo';

export default function NotFound() {
  const router = useRouter();

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full text-center">
        <Link href="/" className="inline-flex items-center justify-center mb-8">
          <SiteLogo variant="light" height={64} asLink={false} priority />
        </Link>
        <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
        <h2 className="text-2xl font-semibold text-gray-800 mb-4">Page Not Found</h2>
        <p className="text-gray-600 mb-8">
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div className="space-x-4">
          <Link
            href="/"
            className="inline-block px-6 py-3 bg-orange-500 text-white rounded-lg hover:bg-orange-600 transition-colors"
          >
            Go Home
          </Link>
          <button
            onClick={() => router.back()}
            className="inline-block px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
          >
            Go Back
          </button>
        </div>
      </div>
    </div>
  );
}
