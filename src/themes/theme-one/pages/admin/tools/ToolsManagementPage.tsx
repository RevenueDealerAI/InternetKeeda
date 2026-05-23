import { useState, useEffect } from "react";
import { useDebounce } from 'use-debounce';
import Image from 'next/image';
import { Tool } from "@/types/tool";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { 
  Plus, 
  MoreHorizontal, 
  Pencil, 
  Trash2, 
  Eye, 
  Archive,
  RotateCcw,
  Search,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { ToolFormDialog } from "@/components/admin/tools/ToolFormDialog";
import { useTools, useCreateTool, useUpdateTool, useDeleteTool, useRestoreTool, useUpdateToolStatus, type ToolsQueryParams } from "@/lib/api/tools";
import { toast } from "sonner";
import { cn } from "@/lib/utils";

export default function ToolsManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [debouncedSearchQuery] = useDebounce(searchQuery, 100);
  const [formOpen, setFormOpen] = useState(false);
  const [selectedTool, setSelectedTool] = useState<Tool | undefined>();
  const [currentPage, setCurrentPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [sortBy, setSortBy] = useState<string>('updatedAt');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const getToolImageUrl = (tool: Tool) => {
    if (tool.logo) return tool.logo;
    if (tool.websiteUrl) {
      try {
        const hostname = new URL(tool.websiteUrl).hostname;
        return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
      } catch {
        const domain = tool.websiteUrl.replace(/^https?:\/\//, '').split('/')[0];
        return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
      }
    }
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(tool.name || 'Tool')}`;
  };

  // Build query parameters - only search if 2+ characters to avoid unnecessary API calls
  const queryParams: ToolsQueryParams = {
    page: currentPage,
    limit: pageSize,
    search: debouncedSearchQuery && debouncedSearchQuery.length >= 2 ? debouncedSearchQuery : undefined,
    status: statusFilter === 'all' ? undefined : statusFilter,
    category: categoryFilter === 'all' ? undefined : categoryFilter,
    sortBy,
    sortOrder,
    // Admin view: include soft-deleted rows so the operator can
    // see what's gone and restore if needed.
    includeDeleted: true,
  };

  // Fetch tools with pagination
  const { data, isLoading, error } = useTools(queryParams);
  const tools = data?.data || [];
  const pagination = data?.pagination;

  // Show loading state when typing (before debounce completes)
  const isSearching = searchQuery !== debouncedSearchQuery;

  // Mutations
  const createToolMutation = useCreateTool();
  const updateToolMutation = useUpdateTool();
  const deleteToolMutation = useDeleteTool();
  const restoreToolMutation = useRestoreTool();
  const updateStatusMutation = useUpdateToolStatus();

  const handleRestore = async (tool: Tool) => {
    try {
      await restoreToolMutation.mutateAsync(tool.id || tool._id);
      toast.success(`Restored ${tool.name}`);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Restore failed');
    }
  };

  if (error) {
    console.error('Error fetching tools:', error);
    toast.error('Failed to load tools');
  }

  // Reset to first page when debounced search changes
  useEffect(() => {
    setCurrentPage(1);
  }, [debouncedSearchQuery]);

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
  };

  const handleFilterChange = (filterType: 'status' | 'category', value: string) => {
    if (filterType === 'status') {
      setStatusFilter(value);
    } else {
      setCategoryFilter(value);
    }
    setCurrentPage(1);
  };

  const handleSubmit = async (data: Omit<Tool, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      if (selectedTool) {
        // Update existing tool
        await updateToolMutation.mutateAsync({ 
          toolId: selectedTool.id, 
          data 
        });
        toast.success("Tool updated successfully");
      } else {
        // Create new tool
        await createToolMutation.mutateAsync(data);
        toast.success("Tool created successfully");
      }
      setFormOpen(false);
      setSelectedTool(undefined);
    } catch (error) {
      console.error('Error saving tool:', error);
      toast.error("Failed to save tool");
    }
  };

  const handleEdit = (tool: Tool) => {
    setSelectedTool(tool);
    setFormOpen(true);
  };

  const handleDelete = async (tool: Tool) => {
    if (window.confirm(`Are you sure you want to delete ${tool.name}?`)) {
      try {
        await deleteToolMutation.mutateAsync(tool.id);
        toast.success("Tool deleted successfully");
      } catch (error) {
        console.error('Error deleting tool:', error);
        toast.error("Failed to delete tool");
      }
    }
  };

  const handleArchive = async (tool: Tool) => {
    try {
      await updateStatusMutation.mutateAsync({
        toolId: tool.id,
        status: 'archived'
      });
      toast.success("Tool archived successfully");
    } catch (error) {
      console.error('Error archiving tool:', error);
      toast.error("Failed to archive tool");
    }
  };

  const getStatusColor = (status: Tool['status']) => {
    switch (status) {
      case 'published':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'draft':
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
      case 'archived':
        return 'bg-gray-50 text-gray-700 border-gray-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  const getPricingColor = (type: Tool['pricing']['type']) => {
    switch (type) {
      case 'free':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'freemium':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'paid':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      case 'enterprise':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Tools Management</h2>
            <p className="text-sm text-gray-500">
              Manage AI tools in the directory
            </p>
          </div>
          <Button onClick={() => {
            setSelectedTool(undefined);
            setFormOpen(true);
          }}>
            <Plus className="mr-2 h-4 w-4" />
            Add New Tool
          </Button>
        </div>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search tools... (min 2 chars)"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
                className="pl-9"
              />
              {(isSearching || isLoading) && searchQuery.length >= 2 && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="w-4 h-4 border-2 border-orange-600 border-t-transparent rounded-full animate-spin"></div>
                </div>
              )}
            </div>
            
            <Select value={statusFilter} onValueChange={(value) => handleFilterChange('status', value)}>
              <SelectTrigger className="w-32">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="published">Published</SelectItem>
                <SelectItem value="draft">Draft</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="archived">Archived</SelectItem>
              </SelectContent>
            </Select>

            <Select value={sortBy} onValueChange={setSortBy}>
              <SelectTrigger className="w-36">
                <SelectValue placeholder="Sort by" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="updatedAt">Updated</SelectItem>
                <SelectItem value="createdAt">Created</SelectItem>
                <SelectItem value="name">Name</SelectItem>
                <SelectItem value="views">Views</SelectItem>
                <SelectItem value="votes">Votes</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              variant="outline" 
              size="sm"
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>

          <div className="text-sm text-gray-500">
            {pagination ? `${((pagination.currentPage - 1) * pagination.limit) + 1}-${Math.min(pagination.currentPage * pagination.limit, pagination.totalCount)} of ${pagination.totalCount}` : ''}
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
          <div className="h-[600px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead>Tool</TableHead>
                  <TableHead>Category</TableHead>
                  <TableHead>Pricing</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Updated</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {tools.map((tool) => {
                  const isDeleted = !!tool.deletedAt;
                  return (
                  <TableRow key={tool.id} className={isDeleted ? "opacity-60" : undefined}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 relative">
                          <Image
                            src={getToolImageUrl(tool)}
                            alt={tool.name || 'Tool logo'}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <div>
                          <div className={cn("font-medium", isDeleted && "line-through text-gray-500")}>{tool.name}</div>
                          <div className="text-sm text-gray-500 truncate max-w-[300px]">
                            {tool.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary" className="bg-gray-100">
                        {tool.category}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={cn("capitalize", getPricingColor(tool.pricing.type))}>
                        {tool.pricing.type}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {isDeleted ? (
                        <Badge className="bg-red-100 text-red-700">Deleted</Badge>
                      ) : (
                        <Badge className={cn("capitalize", getStatusColor(tool.status))}>
                          {tool.status}
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500">
                        {new Date(tool.updatedAt).toLocaleDateString()}
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
                          {isDeleted ? (
                            <DropdownMenuItem
                              onClick={() => handleRestore(tool)}
                              disabled={restoreToolMutation.isPending}
                            >
                              <RotateCcw className="mr-2 h-4 w-4" />
                              Restore
                            </DropdownMenuItem>
                          ) : (
                            <>
                              <DropdownMenuItem onClick={() => handleEdit(tool)}>
                                <Pencil className="mr-2 h-4 w-4" />
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => window.open(`/ai-tools/${tool.slug}`, '_blank')}>
                                <Eye className="mr-2 h-4 w-4" />
                                View
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => handleArchive(tool)}>
                                <Archive className="mr-2 h-4 w-4" />
                                Archive
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                className="text-red-600"
                                onClick={() => handleDelete(tool)}
                              >
                                <Trash2 className="mr-2 h-4 w-4" />
                                Delete
                              </DropdownMenuItem>
                            </>
                          )}
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        </div>

        {/* Pagination Controls */}
        {pagination && pagination.totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-3 bg-white border-t">
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-500">
                Page {pagination.currentPage} of {pagination.totalPages}
              </span>
              
              <Select 
                value={pageSize.toString()} 
                onValueChange={(value) => {
                  setPageSize(parseInt(value));
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-20">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="10">10</SelectItem>
                  <SelectItem value="25">25</SelectItem>
                  <SelectItem value="50">50</SelectItem>
                  <SelectItem value="100">100</SelectItem>
                </SelectContent>
              </Select>
              
              <span className="text-sm text-gray-500">per page</span>
            </div>

            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={!pagination.hasPrevPage}
              >
                <ChevronLeft className="h-4 w-4" />
                Previous
              </Button>
              
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage(Math.min(pagination.totalPages, currentPage + 1))}
                disabled={!pagination.hasNextPage}
              >
                Next
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      <ToolFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        onSubmit={handleSubmit}
        initialData={selectedTool}
      />
    </div>
  );
} 