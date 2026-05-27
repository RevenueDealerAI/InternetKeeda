'use client';

import React from 'react';
import { SignIn } from '@clerk/nextjs';

export const SignInPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Login to your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back! Please login to continue.
          </p>
        </div>
        <div className="mt-8">
          <SignIn 
            appearance={{
              variables: {
                colorPrimary: '#7D37FF',
              },
              elements: {
                formButtonPrimary: "bg-gradient-primary hover:opacity-90",
                footerAction: "text-purple-600",
              }
            }}
            afterSignInUrl="/dashboard"
            signUpUrl="/sign-up"
          />
        </div>
      </div>
    </div>
  );
};
