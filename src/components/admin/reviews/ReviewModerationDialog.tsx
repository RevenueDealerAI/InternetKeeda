import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '@clerk/clerk-react';
import { XMarkIcon, CheckIcon, XCircleIcon, ChatBubbleLeftRightIcon } from '@heroicons/react/24/outline';
import { Review } from '../../../types/Review';
import LoadingSpinner from '../../ui/LoadingSpinner';

interface ReviewModerationDialogProps {
  review: Review;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

const ReviewModerationDialog: React.FC<ReviewModerationDialogProps> = ({
  review,
  isOpen,
  onClose,
  onSuccess
}) => {
  const [adminResponse, setAdminResponse] = useState<string>(review.adminResponse || '');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  if (!isOpen) return null;

  const moderateReview = async (status: 'approved' | 'rejected') => {
    try {
      setLoading(true);
      setError(null);

      const token = await getToken();

      await axios.put(
        `/api/reviews/${review._id}/moderate`,
        {
          status,
          adminResponse: adminResponse.trim() || undefined
        },
        {
          headers: {
            Authorization: `Bearer ${token}`
          }
        }
      );

      onSuccess();
    } catch (err: unknown) {
      console.error('Error moderating review:', err);

      if (err && typeof err === 'object' && 'response' in err && err.response && typeof err.response === 'object' && 'data' in err.response && err.response.data && typeof err.response.data === 'object' && 'error' in err.response.data) {
        setError(String(err.response.data.error));
      } else {
        setError('Failed to moderate review. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="w-full max-w-lg rounded-lg bg-white p-6 shadow-xl dark:bg-gray-800">
        <div className="flex items-center justify-between border-b border-gray-200 pb-3 dark:border-gray-700">
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">
            Review Moderation
          </h3>
          <button
            onClick={onClose}
            className="rounded-md p-1 text-gray-400 hover:bg-gray-100 hover:text-gray-500 dark:hover:bg-gray-700"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="my-4">
          <div className="mb-4 rounded-md bg-gray-50 p-4 dark:bg-gray-700">
            <div className="mb-2 flex items-center justify-between">
              <span className="font-medium text-gray-900 dark:text-white">
                {review.userName}
              </span>
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {new Date(review.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div className="mb-2 flex items-center">
              <div className="flex">
                {Array.from({ length: 5 }).map((_, i) => (
                  <svg
                    key={i}
                    className={`h-4 w-4 ${i < review.rating ? 'text-yellow-400' : 'text-gray-300 dark:text-gray-600'
                      }`}
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118l-2.8-2.034c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                  </svg>
                ))}
              </div>
              <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
                {review.rating}/5
              </span>
            </div>

            <p className="text-gray-700 dark:text-gray-300">{review.comment}</p>

            <div className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Status:
              <span className={`ml-1 font-medium ${review.status === 'pending' ? 'text-yellow-600 dark:text-yellow-400' :
                  review.status === 'approved' ? 'text-green-600 dark:text-green-400' :
                    'text-red-600 dark:text-red-400'
                }`}>
                {review.status.charAt(0).toUpperCase() + review.status.slice(1)}
              </span>
            </div>
          </div>

          <div className="mb-4">
            <label
              htmlFor="adminResponse"
              className="mb-2 block text-sm font-medium text-gray-700 dark:text-gray-300"
            >
              <div className="flex items-center">
                <ChatBubbleLeftRightIcon className="mr-1 h-5 w-5" />
                Admin Response (Optional)
              </div>
            </label>
            <textarea
              id="adminResponse"
              rows={3}
              placeholder="Add an optional public response to this review..."
              value={adminResponse}
              onChange={(e) => setAdminResponse(e.target.value)}
              className="w-full rounded-md border border-gray-300 p-2 text-sm shadow-sm focus:border-blue-500 focus:ring-blue-500 dark:border-gray-700 dark:bg-gray-800 dark:text-white"
            />
          </div>

          {error && (
            <div className="mb-4 rounded-md bg-red-50 p-3 dark:bg-red-900">
              <p className="text-sm text-red-700 dark:text-red-200">{error}</p>
            </div>
          )}

          <div className="mt-5 flex justify-end space-x-3">
            <button
              type="button"
              onClick={() => moderateReview('rejected')}
              disabled={loading}
              className="flex items-center rounded-md border border-red-300 bg-white px-4 py-2 text-sm font-medium text-red-700 shadow-sm hover:bg-red-50 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:border-red-700 dark:bg-gray-800 dark:text-red-400 dark:hover:bg-red-900"
            >
              <XCircleIcon className="mr-1.5 h-5 w-5" />
              Reject
            </button>
            <button
              type="button"
              onClick={() => moderateReview('approved')}
              disabled={loading}
              className="flex items-center rounded-md border border-transparent bg-purple-600 px-4 py-2 text-sm font-medium text-white shadow-sm hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70 dark:bg-purple-700 dark:hover:bg-purple-800"
            >
              {loading ? (
                <LoadingSpinner size="small" className="mr-1" />
              ) : (
                <CheckIcon className="mr-1.5 h-5 w-5" />
              )}
              Approve
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReviewModerationDialog;