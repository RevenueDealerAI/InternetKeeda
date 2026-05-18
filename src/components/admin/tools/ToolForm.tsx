import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toolSchema, TOOL_CATEGORIES, COMMON_TAGS } from "@/lib/schemas/tool.schema";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TagInput } from "@/components/ui/tag-input";
import { Textarea } from "@/components/ui/textarea";
import { Tool } from "@/types/tool";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";
import { useCategories } from "@/hooks/useCategories";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

interface ToolFormProps {
  initialData?: Tool;
  onSubmit: (data: Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>) => void;
  onCancel: () => void;
}

type ToolFormData = Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>;

export function ToolForm({ initialData, onSubmit, onCancel }: ToolFormProps) {
  const inputClass = '';
  const textareaClass = '';
  const selectTriggerClass = '';
  const primaryBtnClass = '';
  const outlineBtnClass = '';
  const checkboxClass = '';
  const tagContainerClass = '';
  const { data: categoriesData, isLoading: categoriesLoading } = useCategories();
  const queryClient = useQueryClient();
  const [newCategoryName, setNewCategoryName] = useState("");
  const [showNewCategoryInput, setShowNewCategoryInput] = useState(false);
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);

  const categories = categoriesData?.data || [];
  const allCategoryNames = [
    ...TOOL_CATEGORIES,
    ...categories.filter(cat => !TOOL_CATEGORIES.includes(cat.name as typeof TOOL_CATEGORIES[number])).map(cat => cat.name)
  ];

  const handleCreateCategory = async (onChange: (value: string) => void) => {
    if (!newCategoryName.trim() || isCreatingCategory) return;

    setIsCreatingCategory(true);
    try {
      const response = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategoryName.trim() })
      });

      const result = await response.json();

      if (response.ok && result.success) {
        onChange(newCategoryName.trim());
        setNewCategoryName("");
        setShowNewCategoryInput(false);
        queryClient.invalidateQueries({ queryKey: ['categories'] });
        toast.success(`Category "${newCategoryName.trim()}" created successfully`);
      } else {
        toast.error(result.error || 'Failed to create category');
      }
    } catch (error) {
      console.error('Failed to create category:', error);
      toast.error('Failed to create category. Please try again.');
    } finally {
      setIsCreatingCategory(false);
    }
  };

  const form = useForm<ToolFormData>({
    resolver: zodResolver(toolSchema),
    defaultValues: initialData || {
      name: "",
      description: "",
      websiteUrl: "",
      category: "",
      tags: [],
      pricing: {
        type: "free",
        startingPrice: undefined,
      },
      features: [],
      status: "draft",
      isTrending: false,
      isNew: false,
      isUpcoming: false,
      isTopRated: false,
    },
  });

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tool Name <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input {...field} placeholder="Enter tool name" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Textarea {...field} placeholder="Enter tool description" className="min-h-[100px]" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="websiteUrl"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Website URL <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <Input {...field} placeholder="https://example.com" type="url" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="logo"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Logo URL (optional)</FormLabel>
              <FormControl>
                <Input {...field} placeholder="https://example.com/logo.png" type="url" />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="category"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Category <span className="text-red-500">*</span></FormLabel>
              <Select 
                onValueChange={(value) => {
                  if (value === "__new__") {
                    setShowNewCategoryInput(true);
                  } else {
                    field.onChange(value);
                  }
                }} 
                value={showNewCategoryInput ? undefined : field.value}
                defaultValue={field.value}
                disabled={categoriesLoading}
              >
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder={categoriesLoading ? "Loading categories..." : "Select a category"} />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  {allCategoryNames.map((category) => (
                    <SelectItem key={category} value={category}>
                      {category}
                    </SelectItem>
                  ))}
                  <SelectItem value="__new__">
                    + Create New Category
                  </SelectItem>
                </SelectContent>
              </Select>
              {showNewCategoryInput && (
                <div className="flex gap-2 mt-2">
                  <Input
                    placeholder="New category name"
                    value={newCategoryName}
                    onChange={(e) => setNewCategoryName(e.target.value)}
                    disabled={isCreatingCategory}
                    onKeyDown={async (e) => {
                      if (e.key === 'Enter' && newCategoryName.trim() && !isCreatingCategory) {
                        e.preventDefault();
                        await handleCreateCategory(field.onChange);
                      }
                    }}
                    autoFocus
                  />
                  <Button
                    type="button"
                    onClick={() => handleCreateCategory(field.onChange)}
                    disabled={!newCategoryName.trim() || isCreatingCategory}
                  >
                    {isCreatingCategory ? 'Creating...' : 'Add'}
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => {
                      setShowNewCategoryInput(false);
                      setNewCategoryName("");
                    }}
                    disabled={isCreatingCategory}
                  >
                    Cancel
                  </Button>
                </div>
              )}
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="tags"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tags <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <TagInput value={field.value} onChange={field.onChange} suggestions={Array.from(COMMON_TAGS)} placeholder="Add tags..." />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <div className="grid gap-4 md:grid-cols-2">
          <FormField
            control={form.control}
            name="pricing.type"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Pricing Type <span className="text-red-500">*</span></FormLabel>
                <Select onValueChange={field.onChange} defaultValue={field.value}>
                  <FormControl>
                  <SelectTrigger>
                      <SelectValue placeholder="Select pricing type" />
                    </SelectTrigger>
                  </FormControl>
                  <SelectContent>
                    <SelectItem value="free">Free</SelectItem>
                    <SelectItem value="freemium">Freemium</SelectItem>
                    <SelectItem value="paid">Paid</SelectItem>
                    <SelectItem value="enterprise">Enterprise</SelectItem>
                  </SelectContent>
                </Select>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="pricing.startingPrice"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Starting Price (optional)</FormLabel>
                <FormControl>
                  <Input type="number" {...field} value={field.value || ''} onChange={(e) => { const value = e.target.value === '' ? undefined : parseFloat(e.target.value); field.onChange(value); }} placeholder="0.00" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>

        <FormField
          control={form.control}
          name="features"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Features <span className="text-red-500">*</span></FormLabel>
              <FormControl>
                <TagInput
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Add features (press Enter or comma to add)..."
                />
              </FormControl>
              <p className="text-xs text-gray-500 mt-1">
                Add at least one feature. You can type and press Enter, use commas to separate multiple features, or paste comma-separated values.
              </p>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status <span className="text-red-500">*</span></FormLabel>
              <Select onValueChange={field.onChange} defaultValue={field.value}>
                <FormControl>
                  <SelectTrigger>
                    <SelectValue placeholder="Select status" />
                  </SelectTrigger>
                </FormControl>
                <SelectContent>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="published">Published</SelectItem>
                  <SelectItem value="archived">Archived</SelectItem>
                </SelectContent>
              </Select>
              <FormMessage />
            </FormItem>
          )}
        />

        <Separator className="my-4" />
        
        <div className="space-y-4">
          <h3 className="font-medium text-sm">Featured Sections</h3>
          <p className="text-sm text-gray-500 mb-2">Select where this tool should appear on the frontend:</p>
          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="isTrending"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div>
                    <FormLabel className="font-normal">Trending</FormLabel>
                    <p className="text-xs text-gray-500">Shows in "Trending" section on homepage</p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isNew"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div>
                    <FormLabel className="font-normal">Latest Launches</FormLabel>
                    <p className="text-xs text-gray-500">Shows in "Latest Launches" page</p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isUpcoming"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div>
                    <FormLabel className="font-normal">Upcoming</FormLabel>
                    <p className="text-xs text-gray-500">Shows in "Upcoming" page</p>
                  </div>
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="isTopRated"
              render={({ field }) => (
                <FormItem className="flex flex-row items-start space-x-3 space-y-0">
                  <FormControl>
                    <Checkbox checked={field.value} onCheckedChange={field.onChange} />
                  </FormControl>
                  <div>
                    <FormLabel className="font-normal">Top Rated</FormLabel>
                    <p className="text-xs text-gray-500">Shows in "Top Products" section</p>
                  </div>
                </FormItem>
              )}
            />
          </div>
        </div>

        <div className="flex justify-end space-x-4">
          <Button variant="outline" onClick={onCancel}>Cancel</Button>
          <Button type="submit">{initialData ? "Update Tool" : "Create Tool"}</Button>
        </div>
      </form>
    </Form>
  );
} 