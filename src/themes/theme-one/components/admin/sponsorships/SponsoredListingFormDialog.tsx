import { useState, useEffect } from "react";
import { SponsoredListing } from "@/themes/theme-one/components/SponsoredListings";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
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
import { Switch } from "@/components/ui/switch";
import { Loader2 } from "lucide-react";
import { API_BASE_URL } from "@/config/constants";

// Interface for Tool from the API
interface Tool {
  _id: string;
  name: string;
  description: string;
  logo?: string;
  slug: string;
  category: string;
  websiteUrl?: string;
}

interface SponsoredListingFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  listing?: SponsoredListing;
  onSubmit: (data: Partial<SponsoredListing>) => void;
}

export function SponsoredListingFormDialog({
  open,
  onOpenChange,
  listing,
  onSubmit,
}: SponsoredListingFormDialogProps) {
  const [formData, setFormData] = useState<Partial<SponsoredListing>>({
    name: "",
    logo: "",
    description: "",
    rating: 4.5,
    category: "",
    url: "",
    slug: "",
    tags: [],
    premiumBadge: false,
  });
  
  const [availableTools, setAvailableTools] = useState<Tool[]>([]);
  const [isLoadingTools, setIsLoadingTools] = useState(false);
  const [toolsError, setToolsError] = useState<string | null>(null);
  
  // Fetch available tools for sponsorship
  useEffect(() => {
    const fetchTools = async () => {
      if (!open) return; // Only fetch when dialog is open
      
      setIsLoadingTools(true);
      setToolsError(null);
      
      try {
        const response = await fetch(`${API_BASE_URL}/api/sponsorships/available-tools`);
        if (!response.ok) throw new Error('Failed to fetch available tools');
        
        const data = await response.json();
        setAvailableTools(data);
      } catch (err) {
        setToolsError(err instanceof Error ? err.message : 'Error loading tools');
        console.error('Error fetching available tools:', err);
      } finally {
        setIsLoadingTools(false);
      }
    };
    
    fetchTools();
  }, [open]);

  // Populate form with listing data when editing
  useEffect(() => {
    if (listing) {
      setFormData({ ...listing });
    } else {
      setFormData({
        name: "",
        logo: "",
        description: "",
        rating: 4.5,
        category: "",
        url: "",
        slug: "",
        tags: [],
        premiumBadge: false,
      });
    }
  }, [listing]);

  const handleChange = (field: keyof SponsoredListing, value: string | number | boolean | string[] | undefined) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };
  
  // Handle tool selection and auto-populate fields
  const handleToolSelect = (toolId: string) => {
    const selectedTool = availableTools.find(tool => tool._id === toolId);
    
    if (selectedTool) {
      setFormData(prev => ({
        ...prev,
        toolId,
        name: selectedTool.name,
        description: selectedTool.description,
        logo: selectedTool.logo || '',
        slug: selectedTool.slug,
        category: selectedTool.category,
        url: selectedTool.websiteUrl || '',
      }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a copy of the form data to avoid modifying the state directly
    const submissionData = { ...formData };
    
    // Generate slug if not provided
    if (!submissionData.slug && submissionData.name) {
      submissionData.slug = submissionData.name
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
    
    // Add default values for new listings
    if (!listing) {
      submissionData.views = 0;
      submissionData.impressions = 0;
      
      // Only generate a new ID if one isn't already assigned
      if (!submissionData.id) {
        submissionData.id = `sponsor-${Date.now()}`;
      }
    }
    
    // Make sure toolId is included and is a string
    if (!submissionData.toolId) {
      alert('Please select a tool');
      return;
    }
    
    // Submit the data
    onSubmit(submissionData);
  };

  const handleTagsChange = (tagsString: string) => {
    const tagsArray = tagsString.split(",").map(tag => tag.trim()).filter(tag => tag);
    handleChange("tags", tagsArray);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {listing ? "Edit Sponsored Listing" : "Add New Sponsored Listing"}
            </DialogTitle>
          </DialogHeader>

          <div className="grid gap-6 py-6">
            <div className="space-y-2">
              <Label htmlFor="toolId">Select Tool</Label>
              {isLoadingTools ? (
                <div className="flex items-center space-x-2 py-2">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm text-gray-500">Loading available tools...</span>
                </div>
              ) : toolsError ? (
                <div className="text-sm text-red-500 py-2">
                  Error: {toolsError}
                </div>
              ) : (
                <Select
                  value={typeof formData.toolId === 'string' ? formData.toolId : undefined}
                  onValueChange={handleToolSelect}
                  disabled={!!listing}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a tool to sponsor" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableTools.map(tool => (
                      <SelectItem key={tool._id} value={tool._id}>
                        {tool.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
              {!listing && (
                <p className="text-xs text-gray-500 mt-1">
                  Only published tools can be sponsored. Select a tool to auto-populate the form.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Tool Name</Label>
                <Input
                  id="name"
                  value={formData.name || ""}
                  onChange={(e) => handleChange("name", e.target.value)}
                  required
                  placeholder="e.g., Jasper AI"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="logo">Logo URL</Label>
                <Input
                  id="logo"
                  value={formData.logo || ""}
                  onChange={(e) => handleChange("logo", e.target.value)}
                  placeholder="https://example.com/logo.png"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={formData.description || ""}
                onChange={(e) => handleChange("description", e.target.value)}
                required
                placeholder="Briefly describe the AI tool..."
                className="h-24"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Input
                  id="category"
                  value={formData.category || ""}
                  onChange={(e) => handleChange("category", e.target.value)}
                  required
                  placeholder="e.g., Content Creation"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="rating">Rating</Label>
                <Select
                  value={formData.rating !== undefined ? formData.rating.toFixed(1) : "4.5"}
                  onValueChange={(value) => handleChange("rating", parseFloat(value))}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select rating" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="3.0">3.0</SelectItem>
                    <SelectItem value="3.5">3.5</SelectItem>
                    <SelectItem value="4.0">4.0</SelectItem>
                    <SelectItem value="4.2">4.2</SelectItem>
                    <SelectItem value="4.5">4.5</SelectItem>
                    <SelectItem value="4.7">4.7</SelectItem>
                    <SelectItem value="4.8">4.8</SelectItem>
                    <SelectItem value="4.9">4.9</SelectItem>
                    <SelectItem value="5.0">5.0</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="url">Website URL</Label>
                <Input
                  id="url"
                  value={formData.url || ""}
                  onChange={(e) => handleChange("url", e.target.value)}
                  required
                  placeholder="https://example.com"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input
                  id="slug"
                  value={formData.slug || ""}
                  onChange={(e) => handleChange("slug", e.target.value)}
                  placeholder="tool-name (auto-generated if empty)"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags (comma-separated)</Label>
              <Input
                id="tags"
                value={formData.tags?.join(", ") || ""
}
                onChange={(e) => handleTagsChange(e.target.value)}
                placeholder="e.g., writing, marketing, content"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="startDate">Start Date</Label>
                <Input
                  id="startDate"
                  type="date"
                  value={formData.startDate || ""}
                  onChange={(e) => handleChange("startDate", e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="endDate">End Date</Label>
                <Input
                  id="endDate"
                  type="date"
                  value={formData.endDate || ""}
                  onChange={(e) => handleChange("endDate", e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center space-x-2">
              <Switch
                id="premiumBadge"
                checked={formData.premiumBadge || false}
                onCheckedChange={(checked) => handleChange("premiumBadge", checked)}
              />
              <Label htmlFor="premiumBadge">Show Premium Badge</Label>
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button type="submit" className="bg-green-500 hover:bg-green-600">
              {listing ? "Update Listing" : "Create Listing"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


