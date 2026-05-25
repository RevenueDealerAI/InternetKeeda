import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, AlertTriangle, RefreshCw, ImageIcon, UploadCloud } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import type { SiteConfig } from '@/types/siteConfig';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';

interface GeneralSettingsProps {
  config: SiteConfig;
  onSave: (updates: Partial<SiteConfig>) => Promise<void>;
}

// OG Image preview component
const OGImagePreview = ({ 
  ogImage, 
  title, 
  description,
  siteName 
}: { 
  ogImage: string, 
  title: string, 
  description: string,
  siteName: string
}) => {
  return (
    <div className="mt-3 border rounded-md overflow-hidden bg-white shadow-sm">
      <div className="p-3 text-sm text-gray-500 border-b bg-gray-50">
        Preview: How your site will appear when shared on social media
      </div>
      <div className="p-4">
        <div className="flex flex-col space-y-2 max-w-md">
          {/* Facebook-style card */}
          <div className="border rounded-md overflow-hidden shadow-sm">
            {ogImage ? (
              <div className="aspect-[1.91/1] bg-gray-100 relative overflow-hidden">
                <Image 
                  src={ogImage} 
                  alt="Social media preview" 
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            ) : (
              <div className="aspect-[1.91/1] bg-gray-100 flex items-center justify-center text-gray-400">
                <span className="text-sm">No OG Image URL provided</span>
              </div>
            )}
            <div className="p-3 space-y-1">
              <div className="text-xs text-gray-500 uppercase">{siteName || 'Your Website'}</div>
              <div className="font-medium text-sm line-clamp-1">{title || 'Your page title will appear here'}</div>
              <div className="text-xs text-gray-500 line-clamp-2">{description || 'Your page description will appear here. This text is truncated if it gets too long.'}</div>
            </div>
          </div>
          
          {/* Twitter-style card */}
          <div className="border rounded-md overflow-hidden shadow-sm mt-4">
            <div className="flex">
              {ogImage ? (
                <div className="w-24 h-24 bg-gray-100 shrink-0 relative">
                  <Image 
                    src={ogImage} 
                    alt="Twitter preview" 
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="w-24 h-24 bg-gray-100 flex items-center justify-center text-gray-400 shrink-0">
                  <span className="text-xs">No Image</span>
                </div>
              )}
              <div className="p-2 flex-1">
                <div className="font-medium text-sm line-clamp-1">{title || 'Your page title'}</div>
                <div className="text-xs text-gray-500 line-clamp-2">{description || 'Your description'}</div>
                <div className="text-xs text-gray-400 mt-1">{siteName || 'yourdomain.com'}</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Add this new component for OG image upload
const OGImageUploader = ({ 
  ogImageUrl, 
  onUpload 
}: { 
  ogImageUrl: string, 
  onUpload: (url: string) => void 
}) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    
    if (!file) return;
    
    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif'];
    if (!validTypes.includes(file.type)) {
      setError('Invalid file type. Please upload a JPEG, PNG, SVG, or GIF file.');
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
      
      const token = await getToken();
      if (!token) {
        setError('Authentication failed. You must be logged in to upload an image.');
        return;
      }
      
      const formData = new FormData();
      formData.append('ogImage', file);
      
      // Log file details
      console.log('Uploading file:', {
        name: file.name,
        type: file.type,
        size: `${(file.size / 1024).toFixed(2)} KB`
      });
      
      // Use direct axios call for file upload
      const apiBaseUrl = '';
      const endpoint = `${apiBaseUrl}/api/config/upload-og-image`;
      const localEndpoint = `${apiBaseUrl}/api/config/upload-og-image-local`;
      
      console.log(`Attempting to upload OG image to Cloudinary: ${endpoint}`);
      
      try {
        // First try Cloudinary
        const response = await axios.post(endpoint, formData, {
          headers: {
            'Content-Type': 'multipart/form-data',
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Upload response from Cloudinary:', response.data);
        
        // Update the parent component with the new image URL
        if (response.data.ogImageUrl) {
          onUpload(response.data.ogImageUrl);
          console.log('New OG image URL from Cloudinary:', response.data.ogImageUrl);
          return; // Success, no need to try local
        }
      } catch (cloudinaryError) {
        // Log Cloudinary error
        console.error('Cloudinary upload failed:', cloudinaryError);
        console.log('Falling back to local storage upload...');
        
        try {
          // Try local fallback
          console.log(`Attempting local fallback upload: ${localEndpoint}`);
          const localResponse = await axios.post(localEndpoint, formData, {
            headers: {
              'Content-Type': 'multipart/form-data',
              'Authorization': `Bearer ${token}`
            }
          });
          
          console.log('Upload response from local storage:', localResponse.data);
          
          // Update with local URL
          if (localResponse.data.ogImageUrl) {
            onUpload(localResponse.data.ogImageUrl);
            console.log('New OG image URL from local storage:', localResponse.data.ogImageUrl);
            return; // Success with local fallback
          }
        } catch (localError) {
          console.error('Local fallback upload also failed:', localError);
          
          // If both regular endpoints failed, try the test endpoint as a last resort
          try {
            console.log('Both cloud and local uploads failed, trying test endpoint as last resort...');
            const testEndpoint = `${apiBaseUrl}/api/config/test-upload-og-image`;
            
            console.log(`Attempting test endpoint upload: ${testEndpoint}`);
            const testResponse = await axios.post(testEndpoint, formData, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            });
            
            console.log('Upload response from test endpoint:', testResponse.data);
            
            // Update with test URL
            if (testResponse.data.ogImageUrl) {
              onUpload(testResponse.data.ogImageUrl);
              console.log('New OG image URL from test endpoint:', testResponse.data.ogImageUrl);
              return; // Success with test endpoint
            }
          } catch (testError) {
            console.error('Test endpoint upload also failed:', testError);
            // This is our last resort, so continue to the error handler
          }
          
          // If we get here, all three attempts failed
          throw new Error('All upload attempts failed (cloud, local, and test)');
        }
      }
    } catch (err) {
      console.error('Error in OG image upload process:', err);
      
      // Get a user-friendly error message
      let errorMessage = 'An unexpected error occurred during upload.';
      
      if (axios.isAxiosError(err)) {
        if (err.response?.status === 413) {
          errorMessage = 'File is too large for the server to process.';
        } else if (err.response?.status === 401 || err.response?.status === 403) {
          errorMessage = 'Authentication error. Please ensure you have admin privileges.';
        } else if (err.response?.data?.error) {
          errorMessage = `Server error: ${err.response.data.error}`;
        } else if (err.message) {
          errorMessage = `Upload failed: ${err.message}`;
        }
      } else if (err instanceof Error) {
        errorMessage = err.message;
      }
      
      setError(errorMessage);
    } finally {
      setUploading(false);
      
      // Clear the file input
      event.target.value = '';
    }
  };

  return (
    <div className="mt-4 flex flex-col gap-4">
      {error && (
        <div className="text-sm text-red-500 bg-red-50 p-2 rounded-md border border-red-200">
          {error}
        </div>
      )}
      
      <div className="flex gap-4 items-start">
        <div className="flex-shrink-0 w-32 h-32 border rounded-md flex items-center justify-center bg-gray-50 overflow-hidden relative">
          {ogImageUrl ? (
            <Image 
              src={ogImageUrl} 
              alt="OG Image Preview" 
              fill
              className="object-cover"
              unoptimized
            />
          ) : (
            <div className="flex flex-col items-center text-gray-400">
              <ImageIcon className="h-8 w-8" />
              <span className="mt-2 text-xs">No image</span>
            </div>
          )}
        </div>
        
        <div className="flex flex-col gap-2">
          <Button 
            asChild
            variant="outline"
            className="cursor-pointer rounded-full"
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
                  Upload OG Image
                </>
              )}
              <input
                type="file"
                accept=".jpg,.jpeg,.png,.svg,.gif"
                className="sr-only"
                onChange={handleFileUpload}
                disabled={uploading}
              />
            </label>
          </Button>
          <p className="text-xs text-gray-500">Or paste a URL in the field above</p>
        </div>
      </div>
    </div>
  );
};

