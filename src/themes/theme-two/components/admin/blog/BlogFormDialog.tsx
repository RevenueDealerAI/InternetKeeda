import { useEffect } from "react";
import ImageComponent from 'next/image';
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ScrollArea } from "@/components/ui/scroll-area";
import dynamic from "next/dynamic";
const RichTextEditor = dynamic(
  () => import("@/components/editor/RichTextEditor").then((m) => ({ default: m.RichTextEditor })),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded" /> }
);
import { BlogPost } from "@/types/blog";
import { User } from "lucide-react";

const blogFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  slug: z.string().min(1, "Slug is required"),
  excerpt: z.string().min(10, "Excerpt must be at least 10 characters"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  category: z.string().min(1, "Category is required"),
  readTime: z.string().min(1, "Read time is required"),
  imageUrl: z.string().trim().url("Please enter a valid URL (e.g., https://example.com/image.jpg)"),
  tags: z.string().min(1, "At least one tag is required"),
  status: z.enum(["draft", "published"]),
  author: z.object({
    name: z.string().min(2, "Author name must be at least 2 characters"),
    avatar: z.string().url("Please enter a valid avatar URL"),
  }),
});

type BlogFormValues = z.infer<typeof blogFormSchema>;

interface BlogFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: BlogPost;
  onSubmit: (data: BlogFormValues) => Promise<void>;
}

