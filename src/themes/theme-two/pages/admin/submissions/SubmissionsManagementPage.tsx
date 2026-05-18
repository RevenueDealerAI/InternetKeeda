// Theme Two admin page (independent implementation)
import Image from 'next/image';

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
import { Badge } from "@/components/ui/badge";
import { MoreHorizontal, Eye, Check, X } from "lucide-react";
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useToolSubmissions, useUpdateToolSubmissionStatus } from '@/lib/api/submissions';
import { SubmissionDetailsDialog } from '@/themes/theme-two/components/admin/submissions/SubmissionDetailsDialog';
import { normalizeImageUrl } from '@/utils/imageUrl';
import { useDemoMode } from '@/hooks/useDemoMode';

interface ToolSubmission {
  _id: string;
  toolName: string;
  description: string;
  websiteUrl: string;
  logoUrl: string;
  category: string;
  pricingType: string;
  status: 'pending' | 'approved' | 'rejected';
  submittedAt: string;
}

export default function SubmissionsManagementPage() {
  const { data: submissions = [], isLoading, error } = useToolSubmissions();
  const updateStatusMutation = useUpdateToolSubmissionStatus();
  const [selectedSubmission, setSelectedSubmission] = useState<ToolSubmission | null>(null);
  const { blockIfDemo } = useDemoMode();

  // View submission details
  const handleView = (submission: ToolSubmission) => {
    setSelectedSubmission(submission);
  };

  // Update submission status
  const handleUpdateStatus = async (submissionId: string, status: 'approved' | 'rejected') => {
    if (blockIfDemo()) return;

    try {
      await updateStatusMutation.mutateAsync({ submissionId, status });
      toast.success(`Submission ${status} successfully`);
    } catch (error) {
      console.error('Error updating submission:', error);
      toast.error('Failed to update submission');
    }
  };

  const getStatusColor = (status: 'pending' | 'approved' | 'rejected') => {
    switch (status) {
      case 'approved':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'rejected':
        return 'bg-red-50 text-red-700 border-red-200';
      default:
        return 'bg-yellow-50 text-yellow-700 border-yellow-200';
    }
  };

  // Safe date formatting helper
  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      // Check if date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      return format(date, 'MMM d, yyyy');
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const getSubmissionImageUrl = (submission: ToolSubmission) => {
    // If we have a logo URL, try to use it first
    if (submission.logoUrl && submission.logoUrl.trim() !== '') {
      const normalized = normalizeImageUrl(submission.logoUrl);
      if (normalized && normalized.trim() !== '') {
        return normalized;
      }
    }

    // Fallback to website favicon if website URL is present
    if (submission.websiteUrl) {
      try {
        const hostname = new URL(submission.websiteUrl).hostname;
        return `https://www.google.com/s2/favicons?domain=${hostname}&sz=128`;
      } catch {
        // Fallback to domain extraction if URL parsing fails
        const domain = submission.websiteUrl.replace(/^https?:\/\//, '').split('/')[0];
        if (domain) {
          return `https://www.google.com/s2/favicons?domain=${domain}&sz=128`;
        }
      }
    }

    // Final fallback to UI Avatars using name
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(submission.toolName || 'Tool')}&background=random`;
  };

  if (error) {
    return (
      <div className="container mx-auto py-8">
        <div className="text-center text-red-600">
          Failed to load submissions. Please try again later.
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold">Tool Submissions</h1>
          <p className="text-gray-500">
            {isLoading ? 'Loading...' : `${submissions.length} submissions found`}
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow">
        <Table>
          <TableHeader className="bg-purple-50">
            <TableRow>
              <TableHead className="text-purple-700 font-semibold">Tool Name</TableHead>
              <TableHead className="text-purple-700 font-semibold">Category</TableHead>
              <TableHead className="text-purple-700 font-semibold">Pricing</TableHead>
              <TableHead className="text-purple-700 font-semibold">Status</TableHead>
              <TableHead className="text-purple-700 font-semibold">Submitted</TableHead>
              <TableHead className="w-[100px] text-purple-700 font-semibold">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                  </div>
                </TableCell>
              </TableRow>
            ) : submissions.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8">
                  No submissions found
                </TableCell>
              </TableRow>
            ) : (
              submissions.map((submission) => (
                <TableRow key={submission._id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="relative w-8 h-8 rounded-lg overflow-hidden bg-gray-100">
                        <Image
                          src={getSubmissionImageUrl(submission)}
                          alt={submission.toolName || 'Tool logo'}
                          fill
                          className="object-cover"
                          unoptimized
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!target.src.includes('ui-avatars.com') && !target.src.includes('google.com/s2/favicons')) {
                              target.onerror = null;
                              const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(submission.toolName || 'Tool')}&background=8039fd&color=fff&bold=true`;
                              target.src = fallbackUrl;
                            }
                          }}
                        />
                      </div>
                      <div>
                        <div className="font-medium">{submission.toolName}</div>
                        <div className="text-sm text-gray-500 truncate max-w-[300px]">
                          {submission.description}
                        </div>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>{submission.category}</TableCell>
                  <TableCell>{submission.pricingType}</TableCell>
                  <TableCell>
                    <Badge className={getStatusColor(submission.status)}>
                      {submission.status}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {formatDate(submission.submittedAt)}
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
                          onClick={() => handleView(submission)}
                          className="flex items-center gap-2"
                        >
                          <Eye className="h-4 w-4" />
                          View
                        </DropdownMenuItem>
                        {submission.status === 'pending' && (
                          <>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(submission._id, 'approved')}
                              className="flex items-center gap-2 text-green-600"
                            >
                              <Check className="h-4 w-4" />
                              Approve
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(submission._id, 'rejected')}
                              className="flex items-center gap-2 text-red-600"
                            >
                              <X className="h-4 w-4" />
                              Reject
                            </DropdownMenuItem>
                          </>
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


      <SubmissionDetailsDialog
        submission={selectedSubmission}
        open={!!selectedSubmission}
        onOpenChange={(open) => !open && setSelectedSubmission(null)}
        onUpdateStatus={handleUpdateStatus}
      />
    </div >
  );
} 