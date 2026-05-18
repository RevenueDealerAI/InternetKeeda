import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Eye,
  Search,
  Calendar,
  User,
  FileText
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { BlogFormDialog } from "@/components/admin/blog/BlogFormDialog";
import { BlogPost } from "@/types/blog";
import { toast } from "sonner";
import { useBlogPosts, useCreateBlogPost, useUpdateBlogPost, useDeleteBlogPost } from "@/lib/api/blog";
import { useAuth } from "@clerk/clerk-react";

export default function BlogManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPost, setSelectedPost] = useState<BlogPost | undefined>();
  const { userId } = useAuth();

  // Fetch blog posts
  const { data: posts = [], isLoading, error, refetch } = useBlogPosts();

  // Mutations
  const createPostMutation = useCreateBlogPost();
  const updatePostMutation = useUpdateBlogPost();
  const deletePostMutation = useDeleteBlogPost();

  useEffect(() => {
    // Fetch posts on mount
    refetch();
  }, [refetch]);

  if (error) {
    console.error('Error fetching blog posts:', error);
    toast.error('Failed to load blog posts');
  }

  const filteredPosts = posts.filter(post =>
    post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    post.excerpt.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const getStatusColor = (status: BlogPost['status']) => {
    switch (status) {
      case 'published':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'draft':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const handleEdit = (post: BlogPost) => {
    setSelectedPost(post);
    setFormOpen(true);
  };

  const handleDelete = async (post: BlogPost) => {
    if (window.confirm(`Are you sure you want to delete "${post.title}"?`)) {
      try {
        await deletePostMutation.mutateAsync(post._id);
        toast.success("Post deleted successfully");
        refetch();
      } catch (error) {
        console.error('Error deleting post:', error);
        toast.error("Failed to delete post");
      }
    }
  };

  const handleToggleStatus = async (post: BlogPost) => {
    try {
      const newStatus = post.status === 'draft' ? 'published' : 'draft';
      await updatePostMutation.mutateAsync({
        postId: post._id,
        data: {
          status: newStatus,
          updatedAt: new Date().toISOString(),
        },
      });
      toast.success(`Post ${newStatus === 'published' ? 'published' : 'unpublished'} successfully`);
      refetch();
    } catch (error) {
      console.error('Error updating post status:', error);
      toast.error("Failed to update post status");
    }
  };

  interface FormData {
    title: string;
    slug: string;
    excerpt: string;
    content: string;
    category: string;
    readTime: string;
    imageUrl: string;
    tags: string;
    status: 'draft' | 'published';
  }

  const handleSubmit = async (formData: FormData) => {
    try {
      // Transform tags from comma-separated string to array
      const transformedData = {
        ...formData,
        tags: formData.tags.split(',').map(tag => tag.trim()).filter(tag => tag.length > 0)
      };

      if (selectedPost?._id) {
        await updatePostMutation.mutateAsync({
          postId: selectedPost._id,
          data: {
            ...transformedData,
            updatedAt: new Date().toISOString(),
          },
        });
        toast.success("Post updated successfully");
      } else {
        await createPostMutation.mutateAsync({
          ...transformedData,
          date: new Date().toISOString(),
        });
        toast.success("Post created successfully");
      }
      setFormOpen(false);
      setSelectedPost(undefined);
      refetch();
    } catch (error) {
      console.error('Error saving post:', error);
      toast.error("Failed to save post");
    }
  };

  return (
    <div>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Blog Management</h2>
            <p className="text-sm text-gray-500">
              {isLoading 
                ? "Loading blog posts..."
                : `${filteredPosts.length} blog posts found`
              }
            </p>
          </div>
          <Button onClick={() => {
            setSelectedPost(undefined);
            setFormOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            New Post
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search posts..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <Button 
            variant="outline" 
            onClick={() => refetch()}
            disabled={isLoading}
          >
            Refresh
          </Button>
        </div>

        <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <FileText className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No blog posts found</p>
              <p className="text-sm">
                {searchQuery 
                  ? "Try adjusting your search query"
                  : "Click the 'New Post' button to create your first blog post"
                }
              </p>
            </div>
          ) : (
            <div className="h-[600px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead>Title</TableHead>
                    <TableHead>Author</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Updated</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredPosts.map((post) => (
                    <TableRow key={post._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{post.title}</div>
                          <div className="text-sm text-gray-500 truncate max-w-[300px]">
                            {post.excerpt}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <User className="h-4 w-4 text-gray-500" />
                          <span>{post.author.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge className={cn("capitalize", getStatusColor(post.status))}>
                          {post.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {new Date(post.createdAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm text-gray-500">
                          {new Date(post.updatedAt).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleEdit(post)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleDelete(post)}>
                              <Trash2 className="h-4 w-4 mr-2" />
                              Delete
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleToggleStatus(post)}>
                              <Eye className="h-4 w-4 mr-2" />
                              {post.status === 'draft' ? 'Publish' : 'Unpublish'}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </div>
      </div>
      
      <BlogFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        post={selectedPost}
        onSubmit={handleSubmit}
      />
    </div>
  );
} 