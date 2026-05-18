import { useState } from 'react';
import { useAuth } from '@clerk/clerk-react';
import { ImageIcon, UploadCloud, Moon, Sun, Image, RefreshCw } from 'lucide-react';
import ImageComponent from 'next/image';
import { Button } from '@/components/ui/button';
import { Loader2, CheckCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import axios from 'axios';
import { useSiteConfig } from '@/contexts/SiteConfigContext';

interface LogoManagementProps {
  currentLogo: string;
  currentLogoDark?: string;
  currentLogoLight?: string;
  onLogoUpdate: (logoUrl: string, type?: 'default' | 'dark' | 'light') => void;
  className?: string;
}

export default function LogoManagement({ 
  currentLogo, 
  currentLogoDark = '', 
  currentLogoLight = '', 
  onLogoUpdate, 
  className = '' 
}: LogoManagementProps) {
  const [uploading, setUploading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'default' | 'light' | 'dark'>('default');
  const { getToken } = useAuth();
  const { refreshConfig } = useSiteConfig();
  
  // Function to refresh the site config
  const handleRefresh = async () => {
    setRefreshing(true);
    setError(null);
    
    try {
      await refreshConfig();
      setSuccess("Configuration refreshed successfully. Your changes should now be visible.");
      
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
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>, type: 'default' | 'light' | 'dark' = 'default') => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    // Check file type - restrict to only PNG and JPG/JPEG
    const validTypes = ['image/jpeg', 'image/png'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload only JPEG or PNG files.');
      return;
    }
    
    // Check file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      setError('File is too large. Maximum size is 2MB.');
      return;
    }
    
    try {
      setUploading(true);
      setError(null);
      setSuccess(null);
      
      const formData = new FormData();
      formData.append('logo', file);
      
      // Different endpoints based on logo type
      let endpoint = 'config/upload-logo';
      let testEndpoint = 'config/test-upload-logo';
      
      if (type === 'light') {
        endpoint = 'config/upload-logo-light';
        testEndpoint = 'config/test-upload-logo-light';
      } else if (type === 'dark') {
        endpoint = 'config/upload-logo-dark';
        testEndpoint = 'config/test-upload-logo-dark';
      }
      
      // Use direct axios call for file upload since we need special headers
      const apiBaseUrl = '';
      
      console.log(`Uploading to: ${apiBaseUrl}/api/${endpoint}`);
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
          
          console.log('Upload response:', response.data);
          
          if (response.data.logoUrl) {
            onLogoUpdate(response.data.logoUrl, type);
            storageType = response.data.storage || 'cloudinary';
            uploadSuccess = true;
          }
        }
      } catch (cloudinaryError) {
        console.error('Primary upload failed:', cloudinaryError);
        
        // Try authenticated local storage upload as fallback
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
            
            if (localResponse.data.logoUrl) {
              onLogoUpdate(localResponse.data.logoUrl, type);
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
            
            if (testResponse.data.logoUrl) {
              onLogoUpdate(testResponse.data.logoUrl, type);
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
      let successMessage = `${type.charAt(0).toUpperCase() + type.slice(1)} mode logo uploaded successfully`;
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
      } catch (refreshError) {
        console.error('Error refreshing config after upload:', refreshError);
      }
      
      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess(null);
      }, 3000);
    } catch (err) {
      console.error('Error uploading logo:', err);
      
      const apiError = err as { 
        response?: { data?: { error?: string, name?: string }, status?: number }; 
        message?: string;
        code?: string;
      };
      
      let errorMessage = 'Failed to upload logo. Please try again.';
      
      if (apiError.response?.data?.error === 'An unknown file format not allowed' || 
          apiError.response?.data?.error?.includes('SVG')) {
        errorMessage = 'Invalid SVG format. Please ensure your SVG has proper dimensions, viewBox, and XML namespace.';
      } else if (apiError.response?.status === 401 || apiError.response?.status === 403) {
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
      console.error('Logo upload error details:', {
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
  const isValidLogoUrl = (url: string) => {
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
      
      <div className="flex justify-between items-center">
        <h3 className="text-sm font-medium">Logo Management</h3>
        <Button 
          variant="outline" 
          size="sm" 
          className="flex items-center gap-1"
          onClick={handleRefresh}
          disabled={refreshing}
        >
          {refreshing ? (
            <>
              <Loader2 className="h-3 w-3 animate-spin" />
              <span>Refreshing...</span>
            </>
          ) : (
            <>
              <RefreshCw className="h-3 w-3" />
              <span>Refresh</span>
            </>
          )}
        </Button>
      </div>
      
      <Tabs defaultValue="default" onValueChange={(value) => setActiveTab(value as 'default' | 'light' | 'dark')}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="default">
            <Image className="h-4 w-4 mr-2" />
            Default
          </TabsTrigger>
          <TabsTrigger value="light">
            <Sun className="h-4 w-4 mr-2" />
            Light Mode
          </TabsTrigger>
          <TabsTrigger value="dark">
            <Moon className="h-4 w-4 mr-2" />
            Dark Mode
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="default" className="pt-4">
          <LogoDisplay 
            logo={currentLogo} 
            type="default"
            uploading={uploading && activeTab === 'default'} 
            onUpload={(e) => handleFileUpload(e, 'default')} 
          />
          <p className="text-xs text-muted-foreground mt-2">
            This logo will be used when no theme-specific logo is available.
          </p>
        </TabsContent>
        
        <TabsContent value="light" className="pt-4">
          <LogoDisplay 
            logo={currentLogoLight || currentLogo} 
            type="light"
            uploading={uploading && activeTab === 'light'} 
            onUpload={(e) => handleFileUpload(e, 'light')} 
          />
          <p className="text-xs text-muted-foreground mt-2">
            This logo will be shown when the site is in light mode.
          </p>
        </TabsContent>
        
        <TabsContent value="dark" className="pt-4">
          <LogoDisplay 
            logo={currentLogoDark || currentLogo} 
            type="dark"
            uploading={uploading && activeTab === 'dark'} 
            onUpload={(e) => handleFileUpload(e, 'dark')} 
          />
          <p className="text-xs text-muted-foreground mt-2">
            This logo will be shown when the site is in dark mode.
          </p>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface LogoDisplayProps {
  logo: string;
  type: 'default' | 'light' | 'dark';
  uploading: boolean;
  onUpload: (event: React.ChangeEvent<HTMLInputElement>) => void;
}

function LogoDisplay({ logo, type, uploading, onUpload }: LogoDisplayProps) {
  // Helper function to check if a URL is valid
  const isValidLogoUrl = (url: string) => {
    return url && url.trim() !== '' && !url.includes('undefined') && !url.includes('null');
  };

  return (
    <div className="flex flex-col items-center space-y-4">
      <div className="flex h-40 w-40 items-center justify-center rounded-md border bg-muted relative">
        {isValidLogoUrl(logo) ? (
          <ImageComponent
            src={logo}
            alt={`${type} Logo`}
            fill
            className="object-contain p-2"
            unoptimized
          />
        ) : (
          <div className="flex flex-col items-center text-muted-foreground">
            <ImageIcon className="h-10 w-10" />
            <span className="mt-2 text-sm">No logo uploaded</span>
          </div>
        )}
      </div>
      
      <div className="flex flex-col items-center space-y-3">
        <Button 
          asChild
          variant="outline"
          className="cursor-pointer"
          disabled={uploading}
        >
          <label>
            {uploading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Uploading...
              </>
            ) : (
              <>
                <UploadCloud className="mr-2 h-4 w-4" />
                Upload {type !== 'default' ? `${type} mode ` : ''}Logo
              </>
            )}
            <input
              type="file"
              accept=".jpg,.jpeg,.png"
              className="sr-only"
              onChange={onUpload}
              disabled={uploading}
            />
          </label>
        </Button>
        
        <div className="text-xs text-muted-foreground text-center max-w-[250px]">
          Recommended file formats:
          <ul className="list-disc pl-4 mt-1">
            <li>PNG for logos with transparency</li>
            <li>JPG for photos and complex images</li>
            <li>Max file size: 2MB</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 