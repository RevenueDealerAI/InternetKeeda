'use client';

import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent } from "./ui/dialog";
import dynamic from "next/dynamic";

/**
 * Renders Clerk's SignIn / SignUp components inside modal dialogs.
 *
 * Previously imported @clerk/clerk-react statically, which bundled the
 * full Clerk SDK into the root layout's chunk. Now both Clerk
 * components are next/dynamic({ ssr: false }) — the Clerk SDK only
 * loads when the user actually opens a modal. Anonymous page views
 * pay nothing.
 *
 * On non-public routes (/dashboard, /admin, /sign-in, /sign-up) the
 * per-route ClerkProvider layout will have already loaded Clerk, so
 * mounting these dynamic components is a no-op chunk fetch.
 */

const ClerkSignIn = dynamic(
  () => import("@clerk/clerk-react").then((m) => ({ default: m.SignIn })),
  { ssr: false, loading: () => <div className="h-96 flex items-center justify-center text-sm text-gray-500">Loading sign-in…</div> }
);
const ClerkSignUp = dynamic(
  () => import("@clerk/clerk-react").then((m) => ({ default: m.SignUp })),
  { ssr: false, loading: () => <div className="h-96 flex items-center justify-center text-sm text-gray-500">Loading sign-up…</div> }
);

export function AuthModalManager() {
  const { currentModal, closeModal } = useAuth();

  const appearance = {
    variables: { colorPrimary: '#DC2626' },
    elements: {
      formButtonPrimary: "bg-red-600 hover:bg-red-700",
      footerAction: "text-red-600",
    },
  };

  return (
    <>
      <Dialog open={currentModal === 'login'} onOpenChange={() => closeModal()}>
        <DialogContent className="sm:max-w-[480px] p-6">
          {currentModal === 'login' && (
            <ClerkSignIn
              appearance={appearance}
              afterSignInUrl="/dashboard"
              signUpUrl="/sign-up"
            />
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={currentModal === 'signup'} onOpenChange={() => closeModal()}>
        <DialogContent className="sm:max-w-[480px] p-6">
          {currentModal === 'signup' && (
            <ClerkSignUp
              appearance={appearance}
              afterSignUpUrl="/dashboard"
              signInUrl="/sign-in"
            />
          )}
        </DialogContent>
      </Dialog>
    </>
  );
}
