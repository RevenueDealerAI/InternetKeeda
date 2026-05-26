import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-react';
import ReviewList from '@/themes/theme-one/components/reviews/ReviewList';
import ReviewModerationDialog from './ReviewModerationDialog';
import LoadingSpinner from '../../ui/LoadingSpinner';
import { Review } from '../../../types/Review';

const ReviewManagement: React.FC = () => {
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedReview, setSelectedReview] = useState<Review | null>(null);
  const [isModerationDialogOpen, setIsModerationDialogOpen] = useState<boolean>(false);
  const [refreshTrigger, setRefreshTrigger] = useState<number>(0);
  const { getToken, isSignedIn } = useAuth();
  const { user } = useUser();
  
  // Check if user is admin
  const [isAdmin, setIsAdmin] = useState<boolean>(false);
  
  useEffect(() => {
    if (isSignedIn && user) {
      const meta = user.publicMetadata as Record<string, unknown> | undefined;
      setIsAdmin(meta?.isAdmin === true || meta?.role === 'admin' || meta?.role === 'superadmin');
    }
  }, [isSignedIn, user]);
  
  // Redirect if not admin
  useEffect(() => {
    if (isSignedIn && !isAdmin) {
      window.location.href = '/';
    }
  }, [isSignedIn, isAdmin]);
  
  const handleModerate = async (reviewId: string) => {
    try {
      setLoading(true);
      
      const token = await getToken();
      const response = await axios.get(`/api/reviews/${reviewId}`, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      setSelectedReview(response.data);
      setIsModerationDialogOpen(true);
    } catch (err) {
      console.error('Error fetching review:', err);
      setError('Failed to fetch review details.');
    } finally {
      setLoading(false);
    }
  };
  
  const handleModerationSuccess = () => {
    setIsModerationDialogOpen(false);
    setSelectedReview(null);
    // Trigger a refresh of the reviews list
    setRefreshTrigger((prev) => prev + 1);
  };
  
  if (!isSignedIn || (!isAdmin && isSignedIn)) {
    return (
      <div className="flex min-h-[400px] items-center justify-center">
        <LoadingSpinner />
      </div>
    );
  }
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8 border-b border-gray-200 pb-4 dark:border-gray-700">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Review Management</h1>
        <p className="mt-2 text-gray-600 dark:text-gray-400">
          Manage user reviews by approving, rejecting, or providing admin responses.
        </p>
      </div>
      
      <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-sm dark:border-gray-700 dark:bg-gray-800">
        <h2 className="mb-4 text-xl font-semibold text-gray-800 dark:text-white">
          Pending Reviews
        </h2>
        
        <ReviewList 
          isAdmin={true} 
          onModerate={handleModerate} 
          key={`review-list-${refreshTrigger}`}
        />
      </div>
      
      {selectedReview && (
        <ReviewModerationDialog
          review={selectedReview}
          isOpen={isModerationDialogOpen}
          onClose={() => setIsModerationDialogOpen(false)}
          onSuccess={handleModerationSuccess}
        />
      )}
    </div>
  );
};

export default ReviewManagement; 