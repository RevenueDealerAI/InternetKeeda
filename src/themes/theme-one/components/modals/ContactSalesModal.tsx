import { useState } from "react";
import { useToast } from "@/components/ui/use-toast";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useSubmitInquiry } from "@/lib/api/inquiries";
import { useUser } from "@clerk/nextjs";

interface ContactSalesModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ContactSalesModal({ isOpen, onOpenChange }: ContactSalesModalProps) {
  const { toast } = useToast();
  const submitInquiry = useSubmitInquiry();
  const [formError, setFormError] = useState<string | null>(null);
  const { user, isSignedIn } = useUser();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    // Check if user is authenticated
    if (!isSignedIn) {
      setFormError('You must be logged in to submit this form');
      toast({
        title: "Authentication Required",
        description: "Please log in to contact sales",
        variant: "destructive",
      });
      return;
    }

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Get form values
    const data = {
      fullName: formData.get('name') as string,
      email: formData.get('email') as string,
      companyName: formData.get('company') as string,
      monthlyBudget: formData.get('budget') as string,
      message: formData.get('message') as string,
    };

    // Validate all fields are filled
    if (!data.fullName || !data.email || !data.companyName || !data.monthlyBudget || !data.message) {
      setFormError('Please fill in all required fields');
      return;
    }

    // Validate field lengths
    if (data.fullName.length < 2) {
      setFormError('Full name must be at least 2 characters');
      return;
    }

    if (data.message.length < 10) {
      setFormError('Message must be at least 10 characters');
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(data.email)) {
      setFormError('Please enter a valid email address');
      return;
    }

    try {
      console.log('Submitting inquiry:', data);
      await submitInquiry.mutateAsync(data);
      
      toast({
        title: "Message sent successfully!",
        description: "We'll get back to you as soon as possible.",
      });
      
      // Reset form and close modal
      form.reset();
      setFormError(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting inquiry:', error);
      let errorMessage = 'Please try again later.';
      
      // Handle authentication errors specifically
      if (error instanceof Error) {
        if (error.message.includes('Authentication required') || 
            error.message.includes('Unauthorized')) {
          errorMessage = 'You must be logged in to contact sales';
          // Force close the modal if there's an authentication error
          onOpenChange(false);
          
          toast({
            title: "Authentication Required",
            description: errorMessage,
            variant: "destructive",
          });
          return;
        }
        
        // Handle other errors
        try {
          const errorData = JSON.parse(error.message);
          if (Array.isArray(errorData.error)) {
            errorMessage = errorData.error[0].message;
          } else {
            errorMessage = error.message;
          }
        } catch {
          errorMessage = error.message;
        }
      }
      
      setFormError(errorMessage);
      toast({
        title: "Error sending message",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog 
      open={isOpen} 
      onOpenChange={(open) => {
        // Only allow opening if user is logged in
        if (open && !isSignedIn) {
          toast({
            title: "Authentication Required",
            description: "Please log in to contact sales",
            variant: "destructive",
          });
          return;
        }
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-[500px] p-0 gap-0 bg-white border-none shadow-2xl">
        <div className="relative overflow-hidden">
          {/* Green gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-500 to-green-600" />
          
          <DialogHeader className="space-y-2 p-6 pb-4">
            <DialogTitle className="text-xl font-semibold tracking-tight">Contact Sales</DialogTitle>
          </DialogHeader>

          {formError && (
            <div className="mx-6 -mt-2 mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 p-6 pt-2">
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input
                    id="name"
                    name="name"
                    placeholder="John Doe"
                    required
                    minLength={2}
                    className="h-10 bg-white border-gray-200 focus:ring-2 focus:ring-green-100 focus:border-green-500 rounded-lg"
                  />
                  <p className="text-xs text-gray-500">Minimum 2 characters</p>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="john@company.com"
                    required
                    pattern="[^\s@]+@[^\s@]+\.[^\s@]+"
                    className="h-10 bg-white border-gray-200 focus:ring-2 focus:ring-green-100 focus:border-green-500 rounded-lg"
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="company">Company Name</Label>
                <Input
                  id="company"
                  name="company"
                  placeholder="Company Inc."
                  required
                  className="h-10 bg-white border-gray-200 focus:ring-2 focus:ring-green-100 focus:border-green-500 rounded-lg"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Monthly Budget</Label>
                <Select name="budget" required>
                  <SelectTrigger className="h-10 bg-white border-gray-200 focus:ring-2 focus:ring-green-100 focus:border-green-500 rounded-lg">
                    <SelectValue placeholder="Select your budget range" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="$500 - $1,000">$500 - $1,000</SelectItem>
                    <SelectItem value="$1,000 - $2,500">$1,000 - $2,500</SelectItem>
                    <SelectItem value="$2,500 - $5,000">$2,500 - $5,000</SelectItem>
                    <SelectItem value="$5,000+">$5,000+</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="message">Message</Label>
                <Textarea
                  id="message"
                  name="message"
                  placeholder="Tell us about your advertising needs..."
                  className="h-32 bg-white border-gray-200 focus:ring-2 focus:ring-green-100 focus:border-green-500 rounded-lg"
                  required
                  minLength={10}
                />
                <p className="text-xs text-gray-500">Minimum 10 characters</p>
              </div>
            </div>
            <div className="flex justify-end gap-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  setFormError(null);
                  onOpenChange(false);
                }}
                disabled={submitInquiry.isPending}
                className="bg-white hover:bg-green-50 text-green-500 border-2 border-green-100 rounded-xl font-medium"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitInquiry.isPending}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 rounded-xl font-medium"
              >
                {submitInquiry.isPending ? "Sending..." : "Send Message"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 