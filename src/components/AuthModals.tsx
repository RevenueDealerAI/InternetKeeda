import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Github, Lock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";

const Icons = {
  spinner: Loader2,
  gitHub: Github,
  lock: Lock,
  google: (props: React.SVGProps<SVGSVGElement>) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      width="24"
      height="24"
      viewBox="0 0 24 24"
      {...props}
    >
      <path
        fill="currentColor"
        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
      />
    </svg>
  ),
};

interface AuthModalsProps {
  children?: React.ReactNode;
  mode?: "login" | "signup" | "submit";
  className?: string;
  onSuccess?: (email: string) => void;
  onForgotPassword?: () => void;
}

export function AuthModals({ children, mode = "login", className, onSuccess, onForgotPassword }: AuthModalsProps) {
  const { currentModal, closeModal, openModal } = useAuth();
  const [isLoading, setIsLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const isOpen = currentModal === mode;

  async function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    setIsLoading(true);

    try {
      if (onSuccess) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        onSuccess(email);
        closeModal();
      } else {
        closeModal();
      }
    } catch (error) {
      console.error('Auth error:', error);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && closeModal()}>
      <DialogTrigger asChild>
        {children}
      </DialogTrigger>
      <DialogContent className={cn(
        "sm:max-w-[400px] p-0 gap-0 bg-white border-none shadow-2xl shadow-green-500/10",
        className
      )}>
        <div className="relative overflow-hidden">
          {/* Green gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-green-600" />
          
          <DialogHeader className="space-y-2 p-6 pb-4">
            <DialogTitle className="text-xl font-semibold tracking-tight flex items-center gap-2">
              {mode !== "submit" && <Lock className="w-5 h-5 text-green-500" />}
              {mode === "login" && "Welcome back"}
              {mode === "signup" && "Create an account"}
              {mode === "submit" && "Submit a Tool"}
            </DialogTitle>
            <DialogDescription className="text-sm text-gray-500">
              {mode === "login" && "Enter your email to login to your account"}
              {mode === "signup" && "Enter your email below to create your account"}
              {mode === "submit" && "Share an amazing tool with the community"}
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="space-y-4 p-6 pt-2">
            {mode !== "submit" ? (
              <>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="name@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    disabled={isLoading}
                    className="h-10 border focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-colors"
                    autoComplete={mode === "login" ? "email" : "new-email"}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="password">Password</Label>
                    {mode === "login" && (
                      <button 
                        type="button" 
                        onClick={onForgotPassword}
                        className="text-xs text-green-600 hover:text-green-700"
                      >
                        Forgot password?
                      </button>
                    )}
                  </div>
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    disabled={isLoading}
                    className="h-10 border focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-colors"
                    autoComplete={mode === "login" ? "current-password" : "new-password"}
                    required
                  />
                </div>
              </>
            ) : (
              <>
                <div className="space-y-2">
                  <Label htmlFor="toolName" className="text-sm font-medium">Tool Name</Label>
                  <Input
                    id="toolName"
                    type="text"
                    placeholder="Amazing AI Tool"
                    disabled={isLoading}
                    className="h-10 border focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="category" className="text-sm font-medium">Category</Label>
                  <Input
                    id="category"
                    type="text"
                    placeholder="e.g., AI, Productivity, Development"
                    disabled={isLoading}
                    className="h-10 border focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-colors"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description" className="text-sm font-medium">Description</Label>
                  <textarea
                    id="description"
                    className="w-full min-h-[100px] rounded-md border p-3 text-sm focus:ring-2 focus:ring-green-100 focus:border-green-500 resize-none transition-colors"
                    placeholder="Tell us about this tool..."
                    disabled={isLoading}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="imageUrl" className="text-sm font-medium">Logo/Image URL</Label>
                  <Input
                    id="imageUrl"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    disabled={isLoading}
                    className="h-10 border focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-colors"
                    required
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="websiteUrl" className="text-sm font-medium">Website URL</Label>
                    <Input
                      id="websiteUrl"
                      type="url"
                      placeholder="https://example.com"
                      disabled={isLoading}
                      className="h-10 border focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-colors"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="githubUrl" className="text-sm font-medium">GitHub URL</Label>
                    <Input
                      id="githubUrl"
                      type="url"
                      placeholder="https://github.com/..."
                      disabled={isLoading}
                      className="h-10 border focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="twitterUrl" className="text-sm font-medium">Twitter URL</Label>
                    <Input
                      id="twitterUrl"
                      type="url"
                      placeholder="https://twitter.com/..."
                      disabled={isLoading}
                      className="h-10 border focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="linkedinUrl" className="text-sm font-medium">LinkedIn URL</Label>
                    <Input
                      id="linkedinUrl"
                      type="url"
                      placeholder="https://linkedin.com/..."
                      disabled={isLoading}
                      className="h-10 border focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="highlights" className="text-sm font-medium">Highlights (comma-separated)</Label>
                  <Input
                    id="highlights"
                    type="text"
                    placeholder="Free plan, API access, 24/7 support"
                    disabled={isLoading}
                    className="h-10 border focus:ring-2 focus:ring-green-100 focus:border-green-500 transition-colors"
                    required
                  />
                </div>
              </>
            )}

            {/* Social Login Buttons */}
            <div className="space-y-3">
              {mode !== "submit" && (
                <>
                  <Button
                    type="button"
                    disabled={isLoading}
                    className="w-full bg-white text-gray-800 border border-gray-200 hover:bg-gray-50 h-10 font-normal flex items-center justify-center gap-2"
                  >
                    <Icons.google className="h-4 w-4" />
                    {mode === "login" ? "Login with Google" : "Sign up with Google"}
                  </Button>
                  <Button
                    type="button"
                    disabled={isLoading}
                    className="w-full bg-gray-900 text-white hover:bg-gray-800 h-10 font-normal flex items-center justify-center gap-2"
                  >
                    <Icons.gitHub className="h-4 w-4" />
                    {mode === "login" ? "Login with GitHub" : "Sign up with GitHub"}
                  </Button>
                  
                  <div className="relative my-4">
                    <div className="absolute inset-0 flex items-center">
                      <span className="w-full border-t border-gray-200" />
                    </div>
                    <div className="relative flex justify-center text-xs">
                      <span className="bg-white px-2 text-gray-500">OR</span>
                    </div>
                  </div>
                </>
              )}
              
              {/* Submit Button */}
              <Button 
                type="submit" 
                disabled={isLoading}
                className="w-full bg-green-600 hover:bg-green-700 text-white shadow transition-all duration-200 h-10"
              >
                {isLoading ? (
                  <>
                    <Icons.spinner className="mr-2 h-4 w-4 animate-spin" />
                    {mode === "login" && "Logging in..."}
                    {mode === "signup" && "Signing up..."}
                    {mode === "submit" && "Submitting..."}
                  </>
                ) : (
                  <>
                    {mode === "login" && "Login"}
                    {mode === "signup" && "Sign up"}
                    {mode === "submit" && "Submit Tool"}
                  </>
                )}
              </Button>
              
              {/* Footer Toggle */}
              {mode !== "submit" && (
                <div className="text-center text-sm mt-4">
                  {mode === "login" ? (
                    <div className="text-gray-500">
                      Don't have an account?{" "}
                      <button 
                        type="button" 
                        onClick={() => openModal('signup')}
                        className="text-green-600 hover:text-green-700 font-medium"
                      >
                        Sign up
                      </button>
                    </div>
                  ) : (
                    <div className="text-gray-500">
                      Already have an account?{" "}
                      <button 
                        type="button" 
                        onClick={() => openModal('login')}
                        className="text-green-600 hover:text-green-700 font-medium"
                      >
                        Login
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}