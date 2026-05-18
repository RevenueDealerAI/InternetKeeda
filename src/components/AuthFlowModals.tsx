import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Lock, Mail, KeyRound, ArrowLeft } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const Icons = {
  spinner: Loader2,
  lock: Lock,
  mail: Mail,
  key: KeyRound,
  back: ArrowLeft
};

interface AuthFlowModalsProps {
  children?: React.ReactNode;
  mode: "verify-email" | "forgot-password" | "reset-password" | "otp";
  className?: string;
  email?: string;
  onBack?: () => void;
  onSuccess?: (email?: string) => void;
}

export function AuthFlowModals({ children, mode, className, email, onBack, onSuccess }: AuthFlowModalsProps) {
  const { currentModal, closeModal } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [inputEmail, setInputEmail] = useState("");

  const isOpen = currentModal === mode;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);
    await new Promise(resolve => setTimeout(resolve, 1000));
    setIsLoading(false);
    closeModal();

    if (onSuccess) {
      if (mode === "forgot-password") {
        onSuccess(inputEmail);
      } else {
        onSuccess();
      }
    }
  }

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);
      
      // Auto-focus next input
      if (value && index < 5) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        nextInput?.focus();
      }
    }
  };

  const handleOtpKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      const prevInput = document.getElementById(`otp-${index - 1}`);
      prevInput?.focus();
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className={cn(
        "sm:max-w-[400px] p-0 gap-0 bg-white border-none shadow-2xl shadow-purple-500/10",
        className
      )}>
        <div className="relative overflow-hidden">
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-purple-500 to-blue-500" />
          
          <DialogHeader className="space-y-2 p-6 pb-4">
            {onBack && (
              <button 
                onClick={onBack}
                className="absolute top-6 left-6 p-2 text-gray-500 hover:text-gray-700 transition-colors"
              >
                <Icons.back className="w-4 h-4" />
              </button>
            )}
            <DialogTitle className="text-xl font-semibold tracking-tight flex items-center gap-2">
              {mode === "verify-email" && (
                <>
                  <Icons.mail className="w-5 h-5 text-purple-500" />
                  Verify your email
                </>
              )}
              {mode === "forgot-password" && (
                <>
                  <Icons.lock className="w-5 h-5 text-purple-500" />
                  Reset your password
                </>
              )}
              {mode === "reset-password" && (
                <>
                  <Icons.key className="w-5 h-5 text-purple-500" />
                  Create new password
                </>
              )}
              {mode === "otp" && (
                <>
                  <Icons.key className="w-5 h-5 text-purple-500" />
                  Enter verification code
                </>
              )}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {mode === "verify-email" && (
                <>We've sent a verification link to {email || "your email"}.</>
              )}
              {mode === "forgot-password" && (
                "Enter your email address and we'll send you a link to reset your password."
              )}
              {mode === "reset-password" && (
                "Your new password must be different from previously used passwords."
              )}
              {mode === "otp" && (
                <>Enter the 6-digit code sent to {email || "your email"}.</>
              )}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4 p-6 pt-2">
            {mode === "forgot-password" && (
              <div className="space-y-2">
                <Label htmlFor="email" className="text-sm font-medium">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="name@example.com"
                  value={inputEmail}
                  onChange={(e) => setInputEmail(e.target.value)}
                  disabled={isLoading}
                  className="h-10 border focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-colors"
                  required
                />
              </div>
            )}

            {mode === "reset-password" && (
              <>
                <div className="space-y-2">
                  <Label htmlFor="new-password" className="text-sm font-medium">New password</Label>
                  <Input
                    id="new-password"
                    type="password"
                    disabled={isLoading}
                    className="h-10 border focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirm-password" className="text-sm font-medium">Confirm password</Label>
                  <Input
                    id="confirm-password"
                    type="password"
                    disabled={isLoading}
                    className="h-10 border focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-colors"
                    required
                  />
                </div>
              </>
            )}

            {mode === "otp" && (
              <div className="space-y-2">
                <Label htmlFor="otp" className="text-sm font-medium sr-only">Verification code</Label>
                <div className="flex justify-between gap-2">
                  {otp.map((digit, index) => (
                    <Input
                      key={index}
                      id={`otp-${index}`}
                      type="text"
                      value={digit}
                      onChange={(e) => handleOtpChange(index, e.target.value)}
                      onKeyDown={(e) => handleOtpKeyDown(index, e)}
                      maxLength={1}
                      className="h-12 w-12 text-center text-lg font-semibold border focus:ring-2 focus:ring-purple-100 focus:border-purple-500 transition-colors"
                      required
                    />
                  ))}
                </div>
              </div>
            )}

            {mode === "verify-email" && (
              <div className="space-y-2 text-center">
                <p className="text-sm text-gray-500">
                  Didn't receive the email? Check your spam folder or
                </p>
                <Button
                  type="button"
                  variant="link"
                  className="text-purple-600 hover:text-purple-700 p-0 h-auto font-medium"
                >
                  Click to resend
                </Button>
              </div>
            )}

            {mode !== "verify-email" && (
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-purple-600 hover:bg-purple-700 text-white shadow transition-all duration-200 h-10"
              >
                {isLoading ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "forgot-password" && "Sending link..."}
                    {mode === "reset-password" && "Updating password..."}
                    {mode === "otp" && "Verifying..."}
                  </>
                ) : (
                  <>
                    {mode === "forgot-password" && "Send reset link"}
                    {mode === "reset-password" && "Update password"}
                    {mode === "otp" && "Verify"}
                  </>
                )}
              </Button>
            )}

            {mode === "otp" && (
              <div className="text-center">
                <Button
                  type="button"
                  variant="link"
                  className="text-purple-600 hover:text-purple-700 p-0 h-auto font-medium text-sm"
                >
                  Didn't receive the code? Resend
                </Button>
              </div>
            )}
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 