export default function GeneralSettings({ config, onSave }: GeneralSettingsProps) {
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const { toast } = useToast();
  const { getToken } = useAuth();
  
  const [formData, setFormData] = useState({
    siteName: config?.siteName || '',
    siteDescription: config?.siteDescription || '',
    footerText: config?.footerText || '',
    contactEmail: config?.contactEmail || '',
    metaTags: {
      title: config?.metaTags?.title || '',
      description: config?.metaTags?.description || '',
      keywords: config?.metaTags?.keywords || '',
      ogImage: config?.metaTags?.ogImage || '',
    },
  });

  // Sync component state when parent config prop changes
  useEffect(() => {
    if (config) {
      setFormData({
        siteName: config.siteName || '',
        siteDescription: config.siteDescription || '',
        contactEmail: config.contactEmail || '',
        footerText: config.footerText || '',
        metaTags: {
          title: config.metaTags?.title || '',
          description: config.metaTags?.description || '',
          keywords: config.metaTags?.keywords || '',
          ogImage: config.metaTags?.ogImage || '',
        },
      });
    }
  }, [config]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    
    // Handle nested properties (for metaTags)
    if (name.startsWith('metaTags.')) {
      const metaTagKey = name.split('.')[1];
      setFormData(prev => ({
        ...prev,
        metaTags: {
          ...prev.metaTags,
          [metaTagKey]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  const handleMetaTagsChange = (field: string, value: string) => {
    const updatedMetaTags = {
      ...formData.metaTags,
      [field]: value
    };
    
    setFormData({
      ...formData,
      metaTags: updatedMetaTags
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    
    try {
      console.log('Submitting general settings:', formData);
      
      // First try the normal flow through the parent component
      try {
        await onSave(formData);
        toast({
          title: "Settings saved",
          description: "General settings have been updated successfully.",
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800"
        });
        return;
      } catch (parentError) {
        console.error('Error using parent onSave method:', parentError);
        // Continue to fallback methods
      }
      
      // Second attempt: Use the API directly
      try {
        const token = await getToken();
        
        if (!token) {
          throw new Error('Authentication token not available');
        }
        
        const apiBaseUrl = '';
        console.log(`Sending direct PUT request to ${apiBaseUrl}/api/config`);
        
        const response = await axios.put(`${apiBaseUrl}/api/config`, formData, {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`
          }
        });
        
        console.log('Direct API save response:', response.data);
        
        toast({
          title: "Settings saved",
          description: "General settings have been updated via direct API call.",
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800"
        });
        return;
      } catch (apiError) {
        console.error('Error using direct API call:', apiError);
        // Continue to test endpoint
      }
      
      // Third attempt: Try the test endpoint
      try {
        const apiBaseUrl = '';
        console.log(`Sending test PUT request to ${apiBaseUrl}/api/config/test-save`);
        
        const response = await axios.put(`${apiBaseUrl}/api/config/test-save`, formData);
        
        console.log('Test endpoint response:', response.data);
        
        if (response.data.success) {
          toast({
            title: "Settings saved",
            description: "General settings have been updated via test endpoint.",
            variant: "default",
            className: "bg-green-50 border-green-200 text-green-800"
          });
          return;
        }
      } catch (testError) {
        console.error('Error using test endpoint:', testError);
        // Fall through to the error handler
      }
      
      throw new Error('All save methods failed');
    } catch (err) {
      console.error('Error saving settings:', err);
      
      const apiError = err as { 
        response?: { data?: { error?: string }, status?: number }; 
        message?: string;
      };
      
      let errorMessage = "An unexpected error occurred";
      
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        errorMessage = "Authentication error. Please ensure you have admin privileges.";
      } else if (apiError.response?.data?.error) {
        errorMessage = apiError.response.data.error;
      } else if (apiError.message?.includes('Network Error')) {
        errorMessage = "Network error. Please check your internet connection and server status.";
      } else if (apiError.message) {
        errorMessage = apiError.message;
      }
      
      setError(errorMessage);
      
      toast({
        title: "Error saving settings",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };

  const addSampleImage = () => {
    // Use a placeholder image service for the sample
    const sampleImageUrl = "https://place-hold.it/1200x630/18B292/FFFFFF/JPEG?text=AI+Tool+Finder";
    handleMetaTagsChange('ogImage', sampleImageUrl);
  };

  // Add this function to the GeneralSettings component
  const handleOGImageUpdate = (imageUrl: string) => {
    handleMetaTagsChange('ogImage', imageUrl);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="siteName">Site Name</Label>
          <Input
            id="siteName"
            name="siteName"
            value={formData.siteName}
            onChange={handleChange}
            placeholder="Internet Keeda"
            required
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="siteDescription">Site Description</Label>
          <Textarea
            id="siteDescription"
            name="siteDescription"
            value={formData.siteDescription}
            onChange={handleChange}
            placeholder="Discover the best AI tools for your needs"
            rows={3}
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="footerText">Footer Text</Label>
          <Input
            id="footerText"
            name="footerText"
            value={formData.footerText}
            onChange={handleChange}
            placeholder="© 2024 Internet Keeda. All rights reserved."
          />
        </div>
        
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Contact Email</Label>
          <Input
            id="contactEmail"
            name="contactEmail"
            type="email"
            value={formData.contactEmail}
            onChange={handleChange}
            placeholder="contact@example.com"
          />
        </div>
        
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label htmlFor="meta-title" className="text-base font-medium">Meta Tags</Label>
            <Button 
              onClick={() => window.location.reload()}
              variant="outline" 
              size="sm"
              className="text-xs flex items-center gap-1"
            >
              <RefreshCw className="h-3 w-3" />
              Refresh Page
            </Button>
          </div>
          
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200 mb-4">
            <p>Meta tag changes require a page refresh to update in the browser tab. After saving, click the "Refresh Page" button to see changes.</p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="meta-title">Title</Label>
            <Input 
              id="meta-title" 
              placeholder="Meta title for SEO" 
              value={formData.metaTags?.title || ''} 
              onChange={(e) => handleMetaTagsChange('title', e.target.value)}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="meta-description">Description</Label>
            <Textarea 
              id="meta-description" 
              placeholder="Meta description for SEO" 
              value={formData.metaTags?.description || ''} 
              onChange={(e) => handleMetaTagsChange('description', e.target.value)}
              rows={3}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="meta-keywords">Keywords</Label>
            <Input 
              id="meta-keywords" 
              placeholder="Comma-separated keywords" 
              value={formData.metaTags?.keywords || ''} 
              onChange={(e) => handleMetaTagsChange('keywords', e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <Label htmlFor="ogImage" className="text-base font-medium">Social Media Sharing Image (OG Image)</Label>
            </div>
            
            <div className="text-sm text-blue-700 bg-blue-50 p-3 rounded-md border border-blue-200 mb-4">
              <p className="font-medium mb-1">What is an OG Image?</p>
              <p className="mb-2">The Open Graph (OG) image is the preview image that appears when your site is shared on:</p>
              <ul className="list-disc pl-5 mb-2 space-y-1">
                <li>Social media platforms (Facebook, Twitter, LinkedIn)</li>
                <li>Messaging apps (WhatsApp, Slack, Discord)</li>
                <li>Search engine results</li>
              </ul>
              <p>A high-quality, relevant OG image can significantly increase click-through rates when your content is shared.</p>
            </div>
            
            <Label htmlFor="ogImage">OG Image URL</Label>
            <div className="flex gap-2">
              <div className="flex-1">
                <Input 
                  id="ogImage" 
                  placeholder="URL for social media sharing image" 
                  value={formData.metaTags?.ogImage || ''} 
                  onChange={(e) => handleMetaTagsChange('ogImage', e.target.value)}
                />
              </div>
              <Button 
                type="button"
                variant="outline"
                size="sm"
                onClick={addSampleImage}
                className="whitespace-nowrap"
              >
                Try Sample
              </Button>
            </div>
            <p className="text-xs text-gray-500">Recommended size: 1200×630 pixels</p>
            
            {/* Add this notice above the OGImageUploader component */}
            <div className="mt-3 mb-2 text-sm text-green-700 bg-green-50 p-3 rounded-md border border-green-200">
              <p className="font-medium mb-1">Robust Upload System</p>
              <p className="mb-1">Your images are securely processed through our multi-tier storage system:</p>
              <ul className="list-disc pl-5 mb-0 space-y-1">
                <li>Primary cloud storage for global CDN delivery</li>
                <li>Automatic local server fallback if cloud upload fails</li>
                <li>Manual URL option for externally hosted images</li>
              </ul>
            </div>
            
            {/* Add the OG Image uploader */}
            <OGImageUploader 
              ogImageUrl={formData.metaTags?.ogImage || ''} 
              onUpload={handleOGImageUpdate}
            />

            {/* Add the OG Image preview */}
            <OGImagePreview 
              ogImage={formData.metaTags?.ogImage || ''} 
              title={formData.metaTags?.title || formData.siteName}
              description={formData.metaTags?.description || formData.siteDescription}
              siteName={formData.siteName}
            />
          </div>
        </div>
      </div>
      
      {error && (
        <div className="flex items-center text-red-500 text-sm mb-2">
          <AlertTriangle className="h-4 w-4 mr-1" />
          <span>{error}</span>
        </div>
      )}
      
      <Button type="submit" disabled={saving} className={success ? "bg-green-500 hover:bg-green-600" : ""}>
        {saving ? (
          <>
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Saving...
          </>
        ) : success ? (
          <>
            <CheckCircle className="mr-2 h-4 w-4" />
            Saved!
          </>
        ) : (
          "Save General Settings"
        )}
      </Button>
    </form>
  );
} 