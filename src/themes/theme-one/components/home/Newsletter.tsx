import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, ArrowRight, CheckCircle2, XCircle } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";

export const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [status, setStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus("loading");
    setMessage("");
    
    try {
      const response = await fetch(`/api/newsletter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          source: 'homepage'
        }),
      });

      const data = await response.json();

      if (data.success) {
        setStatus("success");
        setMessage(data.message);
        setEmail('');
        toast.success(data.message);
      } else {
        setStatus("error");
        setMessage(data.message || 'Failed to subscribe to newsletter');
        toast.error(data.message || 'Failed to subscribe to newsletter');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      setStatus("error");
      setMessage("An error occurred while subscribing. Please try again.");
      toast.error("An error occurred while subscribing. Please try again.");
    }
  };

  return (
    <section className="py-20 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-green-50/30 to-white" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_50%,rgba(16,185,129,0.1),transparent_50%)]" />
      
      <div className="relative container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          {/* Content Card */}
          <div className="relative bg-white/70 backdrop-blur-sm border border-gray-200/50 rounded-2xl p-8 md:p-12 overflow-hidden">
            {/* Decorative Elements */}
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-green-500/10 to-green-400/10 blur-3xl" />
            <div className="absolute bottom-0 left-0 w-64 h-64 bg-gradient-to-tr from-green-500/10 to-green-400/10 blur-3xl" />
            
            <div className="relative">
              {/* Icon */}
              <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-green-50 text-green-600 mb-8">
                <Mail className="w-8 h-8" />
              </div>

              {/* Text Content */}
              <div className="max-w-2xl space-y-4 mb-8">
                <h2 className="text-3xl font-bold bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
                  Stay Updated with AI Innovation
                </h2>
                <p className="text-gray-600">
                  Subscribe to our newsletter and get weekly updates about the latest AI tools,
                  industry insights, and exclusive offers.
                </p>
              </div>

              {/* Subscription Form */}
              <form onSubmit={handleSubmit} className="max-w-md space-y-4">
                <div className="relative">
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={status === "loading"}
                    className="pl-4 pr-32 h-12 bg-white/70"
                  />
                  <Button
                    type="submit"
                    className="absolute right-1 top-1 h-10 bg-green-500 hover:bg-green-600"
                    disabled={status === "loading" || !email}
                  >
                    {status === "loading" ? (
                      <span className="flex items-center gap-2">
                        <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        Subscribing...
                      </span>
                    ) : (
                      <span className="flex items-center gap-2">
                        Subscribe
                        <ArrowRight className="w-4 h-4" />
                      </span>
                    )}
                  </Button>
                </div>

                {/* Status Message */}
                {status !== "idle" && status !== "loading" && message && (
                  <div className={`flex items-center gap-2 text-sm ${
                    status === "success" ? "text-green-600" : "text-red-600"
                  }`}>
                    {status === "success" ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : (
                      <XCircle className="w-4 h-4" />
                    )}
                    {message}
                  </div>
                )}

                {/* Privacy Notice */}
                <p className="text-sm text-gray-500">
                  By subscribing, you agree to our Privacy Policy and consent to receive updates
                  from our company.
                </p>
              </form>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}; 