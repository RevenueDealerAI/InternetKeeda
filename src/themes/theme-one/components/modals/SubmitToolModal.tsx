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
import { useSubmitTool } from "@/lib/api/submissions";
import { TOOL_CATEGORIES } from "@/lib/schemas/tool.schema";

interface SubmitToolModalProps {
  isOpen: boolean;
  onOpenChange: (open: boolean) => void;
}

// Use categories from the shared schema for consistency

const PRICING_TYPES = [
  "Free",
  "Freemium",
  "Paid",
  "Contact for Pricing",
  "Enterprise",
];

export function SubmitToolModal({ isOpen, onOpenChange }: SubmitToolModalProps) {
  const { toast } = useToast();
  const submitTool = useSubmitTool();
  const [formError, setFormError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setFormError(null);

    const form = e.currentTarget;
    const formData = new FormData(form);

    // Get form values
    const data = {
      toolName: formData.get('toolName') as string,
      description: formData.get('description') as string,
      websiteUrl: formData.get('websiteUrl') as string,
      logoUrl: formData.get('logoUrl') as string,
      category: formData.get('category') as string,
      pricingType: formData.get('pricingType') as string,
      keyHighlights: (formData.get('keyHighlights') as string)
        .split(',')
        .map(item => item.trim())
        .filter(Boolean),
      twitterUrl: formData.get('twitterUrl') as string || undefined,
      githubUrl: formData.get('githubUrl') as string || undefined,
    };

    // Validate required fields
    if (!data.toolName || !data.description || !data.websiteUrl || !data.logoUrl || !data.category || !data.pricingType || !data.keyHighlights.length) {
      setFormError('Please fill in all required fields');
      return;
    }

    // Validate field lengths
    if (data.toolName.length < 2) {
      setFormError('Tool name must be at least 2 characters');
      return;
    }

    if (data.description.length < 10) {
      setFormError('Description must be at least 10 characters');
      return;
    }

    // Validate URLs
    const urlRegex = /^https?:\/\/.+/;
    if (!urlRegex.test(data.websiteUrl)) {
      setFormError('Please enter a valid website URL (must start with http:// or https://)');
      return;
    }

    if (!urlRegex.test(data.logoUrl)) {
      setFormError('Please enter a valid logo URL (must start with http:// or https://)');
      return;
    }

    if (data.twitterUrl && !urlRegex.test(data.twitterUrl)) {
      setFormError('Please enter a valid Twitter URL (must start with http:// or https://)');
      return;
    }

    if (data.githubUrl && !urlRegex.test(data.githubUrl)) {
      setFormError('Please enter a valid GitHub URL (must start with http:// or https://)');
      return;
    }

    try {
      console.log('Submitting tool:', data);
      await submitTool.mutateAsync(data);
      
      toast({
        title: "Tool submitted successfully!",
        description: "We'll review your submission and get back to you soon.",
      });
      
      // Reset form and close modal
      form.reset();
      setFormError(null);
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting tool:', error);
      let errorMessage = 'Please try again later.';
      
      if (error instanceof Error) {
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
        title: "Error submitting tool",
        description: errorMessage,
        variant: "destructive",
      });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] p-0 gap-0 bg-white border-none shadow-2xl md:rounded-lg mobile-rounded max-w-full mx-auto md:mx-0 h-auto md:h-auto max-h-[90vh] md:max-h-none overflow-hidden">
        <div className="relative overflow-hidden">
          {/* Green gradient accent */}
          <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-green-400 to-green-600" />
          
          <DialogHeader className="space-y-2 p-6 pb-4">
            <div className="flex items-center justify-between">
              <DialogTitle className="text-xl font-semibold tracking-tight">Submit New Tool</DialogTitle>
              <Button 
                variant="ghost" 
                size="sm" 
                onClick={() => onOpenChange(false)} 
                className="md:hidden -mr-2 h-8 w-8 p-0 rounded-full active-scale"
              >
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
                  <path d="M18 6 6 18"></path>
                  <path d="m6 6 12 12"></path>
                </svg>
              </Button>
            </div>
            <p className="text-sm text-gray-500">
              Submit a new AI tool to share with the community.
            </p>
          </DialogHeader>

          {formError && (
            <div className="mx-6 -mt-2 mb-4 p-3 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg">
              {formError}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6 p-6 pt-2 overflow-y-auto mobile-scroll-area" style={{ maxHeight: 'calc(80vh - 120px)' }}>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="toolName">Tool Name *</Label>
                <Input
                  id="toolName"
                  name="toolName"
                  placeholder="Enter tool name"
                  required
                  minLength={2}
                  className="h-10 bg-white border-gray-200 focus:ring-2 focus:ring-green-100 focus:border-green-500 rounded-lg"
                />
                <p className="text-xs text-gray-500">Minimum 2 characters</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description *</Label>
                <Textarea
                  id="description"
                  name="description"
                  placeholder="Describe what the tool does, its key features, and benefits"
                  className="h-32 bg-white border-gray-200 focus:ring-2 focus:ring-green-100 focus:border-green-500 rounded-lg"
                  required
                  minLength={10}
                />
                <p className="text-xs text-gray-500">Minimum 10 characters</p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="websiteUrl">Website URL *</Label>
                  <Input
                    id="websiteUrl"
                    name="websiteUrl"
                    type="url"
                    placeholder="https://example.com"
                    required
                    className="h-10 bg-white border-gray-200 focus:ring-2 focus:ring-green-100 focus:border-green-500 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo/Image URL *</Label>
                  <Input
                    id="logoUrl"
                    name="logoUrl"
                    type="url"
                    placeholder="https://example.com/logo.png"
                    required
                    className="h-10 bg-white border-gray-200 focus:ring-2 focus:ring-green-100 focus:border-green-500 rounded-lg"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category *</Label>
                  <div className="relative">
                    <Select name="category" required>
                      <SelectTrigger className="h-10 bg-white border-gray-200 focus:ring-2 focus:ring-green-100 focus:border-green-500 rounded-lg">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                      <SelectContent 
                        position="popper" 
                        className="bg-white border-gray-200 shadow-lg max-h-[300px] overflow-y-auto"
                        style={{ zIndex: 9999 }}
                      >
                        {TOOL_CATEGORIES.map((category) => (
                          <SelectItem key={category} value={category}>
                            {category}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="pricingType">Pricing Type *</Label>
                  <div className="relative">
                    <Select name="pricingType" required>
                      <SelectTrigger className="h-10 bg-white border-gray-200 focus:ring-2 focus:ring-green-100 focus:border-green-500 rounded-lg">
                        <SelectValue placeholder="Select pricing type" />
                      </SelectTrigger>
                      <SelectContent 
                        position="popper" 
                        className="bg-white border-gray-200 shadow-lg"
                        style={{ zIndex: 9999 }}
                      >
                        {PRICING_TYPES.map((type) => (
                          <SelectItem key={type} value={type}>
                            {type}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="keyHighlights">Key Highlights *</Label>
                <Input
                  id="keyHighlights"
                  name="keyHighlights"
                  placeholder="e.g., Free plan, API access, 24/7 support (comma separated)"
                  required
                  className="h-10 bg-white border-gray-200 focus:ring-2 focus:ring-green-100 focus:border-green-500 rounded-lg"
                />
                <p className="text-xs text-gray-500">Enter features separated by commas</p>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="twitterUrl">Twitter URL</Label>
                  <Input
                    id="twitterUrl"
                    name="twitterUrl"
                    type="url"
                    placeholder="https://twitter.com/..."
                    className="h-10 bg-white border-gray-200 focus:ring-2 focus:ring-green-100 focus:border-green-500 rounded-lg"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="githubUrl">GitHub URL</Label>
                  <Input
                    id="githubUrl"
                    name="githubUrl"
                    type="url"
                    placeholder="https://github.com/..."
                    className="h-10 bg-white border-gray-200 focus:ring-2 focus:ring-green-100 focus:border-green-500 rounded-lg"
                  />
                </div>
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
                disabled={submitTool.isPending}
                className="bg-white hover:bg-green-50 text-green-500 border-2 border-green-100 rounded-xl font-medium"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={submitTool.isPending}
                className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700 rounded-xl font-medium"
              >
                {submitTool.isPending ? "Submitting..." : "Submit Tool"}
              </Button>
            </div>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
} 