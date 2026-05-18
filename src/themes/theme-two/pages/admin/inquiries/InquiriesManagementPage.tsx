import { useState } from 'react';
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Mail, Check, Archive, Eye } from "lucide-react";
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useSalesInquiries, useUpdateSalesInquiryStatus } from '@/lib/api/inquiries';
import { useDemoMode } from '@/hooks/useDemoMode';

export default function InquiriesManagementPage() {
  const { data: inquiries = [], isLoading, error } = useSalesInquiries();
  const updateStatusMutation = useUpdateSalesInquiryStatus();
  const [selectedMessage, setSelectedMessage] = useState<{ fullName: string; message: string } | null>(null);
  const { blockIfDemo } = useDemoMode();

  // Send email
  const handleSendEmail = (email: string) => {
    window.location.href = `mailto:${email}`;
  };

  // Update inquiry status
  const handleUpdateStatus = async (inquiryId: string, status: 'contacted' | 'closed') => {
    if (blockIfDemo()) return;

    try {
      await updateStatusMutation.mutateAsync({ inquiryId, status });
      toast.success(`Inquiry marked as ${status} successfully`);
    } catch (error) {
      console.error('Error updating inquiry:', error);
      toast.error('Failed to update inquiry');
    }
  };

  const getStatusColor = (status: 'new' | 'contacted' | 'closed') => {
    switch (status) {
      case 'contacted':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'closed':
        return 'bg-gray-50 text-gray-700 border border-gray-200';
      default:
        return 'bg-yellow-50 text-yellow-700 border border-yellow-200';
    }
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-600">
          Failed to load inquiries. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Sales Inquiries</h1>
          <p className="text-gray-500">
            {isLoading ? 'Loading...' : `${inquiries.length} inquiries found`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-2xl shadow-sm border overflow-hidden">
        <Table>
          <TableHeader className="bg-purple-50">
            <TableRow>
              <TableHead className="text-purple-700 font-semibold">Contact</TableHead>
              <TableHead className="text-purple-700 font-semibold">Company</TableHead>
              <TableHead className="text-purple-700 font-semibold">Budget</TableHead>
              <TableHead className="text-purple-700 font-semibold">Message</TableHead>
              <TableHead className="text-purple-700 font-semibold">Status</TableHead>
              <TableHead className="text-purple-700 font-semibold">Submitted</TableHead>
              <TableHead className="w-[100px] text-purple-700 font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                  </div>
                </TableCell>
              </TableRow>
            ) : inquiries.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} className="text-center py-8">
                  No inquiries found
                </TableCell>
              </TableRow>
            ) : (
              inquiries.map((inquiry) => (
                <TableRow key={inquiry._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{inquiry.fullName}</div>
                      <div className="text-sm text-gray-500">{inquiry.email}</div>
                    </div>
                  </TableCell>
                  <TableCell>{inquiry.companyName}</TableCell>
                  <TableCell>{inquiry.monthlyBudget}</TableCell>
                  <TableCell>
                    <div className="max-w-[300px] flex items-center gap-2">
                      <span className="truncate">{inquiry.message}</span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setSelectedMessage({ fullName: inquiry.fullName, message: inquiry.message })}
                        className="h-7 px-2 flex-shrink-0 rounded-full"
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(inquiry.status) + ' rounded-full px-3 py-1 text-xs'}>
                      {inquiry.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {format(new Date(inquiry.submittedAt), 'MMM d, yyyy')}
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
                          onClick={() => handleSendEmail(inquiry.email)}
                          className="flex items-center gap-2"
                        >
                          <Mail className="h-4 w-4" />
                          Send Email
                        </DropdownMenuItem>
                        {inquiry.status === 'new' && (
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(inquiry._id, 'contacted')}
                            className="flex items-center gap-2 text-blue-600"
                          >
                            <Check className="h-4 w-4" />
                            Mark as Contacted
                          </DropdownMenuItem>
                        )}
                        {inquiry.status !== 'closed' && (
                          <DropdownMenuItem
                            onClick={() => handleUpdateStatus(inquiry._id, 'closed')}
                            className="flex items-center gap-2 text-gray-600"
                          >
                            <Archive className="h-4 w-4" />
                            Close Inquiry
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <Dialog open={!!selectedMessage} onOpenChange={() => setSelectedMessage(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Message from {selectedMessage?.fullName}</DialogTitle>
            <DialogDescription>
              Full message content
            </DialogDescription>
          </DialogHeader>
          <div className="mt-4">
            <p className="text-sm text-gray-700 whitespace-pre-wrap break-words">
              {selectedMessage?.message}
            </p>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
} 