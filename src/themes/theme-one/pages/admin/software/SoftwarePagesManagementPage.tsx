import { useState } from "react";
import { SoftwarePage, useSoftwarePages } from "@/contexts/SoftwarePagesContext";
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
  ExternalLink,
  BarChart3,
  PenTool,
  Users,
  Mail,
  CalendarClock,
  Briefcase,
  Target,
  CheckCircle,
  XCircle,
  FileText,
  Info
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { cn } from "@/lib/utils";
import { SoftwarePageFormDialog } from "@/components/admin/software/SoftwarePageFormDialog";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

// Map of icon names to components for rendering
const IconMap: Record<string, React.ComponentType<React.SVGProps<SVGSVGElement>>> = {
  BarChart3,
  PenTool,
  Users,
  Mail,
  CalendarClock,
  Briefcase,
  Target
};

function SoftwarePagesManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedPage, setSelectedPage] = useState<SoftwarePage | undefined>();

  // Get pages from context
  const { pages, isLoading, error, addPage, updatePage, deletePage } = useSoftwarePages();

  if (error) {
    console.error('Error fetching software pages:', error);
    toast.error('Failed to load software pages');
  }

  const filteredPages = pages.filter(page =>
    page.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
    page.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSubmit = async (data: Partial<SoftwarePage>) => {
    try {
      if (selectedPage) {
        // Update existing page
        updatePage(selectedPage.id, data);
        toast.success(`Updated software page: ${data.title}`);
      } else {
        // Add new page
        addPage(data);
        toast.success(`Created new software page: ${data.title}`);
      }
      setFormOpen(false);
      setSelectedPage(undefined);
    } catch (error) {
      console.error('Error saving software page:', error);
      toast.error("Failed to save software page");
    }
  };

  const handleEdit = (page: SoftwarePage) => {
    setSelectedPage(page);
    setFormOpen(true);
  };

  const handleDelete = async (page: SoftwarePage) => {
    if (window.confirm(`Are you sure you want to delete ${page.title}?`)) {
      try {
        deletePage(page.id);
        toast.success(`Deleted software page: ${page.title}`);
      } catch (error) {
        console.error('Error deleting software page:', error);
        toast.error("Failed to delete software page");
      }
    }
  };

  const renderIcon = (iconName: string, colorClass: string) => {
    const IconComponent = IconMap[iconName] || BarChart3;
    return <IconComponent className={cn("h-5 w-5", colorClass)} />;
  };
  
  // Helper function to check if page has content
  const hasContent = (page: SoftwarePage) => {
    return page.content && (
      page.content.introduction || 
      page.content.toolsHeading || 
      page.content.toolsDescription || 
      page.content.author || 
      page.content.lastUpdated
    );
  };
  
  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
      </div>
    );
  }

  return (
    <div>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">Best Software Pages</h2>
            <p className="text-sm text-gray-500">
              Manage "Best Software" pages that appear in the navigation menu
            </p>
          </div>
          <Button onClick={() => {
            setSelectedPage(undefined);
            setFormOpen(true);
          }}
          className="bg-green-500 hover:bg-green-600">
            <Plus className="mr-2 h-4 w-4" />
            Add New Page
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search pages..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
        </div>

        <div className="bg-white shadow-sm rounded-lg border overflow-hidden">
          <div className="h-[600px] overflow-auto">
            <Table>
              <TableHeader className="sticky top-0 bg-white z-10">
                <TableRow>
                  <TableHead>Icon</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Slug</TableHead>
                  <TableHead>Featured</TableHead>
                  <TableHead>Content</TableHead>
                  <TableHead className="w-[70px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredPages.map((page) => (
                  <TableRow key={page.id}>
                    <TableCell>
                      <div className={cn("flex items-center justify-center w-10 h-10 rounded-lg", page.bgColor)}>
                        {renderIcon(page.icon, page.iconColor)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{page.title}</div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm text-gray-500 max-w-[300px] truncate">
                        {page.description}
                      </div>
                    </TableCell>
                    <TableCell>
                      <code className="px-2 py-1 bg-gray-100 rounded text-xs">
                        {page.slug}
                      </code>
                    </TableCell>
                    <TableCell>
                      {page.featured ? (
                        <Badge className="bg-green-100 text-green-700 border-0">
                          <CheckCircle className="mr-1 h-3 w-3" /> Featured
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="text-gray-500">
                          <XCircle className="mr-1 h-3 w-3" /> Not Featured
                        </Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      <TooltipProvider>
                        <Tooltip>
                          <TooltipTrigger>
                            {hasContent(page) ? (
                              <Badge className="bg-blue-100 text-blue-700 border-0">
                                <FileText className="mr-1 h-3 w-3" /> Configured
                              </Badge>
                            ) : (
                              <Badge variant="outline" className="text-gray-500">
                                <Info className="mr-1 h-3 w-3" /> Not Configured
                              </Badge>
                            )}
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>
                              {hasContent(page) 
                                ? "This page has custom content configured" 
                                : "Add custom content in the 'Page Content' tab"}
                            </p>
                          </TooltipContent>
                        </Tooltip>
                      </TooltipProvider>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleEdit(page)}>
                            <Pencil className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => window.open(`/${page.slug}`, '_blank')}>
                            <Eye className="mr-2 h-4 w-4" />
                            View
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(page)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      <SoftwarePageFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        page={selectedPage}
        onSubmit={handleSubmit}
      />
    </div>
  );
}

export default SoftwarePagesManagementPage; 