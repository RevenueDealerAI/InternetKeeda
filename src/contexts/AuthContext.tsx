'use client';

import React, { createContext, useContext, useState } from 'react';
import { useClerkSession } from '@/hooks/useClerkSession';

type ModalType = 'login' | 'signup' | 'verify-email' | 'forgot-password' | 'reset-password' | 'otp' | null;

interface AuthContextType {
  isAuthenticated: boolean;
  user: null;
  currentModal: ModalType;
  userEmail: string;
  openModal: (type: ModalType, email?: string) => void;
  closeModal: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

/**
 * AuthProvider — Clerk-free at the layout level. Provides only the
 * "is the visitor signed in" boolean (via cookie detection) and a
 * modal-state manager. Components that need the full Clerk user
 * object (name, avatar, email, signOut) should be on a route that
 * mounts ClerkRouteWrapper and import directly from @clerk/clerk-react.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [currentModal, setCurrentModal] = useState<ModalType>(null);
  const [userEmail, setUserEmail] = useState('');
  const { isSignedIn } = useClerkSession();

  const openModal = (type: ModalType, email?: string) => {
    setCurrentModal(type);
    if (email) setUserEmail(email);
  };

  const closeModal = () => {
    setCurrentModal(null);
    setUserEmail('');
  };

  // Layout-level signOut just closes any open modal. Real sign-out
  // happens on /dashboard where Clerk is loaded.
  const signOut = async () => {
    closeModal();
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: isSignedIn,
        user: null,
        currentModal,
        userEmail,
        openModal,
        closeModal,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
