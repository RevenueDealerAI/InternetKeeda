import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { ReviewItem } from './ReviewItem';
import { Review, ReviewListResponse } from '@/types/Review';
import { useAuth } from '@clerk/clerk-react';
const LoadingSpinner = () => (
  <div className="flex justify-center py-4">
    <div className="animate-spin rounded-full border-4 border-solid border-blue-500 border-t-transparent h-8 w-8"></div>
  </div>
);

interface ReviewListProps {
  toolId?: string;
  isAdmin?: boolean;
  onModerate?: (reviewId: string) => void;
}

const ReviewList: React.FC<ReviewListProps> = ({
  toolId,
  isAdmin = false,
  onModerate
}) => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [page, setPage] = useState<number>(1);
  const [totalPages, setTotalPages] = useState<number>(1);
  const { isSignedIn, userId } = useAuth();
  
  useEffect(() => {
    const fetchReviews = async () => {
      try {
        setLoading(true);
        
        // Check if toolId has a temporary ID format
        if (toolId && typeof toolId === 'string' && toolId.indexOf('temp-') >= 0) {
          console.log(`Tool with temporary ID detected: ${toolId}. Not fetching reviews.`);
          // Don't try to fetch reviews for temp IDs - just return empty
          setReviews([]);
          setTotalPages(0);
          setError(null);
          setLoading(false);
          return;
        }
        
        let url = `/api/reviews?page=${page}`;
        
        // If tool ID is provided, filter by tool
        if (toolId) {
          url += `&toolId=${toolId}`;
        }
        
        // If admin, show all statuses
        if (isAdmin) {
          url += '&status=all&isAdmin=true';
        }
        
        console.log('Fetching reviews from:', url);
        
        const response = await axios.get<ReviewListResponse>(url);
        
        console.log('Review data received:', {
          total: response.data.pagination.total,
          page: response.data.pagination.page,
          pages: response.data.pagination.pages,
          reviewCount: response.data.reviews.length
        });
        
        // Filter out invalid reviews
        const validReviews = response.data.reviews.filter(review => {
          // Check for null or missing username
          if (!review.userName || review.userName.includes('null')) {
            console.log('Filtering out review with invalid username:', review);
            return false;
          }
          
          // Check for future dates
          const reviewDate = new Date(review.createdAt);
          const currentDate = new Date();
          if (reviewDate > currentDate) {
            console.log('Filtering out review with future date:', review);
            return false;
          }
          
          return true;
        });
        
        console.log(`Filtered ${response.data.reviews.length - validReviews.length} invalid reviews`);
        setReviews(validReviews);
        setTotalPages(response.data.pagination.pages);
        setError(null);
      } catch (error) {
        console.error('Error fetching reviews:', error);
        
        // Provide more specific error messages
        if (axios.isAxiosError(error)) {
          if (error.response) {
            console.error('Response error:', error.response.status, error.response.data);
            setError(`Failed to load reviews (${error.response.status}). ${error.response.data?.error || ''}`);
          } else if (error.request) {
            setError('No response received from server. Please check your connection.');
          } else {
            setError(`Request failed: ${error.message}`);
          }
        } else {
          setError('Failed to load reviews. Please try again later.');
        }
      } finally {
        setLoading(false);
      }
    };
    
    fetchReviews();
  }, [toolId, isAdmin, page]);
  
  const handlePageChange = (newPage: number) => {
    setPage(newPage);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };
  
  if (loading) {
    return <LoadingSpinner />;
  }
  
  if (error) {
    return (
      <div className="rounded-md bg-red-50 p-4 dark:bg-red-900">
        <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
      </div>
    );
  }
  
  if (reviews.length === 0) {
    // Check for different types of tools
    const isTempId = toolId && typeof toolId === 'string' && toolId.indexOf('temp-') >= 0;
    const isSponsoredTool = toolId && typeof toolId === 'string' && toolId.includes('sponsor');
    
    let message = "No reviews yet. Be the first to share your experience!";
    
    if (isTempId) {
      message = "Reviews are not available for this tool. This tool is using a temporary ID.";
    } else if (isSponsoredTool) {
      message = "No reviews yet for this sponsored tool. Reviews for sponsored tools are verified before display.";
    }
    
    return (
      <div className="rounded-md bg-gray-50 p-4 text-center dark:bg-gray-800">
        <p className="text-sm text-gray-700 dark:text-gray-300">
          {message}
        </p>
      </div>
    );
  }
  
  return (
    <div>
      <div className="space-y-4">
        {reviews.map((review) => (
          <ReviewItem
            key={review._id}
            review={review}
            isAdmin={isAdmin}
            onModerate={onModerate}
          />
        ))}
      </div>
      
      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex justify-center">
          <nav className="flex items-center space-x-2">
            <button
              onClick={() => handlePageChange(page - 1)}
              disabled={page === 1}
              className={`rounded-md px-3 py-1 text-sm ${
                page === 1
                  ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Previous
            </button>
            
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => handlePageChange(pageNum)}
                className={`rounded-md px-3 py-1 text-sm ${
                  page === pageNum
                    ? 'bg-blue-500 text-white dark:bg-blue-600'
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
                }`}
              >
                {pageNum}
              </button>
            ))}
            
            <button
              onClick={() => handlePageChange(page + 1)}
              disabled={page === totalPages}
              className={`rounded-md px-3 py-1 text-sm ${
                page === totalPages
                  ? 'cursor-not-allowed bg-gray-100 text-gray-400 dark:bg-gray-800 dark:text-gray-500'
                  : 'bg-gray-200 text-gray-700 hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
              }`}
            >
              Next
            </button>
          </nav>
        </div>
      )}
    </div>
  );
};

export default ReviewList; 