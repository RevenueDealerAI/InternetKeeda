import React from 'react';
import Image from 'next/image';
import { StarIcon } from '@heroicons/react/24/solid';
import { StarIcon as StarOutlineIcon } from '@heroicons/react/24/outline';
import { Review } from '@/types/Review';
import { format } from 'date-fns';

interface ReviewItemProps {
  review: Review;
  isAdmin?: boolean;
  onModerate?: (reviewId: string) => void;
}

export const ReviewItem: React.FC<ReviewItemProps> = ({
  review,
  isAdmin = false,
  onModerate
}) => {
  const renderStars = () => {
    const stars = [];
    
    for (let i = 1; i <= 5; i++) {
      if (i <= review.rating) {
        stars.push(
          <StarIcon 
            key={i} 
            className="h-4 w-4 text-yellow-400" 
            aria-hidden="true" 
          />
        );
      } else {
        stars.push(
          <StarOutlineIcon 
            key={i} 
            className="h-4 w-4 text-yellow-400" 
            aria-hidden="true" 
          />
        );
      }
    }
    
    return stars;
  };
  
  const formatDate = (dateString: string) => {
    try {
      const reviewDate = new Date(dateString);
      // Check if the date is valid and not in the future
      const currentDate = new Date();
      if (isNaN(reviewDate.getTime()) || reviewDate > currentDate) {
        return 'Invalid date';
      }
      return format(reviewDate, 'MMM d, yyyy');
    } catch (error) {
      return 'Unknown date';
    }
  };
  
  // Helper to ensure valid username display
  const formatUsername = (username: string) => {
    if (!username || username.includes('null')) {
      return 'Anonymous';
    }
    return username;
  };
  
  return (
    <div className="border-b border-gray-200 py-4 dark:border-gray-700">
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          {review.userAvatar ? (
            <div className="relative h-8 w-8 rounded-full overflow-hidden">
              <Image 
                src={review.userAvatar} 
                alt={review.userName} 
                fill
                className="object-cover"
                unoptimized
              />
            </div>
          ) : (
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 text-sm font-medium text-blue-800 dark:bg-blue-900 dark:text-blue-200">
              {review.userName.charAt(0).toUpperCase()}
            </div>
          )}
          <div>
            <p className="font-medium text-gray-900 dark:text-white">{formatUsername(review.userName)}</p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {formatDate(review.createdAt)}
            </p>
          </div>
        </div>
        
        {isAdmin && review.status === 'pending' && (
          <span className="rounded-full bg-yellow-100 px-2 py-1 text-xs font-medium text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200">
            Pending Review
          </span>
        )}
        
        {isAdmin && review.status === 'rejected' && (
          <span className="rounded-full bg-red-100 px-2 py-1 text-xs font-medium text-red-800 dark:bg-red-900 dark:text-red-200">
            Rejected
          </span>
        )}
      </div>
      
      <div className="mt-2 flex">{renderStars()}</div>
      
      <div className="mt-2 text-sm text-gray-700 dark:text-gray-300">
        {review.comment}
      </div>
      
      {review.adminResponse && (
        <div className="mt-3 rounded-md bg-gray-50 p-3 text-sm dark:bg-gray-800">
          <p className="font-medium text-gray-900 dark:text-white">Response from Admin:</p>
          <p className="mt-1 text-gray-700 dark:text-gray-300">{review.adminResponse}</p>
        </div>
      )}
      
      {isAdmin && (
        <div className="mt-3 flex justify-end">
          <button
            onClick={() => onModerate && onModerate(review._id)}
            className="rounded-md bg-blue-50 px-3 py-1 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900 dark:text-blue-200 dark:hover:bg-blue-800"
          >
            Moderate
          </button>
        </div>
      )}
    </div>
  );
};