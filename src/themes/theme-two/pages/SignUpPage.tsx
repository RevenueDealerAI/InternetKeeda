'use client';

import React from 'react';
import { SignUp } from '@clerk/nextjs';

export const SignUpPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join us today! Create your account to get started.
          </p>
        </div>
        <div className="mt-8">
          <SignUp 
            appearance={{
              variables: {
                colorPrimary: '#7D37FF',
              },
              elements: {
                formButtonPrimary: "bg-gradient-primary hover:opacity-90",
                footerAction: "text-purple-600",
              }
            }}
            afterSignUpUrl="/dashboard"
            signInUrl="/sign-in"
            routing="path"
            path="/sign-up"
          />
        </div>
      </div>
    </div>
  );
};
