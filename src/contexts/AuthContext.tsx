import React, { createContext, useContext, useState } from 'react';
import { useClerk, useUser } from '@clerk/clerk-react';

type ModalType = 'login' | 'signup' | 'verify-email' | 'forgot-password' | 'reset-password' | 'otp' | null;

interface AuthContextType {
  isAuthenticated: boolean;
  user: { id: string; emailAddresses?: Array<{ emailAddress: string }>; firstName?: string | null; lastName?: string | null; imageUrl?: string; publicMetadata?: Record<string, unknown> } | null;
  currentModal: ModalType;
  userEmail: string;
  openModal: (type: ModalType, email?: string) => void;
  closeModal: () => void;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// When no Clerk publishable key is configured (local dev / preview),
// render a no-op AuthProvider so the site still loads. Auth features
// will be disabled but the rest of the UI remains usable.
const hasClerkKey =
  typeof process !== 'undefined' &&
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY;

function NoAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentModal, setCurrentModal] = useState<ModalType>(null);
  const [userEmail, setUserEmail] = useState('');

  const openModal = (type: ModalType, email?: string) => {
    setCurrentModal(type);
    if (email) setUserEmail(email);
  };
  const closeModal = () => {
    setCurrentModal(null);
    setUserEmail('');
  };
  const signOut = async () => {
    closeModal();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: false,
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

function ClerkAuthProvider({ children }: { children: React.ReactNode }) {
  const [currentModal, setCurrentModal] = useState<ModalType>(null);
  const [userEmail, setUserEmail] = useState('');
  const { isSignedIn, user } = useUser();
  const { signOut: clerkSignOut } = useClerk();

  const openModal = (type: ModalType, email?: string) => {
    setCurrentModal(type);
    if (email) {
      setUserEmail(email);
    }
  };

  const closeModal = () => {
    setCurrentModal(null);
    setUserEmail('');
  };

  const signOut = async () => {
    await clerkSignOut();
    closeModal();
  };

  return (
    <AuthContext.Provider
      value={{
        isAuthenticated: isSignedIn || false,
        user,
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

export function AuthProvider({ children }: { children: React.ReactNode }) {
  return hasClerkKey ? (
    <ClerkAuthProvider>{children}</ClerkAuthProvider>
  ) : (
    <NoAuthProvider>{children}</NoAuthProvider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}