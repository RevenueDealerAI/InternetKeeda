import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from 'sonner';
import { useAuth } from '@clerk/clerk-react';
import dynamic from 'next/dynamic';
const TipTapEditor = dynamic(
  () => import('@/themes/theme-one/components/TipTapEditor'),
  { ssr: false, loading: () => <div className="h-64 bg-gray-100 animate-pulse rounded" /> }
);
import { Loader2 } from 'lucide-react';

const API_BASE_URL = "";

const newsFormSchema = z.object({
  title: z.string().min(2, "Title must be at least 2 characters"),
  excerpt: z.string().min(10, "Excerpt must be at least 10 characters"),
  content: z.string().min(50, "Content must be at least 50 characters"),
  category: z.string().min(1, "Please select a category"),
  imageUrl: z.string().url("Please enter a valid image URL"),
  tags: z.string().min(1, "Add at least one tag"),
  status: z.enum(["draft", "published"]).default("draft"),
  source: z.string().min(1, "Source is required"),
  sourceUrl: z.string().url("Please enter a valid source URL"),
  author: z.object({
    name: z.string().min(2, "Author name must be at least 2 characters"),
    avatar: z.string().url("Please enter a valid avatar URL"),
  }),
});

type FormValues = z.infer<typeof newsFormSchema>;

interface NewsPost {
  _id: string;
  title: string;
  excerpt: string;
  content: string;
  category: string;
  imageUrl: string;
  tags: string[];
  status: 'draft' | 'published';
  source: string;
  sourceUrl: string;
  author: { name: string; avatar: string };
}

interface NewsFormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  post?: NewsPost | null;
  onSuccess: () => void;
}

const CATEGORIES = [
  'AI & Machine Learning', 'Technology', 'Business', 'Science', 'Innovation', 'Startups',
  'Research', 'Industry News', 'AI Development', 'Product Update', 'Policy', 'Research',
];

export function NewsFormDialog({ open, onOpenChange, post, onSuccess }: NewsFormDialogProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getToken } = useAuth();

  const form = useForm<FormValues>({
    resolver: zodResolver(newsFormSchema),
    defaultValues: {
      title: '', excerpt: '', content: '', category: '', imageUrl: '', tags: '', status: 'draft',
      source: '', sourceUrl: '', author: { name: '', avatar: '' },
    },
  });

  useEffect(() => {
    if (post) {
      form.reset({
        title: post.title, excerpt: post.excerpt, content: post.content, category: post.category,
        imageUrl: post.imageUrl, tags: post.tags.join(', '), status: post.status,
        source: post.source, sourceUrl: post.sourceUrl, author: { name: post.author.name, avatar: post.author.avatar },
      });
    } else if (open) {
      form.reset({
        title: '', excerpt: '', content: '', category: '', imageUrl: '', tags: '', status: 'draft',
        source: '', sourceUrl: '', author: { name: '', avatar: '' },
      });
    }
  }, [post, open, form]);

  const onSubmit = async (values: FormValues) => {
    try {
      setIsSubmitting(true);
      const token = await getToken();
      const body = {
        ...values,
        tags: values.tags.split(',').map(t => t.trim()).filter(Boolean),
        author: { name: values.author.name, avatar: values.author.avatar },
      };
      const response = await fetch(`${API_BASE_URL}/api/news${post ? `/${post._id}` : ''}`, {
        method: post ? 'PATCH' : 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify(body),
      });
      if (!response.ok) throw new Error('Failed to save news post');
      toast.success(`News post ${post ? 'updated' : 'created'} successfully`);
      onSuccess();
    } catch (e) {
      toast.error('Failed to save news post');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl rounded-2xl overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>{post ? 'Edit News Post' : 'Create News Post'}</DialogTitle>
        </DialogHeader>
        <div className="max-h-[80vh] modal-scroll px-6 pb-6 overflow-y-auto">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
              <FormField control={form.control} name="title" render={({ field }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter news title" {...field} className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="excerpt" render={({ field }) => (
                <FormItem>
                  <FormLabel>Excerpt</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Enter a brief excerpt" className="min-h-[120px] rounded-xl focus-visible:ring-2 focus-visible:ring-purple-500" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="content" render={({ field }) => (
                <FormItem>
                  <FormLabel>Content</FormLabel>
                  <FormControl>
                    <TipTapEditor content={field.value} onChange={field.onChange} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="category" render={({ field }) => (
                <FormItem>
                  <FormLabel>Category</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-full border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0">
                        <SelectValue placeholder="Select a category" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {CATEGORIES.map(category => (
                        <SelectItem key={category} value={category}>{category}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="imageUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Image URL</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter image URL" {...field} className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="tags" render={({ field }) => (
                <FormItem>
                  <FormLabel>Tags</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter tags separated by commas" {...field} className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="source" render={({ field }) => (
                <FormItem>
                  <FormLabel>Source</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter source name" {...field} className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="sourceUrl" render={({ field }) => (
                <FormItem>
                  <FormLabel>Source URL</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter source URL" {...field} className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="author.name" render={({ field }) => (
                <FormItem>
                  <FormLabel>Author Name</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter author name" {...field} className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="author.avatar" render={({ field }) => (
                <FormItem>
                  <FormLabel>Author Avatar URL</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter author avatar URL" {...field} className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )} />

              <FormField control={form.control} name="status" render={({ field }) => (
                <FormItem>
                  <FormLabel>Status</FormLabel>
                  <Select onValueChange={field.onChange} value={field.value} defaultValue={field.value}>
                    <FormControl>
                      <SelectTrigger className="rounded-full border-gray-300 focus:border-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0">
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="draft">Draft</SelectItem>
                      <SelectItem value="published">Published</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )} />

              <div className="flex justify-end gap-3 pt-2">
                <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">Cancel</Button>
                <Button type="submit" disabled={isSubmitting} className="rounded-full bg-purple-600 text-white hover:bg-purple-700">
                  {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  {post ? 'Update' : 'Create'} News Post
                </Button>
              </div>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}


