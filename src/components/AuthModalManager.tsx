import { useAuth } from "@/contexts/AuthContext";
import { Dialog, DialogContent } from "./ui/dialog";
import { SignIn, SignUp } from "@clerk/clerk-react";

export function AuthModalManager() {
  const { currentModal, closeModal } = useAuth();

  // Simplified appearance with only essential brand-related styling
  const commonAppearance = {
    variables: {
      colorPrimary: '#10b981',
    },
    elements: {
      formButtonPrimary: "bg-emerald-500 hover:bg-emerald-600",
      footerAction: "text-emerald-600",
    }
  };

  return (
    <>
      <Dialog open={currentModal === 'login'} onOpenChange={() => closeModal()}>
        <DialogContent className="sm:max-w-[480px] p-6">
          <SignIn 
            appearance={commonAppearance}
            afterSignInUrl="/dashboard"
            signUpUrl="/sign-up"
          />
        </DialogContent>
      </Dialog>

      <Dialog open={currentModal === 'signup'} onOpenChange={() => closeModal()}>
        <DialogContent className="sm:max-w-[480px] p-6">
          <SignUp 
            appearance={commonAppearance}
            afterSignUpUrl="/dashboard"
            signInUrl="/sign-in"
          />
        </DialogContent>
      </Dialog>
    </>
  );
} 