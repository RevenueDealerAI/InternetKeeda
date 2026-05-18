// Theme Two admin page (independent implementation)
import Image from 'next/image';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Plus, Pencil, Trash2, Eye, BarChart } from "lucide-react";
import { format } from 'date-fns';
import { toast } from 'sonner';
import { NewsFormDialog } from '../../../components/admin/news/NewsFormDialog';
import { useAuth } from '@clerk/clerk-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { cn } from "@/lib/utils";
import { useDemoMode } from "@/hooks/useDemoMode";

const API_BASE_URL = "";

interface NewsPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  status: 'draft' | 'published';
  category: string;
  imageUrl: string;
  tags: string[];
  author: {
    name: string;
    avatar: string;
  };
  source: string;
  sourceUrl: string;
  views: number;
  shares: number;
  createdAt: string;
  updatedAt: string;
}

// Stats edit dialog component
interface StatsEditDialogProps {
  post: NewsPost | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess: () => void;
}

function StatsEditDialog({ post, open, onOpenChange, onSuccess }: StatsEditDialogProps) {
  const [views, setViews] = useState(post?.views.toString() || '0');
  const [shares, setShares] = useState(post?.shares.toString() || '0');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { getToken } = useAuth();

  useEffect(() => {
    if (post) {
      setViews(post.views.toString());
      setShares(post.shares.toString());
    }
  }, [post]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!post) return;

    // Check demo mode in parent component via callback
    try {
      setIsSubmitting(true);
      const token = await getToken();

      const response = await fetch(`${API_BASE_URL}/api/news/${post._id}/stats`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          views: parseInt(views) || 0,
          shares: parseInt(shares) || 0,
        }),
      });

      if (!response.ok) throw new Error('Failed to update stats');

      toast.success('Stats updated successfully');
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error updating stats:', error);
      toast.error('Failed to update stats');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px] rounded-2xl">
        <DialogHeader>
          <DialogTitle>Edit Post Stats</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid gap-4">
            <div className="space-y-2">
              <Label htmlFor="views">Views</Label>
              <Input
                id="views"
                type="number"
                min="0"
                value={views}
                onChange={(e) => setViews(e.target.value)}
                className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="shares">Shares</Label>
              <Input
                id="shares"
                type="number"
                min="0"
                value={shares}
                onChange={(e) => setShares(e.target.value)}
                className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500"
              />
            </div>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting} className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600">
              {isSubmitting ? 'Saving...' : 'Save changes'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default function NewsManagement() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<NewsPost | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isStatsDialogOpen, setIsStatsDialogOpen] = useState(false);
  const [selectedStatsPost, setSelectedStatsPost] = useState<NewsPost | null>(null);
  const router = useRouter();
  const { getToken } = useAuth();
  const { blockIfDemo } = useDemoMode();

  // Fetch news posts
  const fetchPosts = useCallback(async () => {
    try {
      setIsLoading(true);
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/news`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch news posts');
      const data = await response.json();
      setPosts(data);
    } catch (error) {
      console.error('Error fetching news posts:', error);
      toast.error('Failed to fetch news posts');
    } finally {
      setIsLoading(false);
    }
  }, [getToken]);

  useEffect(() => {
    fetchPosts();
  }, [fetchPosts]);

  // Delete news post
  const handleDelete = async (id: string) => {
    if (blockIfDemo()) return;

    if (!confirm('Are you sure you want to delete this news post?')) return;

    try {
      const token = await getToken();
      const response = await fetch(`${API_BASE_URL}/api/news/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) throw new Error('Failed to delete news post');

      toast.success('News post deleted successfully');
      fetchPosts();
    } catch (error) {
      console.error('Error deleting news post:', error);
      toast.error('Failed to delete news post');
    }
  };

  const handleView = (slug: string) => {
    router.push(`/news/${slug}`);
  };

  // Edit news post
  const handleEdit = (post: NewsPost) => {
    setSelectedPost(post);
    setIsFormOpen(true);
  };

  // Edit stats
  const handleEditStats = (post: NewsPost) => {
    if (blockIfDemo()) return;

    setSelectedStatsPost(post);
    setIsStatsDialogOpen(true);
  };

  const getStatusColor = (status: 'draft' | 'published') => {
    switch (status) {
      case 'published':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'draft':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">News Management</h1>
        <Button onClick={() => setIsFormOpen(true)} className="flex items-center gap-2 rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600">
          <Plus className="h-4 w-4" />
          Add News
        </Button>
      </div>

      <div className="bg-white rounded-2xl shadow border">
        <Table>
          <TableHeader className="bg-purple-50">
            <TableRow>
              <TableHead className="text-purple-700 font-semibold">Title</TableHead>
              <TableHead className="text-purple-700 font-semibold">Category</TableHead>
              <TableHead className="text-purple-700 font-semibold">Author</TableHead>
              <TableHead className="text-purple-700 font-semibold">Source</TableHead>
              <TableHead className="text-purple-700 font-semibold">Status</TableHead>
              <TableHead className="text-purple-700 font-semibold">Stats</TableHead>
              <TableHead className="text-purple-700 font-semibold">Date</TableHead>
              <TableHead className="w-[100px] text-purple-700 font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  Loading...
                </TableCell>
              </TableRow>
            ) : posts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8">
                  No news posts found
                </TableCell>
              </TableRow>
            ) : (
              posts.map((post) => (
                <TableRow key={post._id}>
                  <TableCell className="font-medium">{post.title}</TableCell>
                  <TableCell>{post.category}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <div className="relative w-6 h-6 rounded-full overflow-hidden">
                        <Image
                          src={post.author.avatar}
                          alt={post.author.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      {post.author.name}
                    </div>
                  </TableCell>
                  <TableCell>{post.source}</TableCell>
                  <TableCell>
                    <Badge className={cn("capitalize", getStatusColor(post.status))}>
                      {post.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-4">
                      <span title="Views" className="cursor-pointer" onClick={() => handleEditStats(post)}>
                        {post.views} 👁️
                      </span>
                      <span title="Shares" className="cursor-pointer" onClick={() => handleEditStats(post)}>
                        {post.shares} 🔄
                      </span>
                    </div>
                  </TableCell>
                  <TableCell>
                    {format(new Date(post.createdAt), 'MMM d, yyyy')}
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" className="h-8 w-8 p-0">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem
                          onClick={() => handleView(post.slug)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEdit(post)}
                          className="flex items-center gap-2"
                        >
                          <Pencil className="h-4 w-4" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleEditStats(post)}
                          className="flex items-center gap-2"
                        >
                          <BarChart className="h-4 w-4" />
                          Edit Stats
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          onClick={() => handleDelete(post._id)}
                          className="flex items-center gap-2 text-red-600"
                        >
                          <Trash2 className="h-4 w-4" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <NewsFormDialog
        open={isFormOpen}
        onOpenChange={setIsFormOpen}
        post={selectedPost}
        onSuccess={() => {
          setIsFormOpen(false);
          setSelectedPost(null);
          fetchPosts();
        }}
      />

      <StatsEditDialog
        open={isStatsDialogOpen}
        onOpenChange={setIsStatsDialogOpen}
        post={selectedStatsPost}
        onSuccess={fetchPosts}
      />
    </div>
  );
} 