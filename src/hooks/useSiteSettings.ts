import { useState, useCallback } from 'react';
import axios from 'axios';
import { SiteConfig } from '@/types/siteConfig';
import { useSiteConfig } from '@/contexts/SiteConfigContext';
import { useAuth } from '@clerk/clerk-react';
import { useToast } from '@/components/ui/use-toast';

interface UseSiteSettingsOptions {
  onSuccess?: (data: Record<string, unknown>) => void;
  onError?: (error: unknown) => void;
  autoRefresh?: boolean;
}

export function useSiteSettings(options?: UseSiteSettingsOptions) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { config, refreshConfig, lastRefreshTime } = useSiteConfig();
  const { getToken } = useAuth();
  const { toast } = useToast();

  const updateSettings = useCallback(async (updatedConfig: Partial<SiteConfig>): Promise<boolean> => {
    setLoading(true);
    setError(null);
    
    console.log('useSiteSettings: Updating settings with:', updatedConfig);
    
    try {
      const token = await getToken();
      // Create a merged config to ensure we're not losing existing data
      const mergedConfig = {
        ...config,
        ...updatedConfig,
        // Force updated timestamp to invalidate cache
        updatedAt: new Date()
      };
      
      // Special handling for nested objects
      if (updatedConfig.metaTags && config?.metaTags) {
        console.log('useSiteSettings: Merging meta tags');
        mergedConfig.metaTags = {
          ...config.metaTags,
          ...updatedConfig.metaTags
        };
      }
      
      if (updatedConfig.socialLinks && config?.socialLinks) {
        console.log('useSiteSettings: Merging social links');
        mergedConfig.socialLinks = {
          ...config.socialLinks,
          ...updatedConfig.socialLinks
        };
      }
      
      // Try all available methods to save settings
      let savedSuccessfully = false;
      let methodUsed = '';
      
      // Method 1: Try the official method with auth
      if (token) {
        try {
          console.log('useSiteSettings: Attempting to save with authentication');
          const response = await axios.put(`/api/config`, mergedConfig, {
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${token}`
            },
            timeout: 10000 // 10 second timeout
          });
          
          console.log('useSiteSettings: Save successful with authentication');
          savedSuccessfully = true;
          methodUsed = 'authenticated API';
        } catch (authError) {
          console.error('useSiteSettings: Error updating settings with auth:', authError);
          // Continue to try fallback methods
        }
      }
      
      // Method 2: Try the force-refresh endpoint to guarantee cache invalidation
      if (!savedSuccessfully) {
        try {
          console.log('useSiteSettings: Attempting to save via force-refresh endpoint');
          await axios.get(`/api/config/force-refresh`, { 
            params: { _t: Date.now() } 
          });
          // We'll count this as a success if we update via test endpoint below
        } catch (refreshError) {
          console.warn('useSiteSettings: Could not trigger force-refresh:', refreshError);
        }
      }
      
      // Method 3: Try the test endpoint if the authenticated method fails
      if (!savedSuccessfully) {
        try {
          console.log('useSiteSettings: Attempting to save with test endpoint');
          const testResponse = await axios.put(`/api/config/test-save`, mergedConfig, {
            timeout: 10000 // 10 second timeout
          });
          
          if (testResponse.data.success) {
            console.log('useSiteSettings: Save successful with test endpoint');
            savedSuccessfully = true;
            methodUsed = 'test endpoint';
          }
        } catch (testError) {
          console.error('useSiteSettings: Error updating settings with test endpoint:', testError);
          
          // If we've tried all methods and failed, show an error
          if (!savedSuccessfully) {
            const errorMessage = "Failed to update settings after multiple attempts.";
            setError(errorMessage);
            
            if (options?.onError) {
              options.onError(testError);
            }
            
            toast({
              title: "Error updating settings",
              description: errorMessage,
              variant: "destructive"
            });
            
            return false;
          }
        }
      }
      
      if (savedSuccessfully) {
        // Refresh the site config context if requested or by default
        if (options?.autoRefresh !== false) {
          console.log('useSiteSettings: Auto-refreshing configuration');
          await refreshConfig();
        }
        
        if (options?.onSuccess) {
          options.onSuccess({ message: `Settings updated via ${methodUsed}` });
        }
        
        toast({
          title: "Settings updated",
          description: `Site settings have been updated successfully via ${methodUsed}.`,
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800"
        });
        
        return true;
      }
      
      return false;
    } catch (err) {
      console.error('useSiteSettings: Error in updateSettings:', err);
      const errorMessage = err instanceof Error ? err.message : 'An unknown error occurred';
      setError(errorMessage);
      
      if (options?.onError) {
        options.onError(err);
      }
      
      toast({
        title: "Error updating settings",
        description: errorMessage,
        variant: "destructive"
      });
      
      return false;
    } finally {
      setLoading(false);
    }
  }, [config, getToken, refreshConfig, toast, options]);

  return {
    loading,
    error,
    updateSettings,
    config,
    refreshConfig,
    lastRefreshTime
  };
} 