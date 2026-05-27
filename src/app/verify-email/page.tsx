'use client';

import { useTheme } from '@/themes/ThemeContext';
import { useUser } from '@clerk/nextjs';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function VerifyEmailPage() {
  const { currentTheme, isLoading: themeLoading } = useTheme();
  const router = useRouter();
  const { isSignedIn, isLoaded, user } = useUser();

  useEffect(() => {
    // If user is already signed in and email is verified, redirect to dashboard
    if (isLoaded && isSignedIn && user?.emailAddresses?.[0]?.verification?.status === 'verified') {
      router.push('/dashboard');
    }
  }, [isSignedIn, isLoaded, user, router]);

  if (!isLoaded || themeLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  // If already verified and signed in, show loading while redirecting
  if (isSignedIn && user?.emailAddresses?.[0]?.verification?.status === 'verified') {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Default: Show instructions to check email
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Verify your email
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            We've sent a verification link to your email address. Please check your inbox and click the link to verify your email.
          </p>
        </div>
        <div className="mt-4 text-center">
          <button
            onClick={() => router.push('/sign-in')}
            className="text-sm text-gray-600 hover:text-gray-900 underline"
          >
            Back to login
          </button>
        </div>
      </div>
    </div>
  );
}




