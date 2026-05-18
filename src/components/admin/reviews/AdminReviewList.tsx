import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Review } from '@/types/Review';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Edit, 
  Trash2, 
  Star as StarIcon,
  ExternalLink
} from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useUser, useAuth } from '@clerk/clerk-react';
import { format } from 'date-fns';

interface AdminReviewListProps {
  status: 'pending' | 'approved' | 'rejected' | 'all';
  toolId?: string;
}

export function AdminReviewList({ status, toolId }: AdminReviewListProps) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editedComment, setEditedComment] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const { toast } = useToast();
  const { isLoaded, isSignedIn, user } = useUser();
  const { getToken } = useAuth();

  // Check if user is admin
  const isAdmin = user?.publicMetadata?.role === 'admin' || user?.publicMetadata?.role === 'superadmin';

  useEffect(() => {
    const fetchReviews = async () => {
      setLoading(true);
      setError(null);

      try {
        let url = `/api/reviews?page=${page}&limit=50&isAdmin=true`;
        
        if (status !== 'all') {
          url += `&status=${status}`;
        }
        
        if (toolId) {
          url += `&toolId=${toolId}`;
        }

        const token = await getToken();
        console.log('Got auth token:', token ? 'Valid token received' : 'No token');
        
        const response = await axios.get(url, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setReviews(response.data.reviews);
        setTotalPages(response.data.pagination.pages);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        setError('Failed to load reviews. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    if (isLoaded && isSignedIn && isAdmin) {
      fetchReviews();
    }
  }, [page, status, toolId, isLoaded, isSignedIn, isAdmin, getToken]);

  const handleApprove = async (reviewId: string) => {
    try {
      const token = await getToken();
      
      await axios.put(`/api/reviews/${reviewId}/moderate`, {
        status: 'approved'
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setReviews(reviews.map(review => 
        review._id === reviewId ? { ...review, status: 'approved' } : review
      ));
      
      toast({
        title: "Review approved",
        description: "The review has been published.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error approving review:', error);
      toast({
        title: "Error",
        description: "Failed to approve review.",
        variant: "destructive",
      });
    }
  };

  const handleReject = async (reviewId: string) => {
    try {
      const token = await getToken();
      
      await axios.put(`/api/reviews/${reviewId}/moderate`, {
        status: 'rejected'
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setReviews(reviews.map(review => 
        review._id === reviewId ? { ...review, status: 'rejected' } : review
      ));
      
      toast({
        title: "Review rejected",
        description: "The review has been rejected.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error rejecting review:', error);
      toast({
        title: "Error",
        description: "Failed to reject review.",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (reviewId: string) => {
    try {
      const token = await getToken();

      await axios.delete(`/api/reviews/${reviewId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setReviews(reviews.filter(review => review._id !== reviewId));
      
      toast({
        title: "Review deleted",
        description: "The review has been permanently deleted.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error deleting review:', error);
      toast({
        title: "Error",
        description: "Failed to delete review.",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (review: Review) => {
    setEditingReview(review);
    setEditedComment(review.comment);
  };

  const handleSaveEdit = async () => {
    if (!editingReview) return;
    
    try {
      const token = await getToken();
      
      await axios.put(`/api/reviews/${editingReview._id}`, {
        comment: editedComment
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setReviews(reviews.map(review => 
        review._id === editingReview._id ? { ...review, comment: editedComment } : review
      ));
      
      setEditingReview(null);
      
      toast({
        title: "Review updated",
        description: "The review has been updated successfully.",
        variant: "default",
      });
    } catch (error) {
      console.error('Error updating review:', error);
      toast({
        title: "Error",
        description: "Failed to update review.",
        variant: "destructive",
      });
    }
  };

  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo(0, 0);
  };

  const renderStarRating = (rating: number) => {
    return Array(5).fill(0).map((_, i) => (
      <StarIcon 
        key={i} 
        size={16} 
        className={i < rating ? "fill-yellow-400 text-yellow-400" : "text-gray-300"} 
      />
    ));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'pending':
        return <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200"><AlertCircle size={12} className="mr-1" /> Pending</Badge>;
      case 'approved':
        return <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200"><CheckCircle size={12} className="mr-1" /> Approved</Badge>;
      case 'rejected':
        return <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200"><XCircle size={12} className="mr-1" /> Rejected</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-8">
        <div className="animate-spin rounded-full border-4 border-solid border-green-500 border-t-transparent h-8 w-8"></div>
      </div>
    );
  }

  if (error) {
    return (
      <Card className="bg-red-50 border-red-200">
        <CardContent className="pt-6">
          <p className="text-red-700">{error}</p>
        </CardContent>
      </Card>
    );
  }

  if (reviews.length === 0) {
    return (
      <Card className="bg-gray-50 border-gray-200">
        <CardContent className="pt-6 text-center">
          <p className="text-gray-500">No reviews found with the selected criteria.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <div className="grid gap-4 auto-fit-grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))' }}>
        {reviews.map((review) => (
          <Card key={review._id} className="w-full overflow-hidden">
            <CardHeader className="pb-3">
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  {/* Tool Title - Most Prominent */}
                  {review.toolName ? (
                    <div className="mb-2">
                      <h3 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                        <ExternalLink size={14} className="text-blue-600" />
                        <span className="text-blue-600 hover:text-blue-800 cursor-pointer" 
                              onClick={() => window.open(`/ai-tools/${review.toolSlug || review.toolId}`, '_blank')}>
                          {review.toolName}
                        </span>
                      </h3>
                    </div>
                  ) : (
                    <div className="mb-2">
                      <h3 className="text-base font-semibold text-gray-500 flex items-center gap-2">
                        <ExternalLink size={14} className="text-gray-400" />
                        <span>Tool ID: {review.toolId}</span>
                      </h3>
                    </div>
                  )}
                  
                  {/* User Info */}
                  <CardTitle className="text-sm text-gray-600 flex items-center gap-2">
                    By: {review.userName || 'Anonymous'}
                  </CardTitle>
                  <p className="text-xs text-muted-foreground mt-1">
                    {review.createdAt && format(new Date(review.createdAt), 'PPP')}
                  </p>
                </div>
                <div>{getStatusBadge(review.status)}</div>
              </div>
              <div className="flex mt-2 items-center">
                <div className="flex mr-2">
                  {renderStarRating(review.rating)}
                </div>
                <span className="text-sm text-gray-500">{review.rating.toFixed(1)}</span>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-gray-700">
                {review.comment}
              </p>
            </CardContent>
            <CardFooter className="flex justify-between border-t bg-gray-50 pt-3 pb-3">
              <div className="flex gap-2">
                {review.status === 'pending' && (
                  <>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                      onClick={() => handleApprove(review._id)}
                    >
                      <CheckCircle size={14} className="mr-1" />
                      Approve
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                      onClick={() => handleReject(review._id)}
                    >
                      <XCircle size={14} className="mr-1" />
                      Reject
                    </Button>
                  </>
                )}
                {review.status === 'approved' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 bg-yellow-50 text-yellow-700 hover:bg-yellow-100 hover:text-yellow-800"
                    onClick={() => handleReject(review._id)}
                  >
                    <XCircle size={14} className="mr-1" />
                    Unpublish
                  </Button>
                )}
                {review.status === 'rejected' && (
                  <Button 
                    variant="outline" 
                    size="sm"
                    className="h-8 bg-green-50 text-green-700 hover:bg-green-100 hover:text-green-800"
                    onClick={() => handleApprove(review._id)}
                  >
                    <CheckCircle size={14} className="mr-1" />
                    Approve
                  </Button>
                )}
              </div>
              <div className="flex gap-2">
                <Dialog>
                  <DialogTrigger asChild>
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="h-8"
                      onClick={() => handleEdit(review)}
                    >
                      <Edit size={14} className="mr-1" />
                      Edit
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>Edit Review</DialogTitle>
                      <DialogDescription>
                        Make changes to the review comment. Click save when you're done.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="py-4">
                      <Textarea
                        value={editedComment}
                        onChange={(e) => setEditedComment(e.target.value)}
                        className="min-h-[120px]"
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button variant="outline" onClick={() => setEditingReview(null)}>
                          Cancel
                        </Button>
                      </DialogClose>
                      <DialogClose asChild>
                        <Button onClick={handleSaveEdit}>
                          Save Changes
                        </Button>
                      </DialogClose>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
                <Button 
                  variant="outline" 
                  size="sm"
                  className="h-8 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                  onClick={() => {
                    if (window.confirm('Are you sure you want to delete this review? This action cannot be undone.')) {
                      handleDelete(review._id);
                    }
                  }}
                >
                  <Trash2 size={14} className="mr-1" />
                  Delete
                </Button>
              </div>
            </CardFooter>
          </Card>
        ))}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-6">
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={page === 1}
              onClick={() => handlePageChange(page - 1)}
            >
              Previous
            </Button>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <Button
                key={pageNum}
                variant={pageNum === page ? "default" : "outline"}
                onClick={() => handlePageChange(pageNum)}
              >
                {pageNum}
              </Button>
            ))}
            <Button
              variant="outline"
              disabled={page === totalPages}
              onClick={() => handlePageChange(page + 1)}
            >
              Next
            </Button>
          </div>
        </div>
      )}
    </div>
  );
} 