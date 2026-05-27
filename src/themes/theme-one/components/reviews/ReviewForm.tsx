import React, { useState } from 'react';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import axios from 'axios';
import { useAuth, useUser } from '@clerk/clerk-react';

// Define inline LoadingSpinner component
const LoadingSpinner = ({ size = 'medium' }: { size?: 'small' | 'medium' | 'large' }) => {
  const sizeClass = {
    small: 'h-4 w-4 border-2',
    medium: 'h-8 w-8 border-4',
    large: 'h-12 w-12 border-4'
  };
  
  return (
    <div className="flex justify-center">
      <div
        className={`animate-spin rounded-full border-t-transparent border-solid border-blue-500 dark:border-blue-400 ${sizeClass[size]}`}
      ></div>
    </div>
  );
};

interface ReviewFormProps {
  toolId: string;
  onSuccess?: () => void;
}

const ReviewForm: React.FC<ReviewFormProps> = ({ toolId, onSuccess }) => {
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [comment, setComment] = useState<string>('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  
  const { isSignedIn, getToken } = useAuth();
  const { user } = useUser();
  
  // Check if this is a tool with a temporary ID
  const isTempId = toolId && typeof toolId === 'string' && toolId.indexOf('temp-') >= 0;
  
  // If it's a temp ID tool, show a message instead of the form
  if (isTempId) {
    return (
      <div className="rounded-md bg-yellow-50 p-4 dark:bg-yellow-900">
        <p className="text-sm text-yellow-700 dark:text-yellow-200">
          Reviews are not available for this tool because it is using a temporary ID. 
          This typically happens for sponsored tools that haven't been properly linked to the database.
        </p>
      </div>
    );
  }
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isSignedIn || !user) {
      setError('You must be signed in to submit a review');
      return;
    }
    
    if (rating === 0) {
      setError('Please select a rating');
      return;
    }
    
    if (!comment.trim()) {
      setError('Please provide a comment');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const token = await getToken();
      
      if (!token) {
        setError('Authentication token could not be retrieved. Please try again or sign out and sign back in.');
        setLoading(false);
        return;
      }
      
      console.log('DEBUG: Submitting review with the following information:');
      console.log('Tool ID:', toolId);
      console.log('User ID:', user.id);
      console.log('Rating:', rating);
      console.log('Comment length:', comment.length);
      
      if (!toolId) {
        console.error('ERROR: toolId is undefined or empty');
        setError('Invalid tool ID. Please try again on a different tool.');
        setLoading(false);
        return;
      }
      
      const payload = {
        toolId,
        rating,
        comment
      };
      
      const response = await axios({
        method: 'POST',
        url: `/api/reviews`,
        data: payload,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        }
      });
      
      console.log('Review submitted successfully:', response.data);
      
      setSuccess(true);
      setComment('');
      setRating(0);
      
      if (onSuccess) {
        onSuccess();
      }
    } catch (error: unknown) {
      console.error('Error submitting review:', error);
      
      if (axios.isAxiosError(error) && error.response) {
        const responseData = error.response.data;
        const statusCode = error.response.status;
        
        console.error('API error response:', { statusCode, responseData });
        
        if (responseData && responseData.error) {
          setError(responseData.error);
        } else if (statusCode === 401) {
          setError('You are not authorized. Please login again.');
        } else if (statusCode === 403) {
          setError('You do not have permission to submit a review.');
        } else {
          setError('An error occurred while submitting your review. Please try again.');
        }
      } else {
        setError('Failed to connect to the server. Please check your internet connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };
  
  const renderStars = () => {
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      stars.push(
        <button
          key={i}
          type="button"
          onClick={() => setRating(i)}
          onMouseEnter={() => setHoverRating(i)}
          onMouseLeave={() => setHoverRating(0)}
          className="focus:outline-none"
        >
          {i <= (hoverRating || rating) ? (
            <StarIcon 
              className="h-6 w-6 text-yellow-400" 
              aria-hidden="true" 
            />
          ) : (
            <StarOutlineIcon 
              className="h-6 w-6 text-yellow-400" 
              aria-hidden="true" 
            />
          )}
        </button>
      );
    }
    
    return stars;
  };
  
  if (!isSignedIn) {
    return (
      <div className="rounded-md bg-blue-50 p-4 dark:bg-blue-900">
        <p className="text-sm text-blue-700 dark:text-blue-200">
          Please login to leave a review.
        </p>
      </div>
    );
  }
  
  if (success) {
    return (
      <div className="rounded-md bg-green-50 p-4 dark:bg-green-900">
        <p className="text-sm text-green-700 dark:text-green-200">
          Your review has been submitted successfully and is pending moderation.
        </p>
        
        <button
          onClick={() => setSuccess(false)}
          className="mt-2 rounded-md bg-green-100 px-4 py-2 text-sm font-medium text-green-800 hover:bg-green-200 dark:bg-green-800 dark:text-green-100 dark:hover:bg-green-700"
        >
          Write Another Review
        </button>
      </div>
    );
  }
  
  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300">
          Your Rating
        </label>
        <div className="flex items-center space-x-1">{renderStars()}</div>
      </div>
      
      <div>
        <label
          htmlFor="comment"
          className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
        >
          Your Review
        </label>
        <textarea
          id="comment"
          rows={4}
          placeholder="Share your experience with this tool..."
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          className="w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
          required
        />
      </div>
      
      {error && (
        <div className="rounded-md bg-red-50 p-3 dark:bg-red-900">
          <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
        </div>
      )}
      
      <div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-md bg-blue-500 px-4 py-2 text-sm font-medium text-white hover:bg-blue-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-blue-600 dark:hover:bg-blue-700"
        >
          {loading ? <LoadingSpinner size="small" /> : 'Submit Review'}
        </button>
        
        <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
          All reviews are moderated before being published.
          {toolId && typeof toolId === 'string' && toolId.includes('sponsor') && 
            ' Reviews for sponsored tools undergo additional verification.'}
        </p>
      </div>
    </form>
  );
};

export default ReviewForm; 