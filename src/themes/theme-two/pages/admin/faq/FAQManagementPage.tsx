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
  EyeOff,
  Search,
  HelpCircle
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { FAQFormDialog } from "@/components/admin/faq/FAQFormDialog";
import { FAQ, useFAQs, useCreateFAQ, useUpdateFAQ, useDeleteFAQ } from "@/lib/api/faq";
import { toast } from "sonner";
import { useDemoMode } from "@/hooks/useDemoMode";

export default function FAQManagementPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [formOpen, setFormOpen] = useState(false);
  const [selectedFAQ, setSelectedFAQ] = useState<FAQ | undefined>();

  const { data, isLoading, error, refetch } = useFAQs({ includeInactive: true });
  const faqs = data?.data || [];

  const createFAQMutation = useCreateFAQ();
  const updateFAQMutation = useUpdateFAQ();
  const deleteFAQMutation = useDeleteFAQ();
  const { blockIfDemo } = useDemoMode();

  useEffect(() => {
    refetch();
  }, [refetch]);

  if (error) {
    console.error('Error fetching FAQs:', error);
    toast.error('Failed to load FAQs');
  }

  const filteredFAQs = faqs.filter(faq =>
    faq.question.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.answer.toLowerCase().includes(searchQuery.toLowerCase()) ||
    faq.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleEdit = (faq: FAQ) => {
    setSelectedFAQ(faq);
    setFormOpen(true);
  };

  const handleDelete = async (faq: FAQ) => {
    if (blockIfDemo()) return;

    if (window.confirm(`Are you sure you want to delete "${faq.question}"?`)) {
      try {
        await deleteFAQMutation.mutateAsync(faq._id);
        toast.success("FAQ deleted successfully");
        refetch();
      } catch (error) {
        console.error('Error deleting FAQ:', error);
        toast.error("Failed to delete FAQ");
      }
    }
  };

  const handleToggleStatus = async (faq: FAQ, e?: React.MouseEvent) => {
    if (blockIfDemo()) return;

    e?.preventDefault();
    e?.stopPropagation();

    try {
      await updateFAQMutation.mutateAsync({
        faqId: faq._id,
        data: {
          isActive: !faq.isActive,
        },
      });
      toast.success(`FAQ ${!faq.isActive ? 'activated' : 'deactivated'} successfully`);
      refetch();
    } catch (error) {
      console.error('Error updating FAQ status:', error);
      toast.error("Failed to update FAQ status");
    }
  };

  interface FormData {
    question: string;
    answer: string;
    category: string;
    order: number;
    isActive: boolean;
  }

  const handleSubmit = async (formData: FormData) => {
    if (blockIfDemo()) return;

    try {
      if (selectedFAQ?._id) {
        await updateFAQMutation.mutateAsync({
          faqId: selectedFAQ._id,
          data: formData,
        });
        toast.success("FAQ updated successfully");
      } else {
        await createFAQMutation.mutateAsync(formData);
        toast.success("FAQ created successfully");
      }
      setFormOpen(false);
      setSelectedFAQ(undefined);
      refetch();
    } catch (error) {
      console.error('Error saving FAQ:', error);
      toast.error("Failed to save FAQ");
    }
  };

  return (
    <div>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h2 className="text-2xl font-semibold tracking-tight">FAQ Management</h2>
            <p className="text-sm text-gray-500">
              {isLoading
                ? "Loading FAQs..."
                : `${filteredFAQs.length} FAQs found`
              }
            </p>
          </div>
          <Button onClick={() => {
            setSelectedFAQ(undefined);
            setFormOpen(true);
          }}
            style={{
              background: 'linear-gradient(to right, #9333ea, #ec4899, #9333ea)',
              color: '#ffffff',
              border: 'none',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to right, #7c3aed, #db2777, #7c3aed)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'linear-gradient(to right, #9333ea, #ec4899, #9333ea)';
            }}
            className="rounded-full font-medium shadow-lg hover:shadow-xl transition-all duration-200">
            <Plus className="mr-2 h-4 w-4" />
            New FAQ
          </Button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search FAQs..."
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
          ) : filteredFAQs.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-gray-500">
              <HelpCircle className="h-12 w-12 mb-4" />
              <p className="text-lg font-medium">No FAQs found</p>
              <p className="text-sm">
                {searchQuery
                  ? "Try adjusting your search query"
                  : "Click the 'New FAQ' button to create your first FAQ"
                }
              </p>
            </div>
          ) : (
            <div className="h-[600px] overflow-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white z-10">
                  <TableRow>
                    <TableHead>Question</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Order</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="w-[70px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredFAQs.map((faq) => (
                    <TableRow key={faq._id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{faq.question}</div>
                          <div className="text-sm text-gray-500 truncate max-w-[400px]">
                            {faq.answer}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{faq.category}</Badge>
                      </TableCell>
                      <TableCell>{faq.order}</TableCell>
                      <TableCell>
                        <Badge className={cn(
                          faq.isActive
                            ? "bg-purple-50 text-purple-700 border-purple-200"
                            : "bg-gray-50 text-gray-700 border-gray-200"
                        )}>
                          {faq.isActive ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onSelect={() => handleEdit(faq)}>
                              <Pencil className="h-4 w-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={(e) => {
                                e.preventDefault();
                                handleToggleStatus(faq);
                              }}
                            >
                              {faq.isActive ? (
                                <>
                                  <EyeOff className="h-4 w-4 mr-2" />
                                  Deactivate
                                </>
                              ) : (
                                <>
                                  <Eye className="h-4 w-4 mr-2" />
                                  Activate
                                </>
                              )}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onSelect={() => handleDelete(faq)}
                              className="text-red-600 focus:text-red-600"
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
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
          )}
        </div>
      </div>

      <FAQFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        faq={selectedFAQ}
        onSubmit={handleSubmit}
      />
    </div>
  );
}