export function BlogFormDialog({ open, onOpenChange, post, onSubmit }: BlogFormDialogProps) {
  const form = useForm<BlogFormValues>({
    resolver: zodResolver(blogFormSchema),
    defaultValues: post ? {
      title: post.title || "",
      slug: post.slug || "",
      excerpt: post.excerpt || "",
      content: post.content || "",
      category: post.category || "",
      readTime: post.readTime || "",
      imageUrl: post.imageUrl || "",
      tags: Array.isArray(post.tags) ? post.tags.join(", ") : "",
      status: post.status || "draft",
      author: { name: post.author?.name || "", avatar: post.author?.avatar || "" },
    } : {
      title: "",
      slug: "",
      excerpt: "",
      content: "",
      category: "",
      readTime: "",
      imageUrl: "",
      tags: "",
      status: "draft",
      author: { name: "", avatar: "https://ui-avatars.com/api/?background=random" },
    },
  });

  useEffect(() => {
    if (post) {
      form.reset({
        title: post.title || "",
        slug: post.slug || "",
        excerpt: post.excerpt || "",
        content: post.content || "",
        category: post.category || "",
        readTime: post.readTime || "",
        imageUrl: post.imageUrl || "",
        tags: Array.isArray(post.tags) ? post.tags.join(", ") : "",
        status: post.status || "draft",
        author: { name: post.author?.name || "", avatar: post.author?.avatar || "" },
      });
    }
  }, [post, form]);

  const handleSubmit = async (data: BlogFormValues) => {
    await onSubmit(data);
    form.reset();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="theme-two sm:max-w-[760px] rounded-2xl overflow-visible p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{post ? "Edit Blog Post" : "Create New Blog Post"}</DialogTitle>
        </DialogHeader>
        <ScrollArea className="max-h-[80vh] modal-scroll">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-6 px-6 pb-6">
              <FormField
                control={form.control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Title</FormLabel>
                    <FormControl>
                      <Input placeholder="Enter post title" {...field} className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="slug"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Slug</FormLabel>
                    <FormControl>
                      <Input placeholder="enter-post-slug" {...field} className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="excerpt"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Excerpt</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <RichTextEditor content={field.value} onChange={(html) => { field.onChange(html); form.trigger("excerpt"); }} placeholder="Brief description of the post" />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="content"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Content</FormLabel>
                    <FormControl>
                      <div className="space-y-2">
                        <RichTextEditor content={field.value} onChange={(html) => { field.onChange(html); form.trigger("content"); }} placeholder="Write your blog post content here..." />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="category"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Category</FormLabel>
                      <Select onValueChange={field.onChange} defaultValue={field.value}>
                        <FormControl>
                          <SelectTrigger className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500">
                            <SelectValue placeholder="Select category" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="Industry News" className="focus:bg-purple-50 focus:text-purple-700 data-[highlighted]:bg-purple-50 data-[highlighted]:text-purple-700">Industry News</SelectItem>
                          <SelectItem value="Best Practices" className="focus:bg-purple-50 focus:text-purple-700 data-[highlighted]:bg-purple-50 data-[highlighted]:text-purple-700">Best Practices</SelectItem>
                          <SelectItem value="Technical Guides" className="focus:bg-purple-50 focus:text-purple-700 data-[highlighted]:bg-purple-50 data-[highlighted]:text-purple-700">Technical Guides</SelectItem>
                          <SelectItem value="MLOps" className="focus:bg-purple-50 focus:text-purple-700 data-[highlighted]:bg-purple-50 data-[highlighted]:text-purple-700">MLOps</SelectItem>
                          <SelectItem value="Computer Vision" className="focus:bg-purple-50 focus:text-purple-700 data-[highlighted]:bg-purple-50 data-[highlighted]:text-purple-700">Computer Vision</SelectItem>
                          <SelectItem value="Natural Language Processing" className="focus:bg-purple-50 focus:text-purple-700 data-[highlighted]:bg-purple-50 data-[highlighted]:text-purple-700">NLP</SelectItem>
                          <SelectItem value="AI Security" className="focus:bg-purple-50 focus:text-purple-700 data-[highlighted]:bg-purple-50 data-[highlighted]:text-purple-700">AI Security</SelectItem>
                          <SelectItem value="Edge Computing" className="focus:bg-purple-50 focus:text-purple-700 data-[highlighted]:bg-purple-50 data-[highlighted]:text-purple-700">Edge Computing</SelectItem>
                          <SelectItem value="Project Management" className="focus:bg-purple-50 focus:text-purple-700 data-[highlighted]:bg-purple-50 data-[highlighted]:text-purple-700">Project Management</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="readTime"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Read Time</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., 5 min read" {...field} className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="imageUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Image URL</FormLabel>
                    <FormControl>
                      <Input placeholder="https://example.com/image.jpg" {...field} className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="tags"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tags</FormLabel>
                    <FormControl>
                      <Input placeholder="tag1, tag2, tag3" {...field} className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={form.control}
                  name="author.name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author Name</FormLabel>
                      <FormControl>
                        <Input placeholder="Enter author name" {...field} className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                <FormField
                  control={form.control}
                  name="author.avatar"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Author Avatar URL</FormLabel>
                      <FormControl>
                        <div className="space-y-2">
                          <div className="flex gap-2 items-center">
                            <Input placeholder="Enter avatar URL or use UI Avatars" {...field} className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
                            <Button type="button" variant="outline" size="icon" className="rounded-full" onClick={() => {
                              const name = form.getValues("author.name");
                              const avatarUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'User')}&background=random`;
                              field.onChange(avatarUrl);
                              form.trigger("author.avatar");
                            }}>
                              <User className="h-4 w-4" />
                            </Button>
                          </div>
                          {field.value && (
                            <div className="flex items-center gap-2">
                              <div className="relative w-8 h-8 rounded-full overflow-hidden">
                                <ImageComponent src={field.value} alt="Avatar preview" fill className="object-cover" unoptimized />
                              </div>
                              <span className="text-sm text-gray-500">Preview</span>
                            </div>
                          )}
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500">
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="draft" className="focus:bg-purple-50 focus:text-purple-700 data-[highlighted]:bg-purple-50 data-[highlighted]:text-purple-700">Draft</SelectItem>
                        <SelectItem value="published" className="focus:bg-purple-50 focus:text-purple-700 data-[highlighted]:bg-purple-50 data-[highlighted]:text-purple-700">Published</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">Cancel</Button>
                <Button
                  type="submit"
                  className="rounded-full text-white"
                  style={{ background: 'linear-gradient(to right, #9333ea, #ec4899)' }}
                >
                  {post ? "Update Post" : "Create Post"}
                </Button>
              </div>
            </form>
          </Form>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}


