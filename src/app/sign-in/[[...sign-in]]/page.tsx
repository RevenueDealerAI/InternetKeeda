'use client';

import { useTheme } from '@/themes/ThemeContext';
import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { SiteLogo } from '@/themes/theme-one/components/SiteLogo';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

export default function SignInCatchAll() {
  const { currentTheme, isLoading } = useTheme();

  // Show loading state while theme is being determined
  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md flex flex-col items-center space-y-8">
        <div className="text-center">
          <Link href="/" className="inline-flex items-center justify-center">
            <SiteLogo variant="light" height={80} asLink={false} priority />
          </Link>
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Sign in to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back! Please sign in to continue.
          </p>
        </div>
        <div className="mt-8 w-full flex justify-center">
          <SignIn
            appearance={{
              variables: {
                colorPrimary: shouldShowThemeOne ? '#10b981' : '#7D37FF',
              },
              elements: {
                formButtonPrimary: shouldShowThemeOne 
                  ? "bg-green-500 hover:bg-green-600" 
                  : "bg-gradient-primary hover:opacity-90",
                footerAction: shouldShowThemeOne ? "text-green-600" : "text-purple-600",
              }
            }}
            afterSignInUrl="/dashboard"
            signUpUrl="/sign-up"
            routing="path"
            path="/sign-in"
          />
        </div>
      </div>
    </div>
  );
}




