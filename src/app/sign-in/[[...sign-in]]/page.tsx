'use client';

import { useTheme } from '@/themes/ThemeContext';
import { SignIn } from '@clerk/nextjs';
import Link from 'next/link';
import { THEMES, DEFAULT_THEME } from '@/themes/theme-config';

export default function SignInCatchAll() {
  const { currentTheme, isLoading } = useTheme();

  if (isLoading) {
    return (
      <div
        className="flex min-h-screen items-center justify-center"
        style={{ background: 'var(--bg)', color: 'var(--ink)' }}
      >
        <div className="text-center">
          <div
            className="animate-spin rounded-full h-8 w-8 border-b-2 mx-auto mb-4"
            style={{ borderColor: 'var(--accent)' }}
          />
          <p style={{ color: 'var(--ink-soft)' }}>Loading…</p>
        </div>
      </div>
    );
  }

  const safeTheme =
    currentTheme && currentTheme.path
      ? currentTheme
      : THEMES.find((t) => t.id === DEFAULT_THEME) || THEMES[0];
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  return (
    <div
      className="flex min-h-screen items-center justify-center px-4 py-12 sm:px-6 lg:px-8"
      style={{ background: 'var(--bg)', color: 'var(--ink)' }}
    >
      <div className="w-full max-w-md flex flex-col items-center space-y-8">
        <div className="text-center">
          {/* Theme-aware brand logo — same pair pattern as Nav /
           * Footer / Sign-up. Light theme shows the black wordmark,
           * dark theme shows the animated white wordmark. */}
          <Link href="/" className="inline-flex items-center justify-center">
            <span className="relative inline-flex h-20 w-[260px] items-center">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/branding/logo-light.png"
                alt="Internet Keeda"
                className="ik-logo-light block h-full w-auto object-contain"
                draggable={false}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/branding/logo-animated.gif"
                alt=""
                aria-hidden="true"
                className="ik-logo-dark absolute left-1/2 top-1/2 hidden h-full w-auto -translate-x-1/2 -translate-y-1/2 object-contain"
                draggable={false}
              />
            </span>
          </Link>
          <h2
            className="mt-6 text-3xl font-extrabold"
            style={{ color: 'var(--ink)' }}
          >
            Login to your account
          </h2>
          <p className="mt-2 text-sm" style={{ color: 'var(--ink-2)' }}>
            Welcome back! Please login to continue.
          </p>
        </div>
        <div className="mt-8 w-full flex justify-center">
          <SignIn
            appearance={{
              variables: {
                colorPrimary: shouldShowThemeOne ? '#ff3b3b' : '#7D37FF',
              },
              elements: {
                formButtonPrimary: shouldShowThemeOne
                  ? 'bg-[#ff3b3b] hover:bg-[#d62a2a]'
                  : 'bg-gradient-primary hover:opacity-90',
                footerAction: shouldShowThemeOne ? 'text-[#ff3b3b]' : 'text-purple-600',
              },
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
