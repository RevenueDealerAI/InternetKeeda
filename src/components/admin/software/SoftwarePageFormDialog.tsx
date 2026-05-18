import { useState, useEffect } from "react";
import { SoftwarePage } from "@/contexts/SoftwarePagesContext";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SoftwarePageFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  page?: SoftwarePage;
  onSubmit: (data: Partial<SoftwarePage>) => void;
}

// Available icons
const ICONS = [
  "BarChart3",
  "PenTool",
  "Users",
  "Mail",
  "CalendarClock",
  "Briefcase",
  "Target"
];

// Available background and icon colors
const COLORS = [
  { label: "Purple", bg: "bg-orange-50", text: "text-orange-600" },
  { label: "Blue", bg: "bg-blue-50", text: "text-blue-600" },
  { label: "Green", bg: "bg-green-50", text: "text-green-600" },
  { label: "Pink", bg: "bg-pink-50", text: "text-pink-600" },
  { label: "Orange", bg: "bg-orange-50", text: "text-orange-600" },
  { label: "Emerald", bg: "bg-emerald-50", text: "text-emerald-600" },
  { label: "Indigo", bg: "bg-indigo-50", text: "text-indigo-600" },
];

export function SoftwarePageFormDialog({
  open,
  onOpenChange,
  page,
  onSubmit,
}: SoftwarePageFormDialogProps) {
  const [formData, setFormData] = useState<Partial<SoftwarePage>>({
    title: "",
    description: "",
    slug: "",
    icon: "BarChart3",
    bgColor: "bg-orange-50",
    iconColor: "text-orange-600",
    featured: true,
    content: {
      introduction: "",
      toolsHeading: "",
      toolsDescription: "",
      author: "",
      authorImage: "",
      lastUpdated: new Date().toLocaleString('default', { month: 'long' }) + " " + new Date().getFullYear()
    }
  });

  const [selectedColorScheme, setSelectedColorScheme] = useState("Purple");

  // Populate form with page data when editing
  useEffect(() => {
    if (page) {
      setFormData({ ...page });
      
      // Find the selected color scheme based on the bgColor
      const colorScheme = COLORS.find(color => color.bg === page.bgColor);
      if (colorScheme) {
        setSelectedColorScheme(colorScheme.label);
      }
    } else {
      setFormData({
        title: "",
        description: "",
        slug: "",
        icon: "BarChart3",
        bgColor: "bg-orange-50",
        iconColor: "text-orange-600",
        featured: true,
        content: {
          introduction: "",
          toolsHeading: "",
          toolsDescription: "",
          author: "",
          authorImage: "",
          lastUpdated: new Date().toLocaleString('default', { month: 'long' }) + " " + new Date().getFullYear()
        }
      });
      setSelectedColorScheme("Purple");
    }
  }, [page]);

  const handleChange = (field: keyof SoftwarePage, value: SoftwarePage[typeof field]) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  // Update the color scheme (both bg and text color)
  const handleColorSchemeChange = (value: string) => {
    setSelectedColorScheme(value);
    const colorScheme = COLORS.find(color => color.label === value);
    if (colorScheme) {
      handleChange("bgColor", colorScheme.bg);
      handleChange("iconColor", colorScheme.text);
    }
  };

  const handleContentChange = (field: string, value: string) => {
    setFormData((prev) => ({
      ...prev,
      content: {
        ...prev.content,
        [field]: value
      }
    }));
  };

  const handleGenerateSlug = () => {
    if (formData.title) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
      handleChange("slug", slug);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create a copy of the form data to avoid modifying state directly
    const submissionData = { ...formData };
    
    // Generate slug if not provided
    if (!submissionData.slug && submissionData.title) {
      submissionData.slug = submissionData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, "-")
        .replace(/(^-|-$)/g, "");
    }
    
    // Submit the data
    onSubmit(submissionData);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[750px] max-h-[90vh] overflow-y-auto">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>
              {page ? "Edit Software Page" : "Add New Software Page"}
            </DialogTitle>
          </DialogHeader>

          <Tabs defaultValue="basic" className="py-6">
            <TabsList className="mb-6">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="content">Page Content</TabsTrigger>
            </TabsList>

            <TabsContent value="basic">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="title">Page Title</Label>
                  <Input
                    id="title"
                    value={formData.title || ""}
                    onChange={(e) => handleChange("title", e.target.value)}
                    required
                    placeholder="e.g., Best AI Meeting Tools"
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description || ""}
                    onChange={(e) => handleChange("description", e.target.value)}
                    required
                    placeholder="Briefly describe what this software category is about..."
                    className="h-20"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="slug">Slug</Label>
                    <div className="flex space-x-2">
                      <Input
                        id="slug"
                        value={formData.slug || ""}
                        onChange={(e) => handleChange("slug", e.target.value)}
                        placeholder="e.g., best-ai-meeting-tools"
                        className="flex-1"
                      />
                      <Button 
                        type="button" 
                        variant="outline" 
                        onClick={handleGenerateSlug}
                        className="whitespace-nowrap"
                      >
                        Generate
                      </Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="icon">Icon</Label>
                    <Select
                      value={formData.icon}
                      onValueChange={(value) => handleChange("icon", value)}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select icon" />
                      </SelectTrigger>
                      <SelectContent>
                        {ICONS.map((icon) => (
                          <SelectItem key={icon} value={icon}>
                            {icon}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Color Scheme</Label>
                  <RadioGroup 
                    value={selectedColorScheme} 
                    onValueChange={handleColorSchemeChange}
                    className="flex flex-wrap gap-4"
                  >
                    {COLORS.map(color => (
                      <div key={color.label} className="flex items-center space-x-2">
                        <RadioGroupItem value={color.label} id={`color-${color.label}`} />
                        <Label 
                          htmlFor={`color-${color.label}`}
                          className="flex items-center gap-2 cursor-pointer"
                        >
                          <div className={`w-6 h-6 rounded-full ${color.bg} flex items-center justify-center`}>
                            <div className={`w-3 h-3 rounded-full ${color.text.replace('text', 'bg')}`}></div>
                          </div>
                          {color.label}
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                </div>

                <div className="flex items-center space-x-2">
                  <Switch
                    id="featured"
                    checked={formData.featured || false}
                    onCheckedChange={(checked) => handleChange("featured", checked)}
                  />
                  <Label htmlFor="featured">Featured in Navigation Menu</Label>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="content">
              <div className="grid gap-6">
                <div className="space-y-2">
                  <Label htmlFor="introduction">Introduction</Label>
                  <Textarea
                    id="introduction"
                    value={formData.content?.introduction || ""}
                    onChange={(e) => handleContentChange("introduction", e.target.value)}
                    placeholder="Introduction paragraph for the page..."
                    className="h-24"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="toolsHeading">Tools Section Heading</Label>
                    <Input
                      id="toolsHeading"
                      value={formData.content?.toolsHeading || ""}
                      onChange={(e) => handleContentChange("toolsHeading", e.target.value)}
                      placeholder="e.g., Top AI Project Management Tools"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="toolsDescription">Tools Section Description</Label>
                    <Input
                      id="toolsDescription"
                      value={formData.content?.toolsDescription || ""}
                      onChange={(e) => handleContentChange("toolsDescription", e.target.value)}
                      placeholder="Brief description of the tools section..."
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="author">Author Name</Label>
                    <Input
                      id="author"
                      value={formData.content?.author || ""}
                      onChange={(e) => handleContentChange("author", e.target.value)}
                      placeholder="e.g., Emily Chen"
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="authorImage">Author Image URL</Label>
                    <Input
                      id="authorImage"
                      value={formData.content?.authorImage || ""}
                      onChange={(e) => handleContentChange("authorImage", e.target.value)}
                      placeholder="URL to author's image or avatar"
                    />
                    <p className="text-xs text-gray-500">
                      Default: https://ui-avatars.com/api/?name=AUTHOR_NAME&background=6466F1&color=fff
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastUpdated">Last Updated</Label>
                  <Input
                    id="lastUpdated"
                    value={formData.content?.lastUpdated || ""}
                    onChange={(e) => handleContentChange("lastUpdated", e.target.value)}
                    placeholder="e.g., May 2025"
                  />
                </div>
              </div>
            </TabsContent>
          </Tabs>

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" className="bg-green-500 hover:bg-green-600">
              {page ? "Update Page" : "Create Page"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
} 