import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { ImageIcon, UploadCloud, RefreshCw } from 'lucide-react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import axios from 'axios';
import { useSiteConfig } from '@/contexts/SiteConfigContext';

interface FaviconManagementProps {
  currentFavicon: string;
  onFaviconUpdate: (faviconUrl: string) => void;
  className?: string;
}

export default function FaviconManagement({ 
  currentFavicon, 
  onFaviconUpdate, 
  className = '' 
}: FaviconManagementProps) {
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { getToken } = useAuth();
  const { refreshConfig } = useSiteConfig();
  
  // Function to refresh the site config
  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      await refreshConfig();
      setSuccess("Configuration refreshed successfully. Your favicon should now be visible.");
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (error) {
      console.error('Error refreshing configuration:', error);
      setError('Failed to refresh configuration. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  // Handle file upload
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    // Check file type - restrict to only PNG and JPG/JPEG for better compatibility
    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload only JPEG or PNG files.');
      return;
    }
    
    // Check file size (max 1MB)
    if (file.size > 1 * 1024 * 1024) {
      setError('File is too large. Maximum size is 1MB.');
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      setSuccess(null);
      
      const formData = new FormData();
      formData.append('favicon', file);
      
      // Endpoint for favicon upload
      const endpoint = 'config/upload-favicon';
      const testEndpoint = 'config/test-upload-favicon';
      
      // Use direct axios call for file upload since we need special headers
      const apiBaseUrl = '';
      
      console.log(`Uploading favicon to: ${apiBaseUrl}/api/${endpoint}`);
      console.log('File being uploaded:', {
        name: file.name,
        type: file.type,
        size: file.size
      });
      
      let uploadSuccess = false;
      let storageType = 'unknown';
      
      // Try authenticated Cloudinary upload
      try {
        const token = await getToken();
        if (!token) {
          console.warn('No authentication token available');
        } else {
          console.log('Attempting Cloudinary upload with authentication');
          const response = await axios.post(`${apiBaseUrl}/api/${endpoint}`, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('Cloudinary upload response:', response.data);
          
          if (response.data.faviconUrl) {
            onFaviconUpdate(response.data.faviconUrl);
            storageType = response.data.storage || 'cloudinary';
            uploadSuccess = true;
          }
        }
      } catch (cloudinaryError) {
        console.error('Cloudinary upload failed:', cloudinaryError);
        
        // Try authenticated local storage upload
        try {
          const token = await getToken();
          if (!token) {
            console.warn('No authentication token available for local upload');
          } else {
            console.log('Attempting local storage upload with authentication');
            const localEndpoint = `${endpoint}-local`;
            
            const localResponse = await axios.post(`${apiBaseUrl}/api/${localEndpoint}`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data',
                'Authorization': `Bearer ${token}`
              }
            });
            
            console.log('Local upload response:', localResponse.data);
            
            if (localResponse.data.faviconUrl) {
              onFaviconUpdate(localResponse.data.faviconUrl);
              storageType = 'local';
              uploadSuccess = true;
            }
          }
        } catch (localError) {
          console.error('Local authenticated upload failed:', localError);
          
          // Final fallback - try the test endpoint with no auth
          try {
            console.log('Attempting test endpoint with no authentication');
            const testResponse = await axios.post(`${apiBaseUrl}/api/${testEndpoint}`, formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });
            
            console.log('Test endpoint response:', testResponse.data);
            
            if (testResponse.data.faviconUrl) {
              onFaviconUpdate(testResponse.data.faviconUrl);
              storageType = testResponse.data.storage || 'test';
              uploadSuccess = true;
            }
          } catch (testError) {
            console.error('All upload methods failed:', testError);
            throw testError;
          }
        }
      }
      
      if (!uploadSuccess) {
        throw new Error('All upload methods failed');
      }
      
      // Success message based on storage type
      let successMessage = 'Favicon uploaded successfully';
      if (storageType === 'local') {
        successMessage += ' to local storage';
      } else if (storageType === 'cloudinary') {
        successMessage += ' to Cloudinary';
      } else if (storageType === 'test') {
        successMessage += ' via development endpoint';
      }
      successMessage += '!';
      
      setSuccess(successMessage);
      
      // Refresh the site config after successful upload
      try {
        await refreshConfig();
        
        // Force browser to update favicon immediately with the uploaded URL
        if (uploadSuccess) {
          setTimeout(() => {
            const existingFavicons = document.querySelectorAll('link[rel*="icon"]');
            existingFavicons.forEach(link => link.remove());
            
            const newFavicon = document.createElement('link');
            newFavicon.rel = 'icon';
            newFavicon.type = 'image/png';
            newFavicon.href = `${currentFavicon}?v=${Date.now()}`;
            document.head.appendChild(newFavicon);
          }, 100);
        }
      } catch (refreshError) {
        console.error('Error refreshing config after upload:', refreshError);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error uploading favicon:', err);
      
      const apiError = err as { 
        response?: { data?: { error?: string }, status?: number }; 
        message?: string;
        code?: string;
      };
      
      let errorMessage = 'Failed to upload favicon. Please try again.';
      
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        errorMessage = 'Authentication error. Try using the development version for testing.';
      } else if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      } else if (apiError.message?.includes('Network Error')) {
        errorMessage = 'Network error. Please check your internet connection and server status.';
      } else if (apiError.message?.includes('api_key')) {
        errorMessage = 'Cloudinary API key error. The server might be missing required configuration.';
      } else if (apiError.message) {
        errorMessage = apiError.message;
      }
      
      setError(errorMessage);
      
      // Log detailed error for debugging
      console.error('Favicon upload error details:', {
        status: apiError.response?.status,
        data: apiError.response?.data,
        message: apiError.message
      });
    } finally {
      setUploading(false);
      
      // Clear the file input
      event.target.value = '';
    }
  };
  
  // Helper function to check if a URL is valid
  const isValidFaviconUrl = (url: string) => {
    return url && url.trim() !== '' && !url.includes('undefined') && !url.includes('null');
  };
  
  return (
    <div className={`space-y-4 ${className}`}>
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      )}
      
      {success && (
        <Alert className="border-green-200 bg-green-50 text-green-800">
          <CheckCircle className="h-4 w-4 mr-2" />
          <AlertDescription>{success}</AlertDescription>
        </Alert>
      )}
      
      <div className="flex flex-col items-center justify-center border-2 border-dashed border-gray-200 rounded-lg p-4 h-40 relative">
        {isValidFaviconUrl(currentFavicon) ? (
          <div className="relative h-16 w-16">
            <Image 
              src={currentFavicon} 
              alt="Current Favicon" 
              fill
              className="object-contain" 
              unoptimized
            />
          </div>
        ) : (
          <div className="flex items-center justify-center h-16 w-16 bg-gray-100 rounded-md">
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}
        
        <div className="mt-4 text-center">
          <p className="text-sm text-gray-700">Current Favicon</p>
          <p className="text-xs text-gray-500 truncate max-w-xs">
            {isValidFaviconUrl(currentFavicon) ? currentFavicon : 'No favicon set'}
          </p>
        </div>
        
        {uploading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white bg-opacity-80 rounded-lg">
            <Loader2 className="h-8 w-8 animate-spin text-green-500" />
          </div>
        )}
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 sm:col-span-1">
          <Button asChild variant="outline" className="w-full">
            <label className="cursor-pointer">
              <UploadCloud className="h-4 w-4 mr-2" />
              <span>Upload New Favicon</span>
              <input 
                type="file" 
                accept=".png,.jpeg,.jpg" 
                className="hidden" 
                onChange={handleFileUpload}
                disabled={uploading} 
              />
            </label>
          </Button>
        </div>
        
        <div className="col-span-2 sm:col-span-1">
          <Button 
            variant="outline" 
            className="w-full" 
            disabled={refreshing} 
            onClick={handleRefresh}
          >
            {refreshing ? (
              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <RefreshCw className="h-4 w-4 mr-2" />
            )}
            <span>Refresh</span>
          </Button>
        </div>
      </div>
    </div>
  );
} 