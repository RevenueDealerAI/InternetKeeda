import { useState, useEffect } from "react";
import { format } from "date-fns";
import { SponsoredListing } from "../../../components/SponsoredListings";
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { Check, ChevronsUpDown } from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command";

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

export function SponsoredListingFormDialog({ open, onOpenChange, listing, onSubmit }: SponsoredListingFormDialogProps) {
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

  const [openCombobox, setOpenCombobox] = useState(false);
  const [toolSearch, setToolSearch] = useState("");

  useEffect(() => {
    const fetchTools = async () => {
      // Only fetch when open or if we have an initial value (though we might not need to fetch initial if we just display name)
      // Actually, for better UX store initial tools or fetch on open
      if (!openCombobox) return;

      setIsLoadingTools(true);
      setToolsError(null);
      try {
        const queryParams = new URLSearchParams();
        if (toolSearch) {
          queryParams.set('search', toolSearch);
        }

        const response = await fetch(`${API_BASE_URL}/api/sponsorships/available-tools?${queryParams.toString()}`);
        if (!response.ok) throw new Error('Failed to fetch available tools');
        const data = await response.json();
        const sortedData = data.sort((a: Tool, b: Tool) => a.name.localeCompare(b.name));
        setAvailableTools(sortedData);
      } catch (err) {
        setToolsError(err instanceof Error ? err.message : 'Error loading tools');
      } finally {
        setIsLoadingTools(false);
      }
    };

    const timeoutId = setTimeout(() => {
      fetchTools();
    }, 300); // 300ms debounce

    return () => clearTimeout(timeoutId);
  }, [openCombobox, toolSearch]);

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

  const handleChange = (field: keyof SponsoredListing, value: SponsoredListing[typeof field]) => setFormData(prev => ({ ...prev, [field]: value }));

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
    const submissionData = { ...formData };
    if (!submissionData.slug && submissionData.name) {
      submissionData.slug = submissionData.name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
    }
    if (!listing) {
      submissionData.views = 0;
      submissionData.impressions = 0;
      if (!submissionData.id) submissionData.id = `sponsor-${Date.now()}`;
    }
    if (!submissionData.toolId) {
      alert('Please select a tool');
      return;
    }
    onSubmit(submissionData);
  };

  const handleTagsChange = (tagsString: string) => handleChange('tags', tagsString.split(',').map(tag => tag.trim()).filter(Boolean));

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="theme-two sm:max-w-[640px] rounded-2xl overflow-hidden p-0">
        <div className="max-h-[85vh] overflow-y-auto modal-scroll pl-6 pr-0 py-6 md:pl-8 md:py-6">
          <form onSubmit={handleSubmit}>
            <DialogHeader className="p-0">
              <DialogTitle>{listing ? "Edit Sponsored Listing" : "Add New Sponsored Listing"}</DialogTitle>
            </DialogHeader>

            <div className="grid gap-6 py-6">
              <div className="space-y-2">
                <Label htmlFor="toolId">Select Tool</Label>
                {isLoadingTools ? (
                  <div className="flex items-center space-x-2 py-2">
                    <Loader2 className="h-4 w-4 animate-spin text-purple-600" />
                    <span className="text-sm text-gray-500">Loading available tools...</span>
                  </div>
                ) : toolsError ? (
                  <div className="text-sm text-red-500 py-2">Error: {toolsError}</div>
                ) : (
                  <Popover open={openCombobox} onOpenChange={setOpenCombobox}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        aria-expanded={openCombobox}
                        className={cn("w-full justify-between rounded-full", !formData.toolId && "text-muted-foreground")}
                        disabled={!!listing}
                      >
                        {formData.toolId
                          ? (formData.name || availableTools.find((tool) => tool._id === formData.toolId)?.name || "Select tool...")
                          : "Search for a tool..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-[--radix-popover-trigger-width] p-0" align="start">
                      <Command shouldFilter={false} className="h-auto w-full">
                        <CommandInput
                          placeholder="Search tools..."
                          value={toolSearch}
                          onValueChange={setToolSearch}
                        />
                        <CommandList className="max-h-[300px] overflow-y-auto">
                          <CommandEmpty>{isLoadingTools ? "Loading..." : "No tools found."}</CommandEmpty>
                          {!isLoadingTools && availableTools.length >= 100 && (
                            <div className="p-2 text-xs text-muted-foreground text-center border-b">
                              Showing top 100 results. Keep typing to filter...
                            </div>
                          )}
                          <CommandGroup>
                            {availableTools.map((tool) => (
                              <CommandItem
                                key={tool._id}
                                value={tool._id}
                                onSelect={() => {
                                  handleToolSelect(tool._id);
                                  setOpenCombobox(false);
                                }}
                              >
                                <Check
                                  className={cn(
                                    "mr-2 h-4 w-4",
                                    formData.toolId === tool._id ? "opacity-100" : "opacity-0"
                                  )}
                                />
                                {tool.name}
                              </CommandItem>
                            ))}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                )}
                {!listing && <p className="text-xs text-gray-500 mt-1">Only published tools can be sponsored. Select a tool to auto-populate the form.</p>}
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Tool Name</Label>
                  <Input id="name" value={formData.name || ""} onChange={e => handleChange('name', e.target.value)} required placeholder="e.g., Jasper AI" className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="logo">Logo URL</Label>
                  <Input id="logo" value={formData.logo || ""} onChange={e => handleChange('logo', e.target.value)} placeholder="https://example.com/logo.png" className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" value={formData.description || ""} onChange={e => handleChange('description', e.target.value)} required placeholder="Briefly describe the AI tool..." className="h-24 rounded-xl focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="category">Category</Label>
                  <Input id="category" value={formData.category || ""} onChange={e => handleChange('category', e.target.value)} required placeholder="e.g., Content Creation" className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="rating">Rating</Label>
                  <Select value={formData.rating !== undefined ? formData.rating.toFixed(1) : '4.5'} onValueChange={value => handleChange('rating', parseFloat(value))}>
                    <SelectTrigger className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500">
                      <SelectValue placeholder="Select rating" />
                    </SelectTrigger>
                    <SelectContent>
                      {['3.0', '3.5', '4.0', '4.2', '4.5', '4.7', '4.8', '4.9', '5.0'].map(v => (
                        <SelectItem key={v} value={v}>{v}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="url">Website URL</Label>
                  <Input id="url" value={formData.url || ""} onChange={e => handleChange('url', e.target.value)} required placeholder="https://example.com" className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug</Label>
                  <Input id="slug" value={formData.slug || ""} onChange={e => handleChange('slug', e.target.value)} placeholder="tool-name (auto-generated if empty)" className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="tags">Tags (comma-separated)</Label>
                <Input id="tags" value={formData.tags?.join(', ') || ''} onChange={e => handleTagsChange(e.target.value)} placeholder="e.g., writing, marketing, content" className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500 focus-visible:border-purple-500" />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="startDate">Start Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className={cn("w-full justify-start text-left font-normal rounded-full", !formData.startDate && "text-muted-foreground")}>
                        {formData.startDate ? (() => {
                          const [year, month, day] = formData.startDate.split('-').map(Number);
                          return new Date(year, month - 1, day).toLocaleDateString();
                        })() : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="p-2 rounded-2xl">
                      <Calendar
                        mode="single"
                        selected={formData.startDate ? (() => {
                          const [year, month, day] = formData.startDate.split('-').map(Number);
                          return new Date(year, month - 1, day);
                        })() : undefined}
                        onSelect={(d) => handleChange('startDate', d ? format(d, 'yyyy-MM-dd') : '')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="endDate">End Date</Label>
                  <Popover>
                    <PopoverTrigger asChild>
                      <Button type="button" variant="outline" className={cn("w-full justify-start text-left font-normal rounded-full", !formData.endDate && "text-muted-foreground")}>
                        {formData.endDate ? (() => {
                          const [year, month, day] = formData.endDate.split('-').map(Number);
                          return new Date(year, month - 1, day).toLocaleDateString();
                        })() : "Pick a date"}
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="p-2 rounded-2xl">
                      <Calendar
                        mode="single"
                        selected={formData.endDate ? (() => {
                          const [year, month, day] = formData.endDate.split('-').map(Number);
                          return new Date(year, month - 1, day);
                        })() : undefined}
                        onSelect={(d) => handleChange('endDate', d ? format(d, 'yyyy-MM-dd') : '')}
                        initialFocus
                      />
                    </PopoverContent>
                  </Popover>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Switch id="premiumBadge" className="data-[state=checked]:bg-purple-600" checked={formData.premiumBadge || false} onCheckedChange={checked => handleChange('premiumBadge', checked)} />
                <Label htmlFor="premiumBadge">Show Premium Badge</Label>
              </div>
            </div>

            <DialogFooter className="pt-4 gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">Cancel</Button>
              <Button type="submit" className="rounded-full bg-purple-600 text-white hover:bg-purple-700">
                {listing ? 'Update Listing' : 'Create Listing'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}


