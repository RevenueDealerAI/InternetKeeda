import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Loader2, CheckCircle, AlertTriangle, RefreshCw } from "lucide-react";
import GeneralSettings from '@/components/admin/settings/GeneralSettings';
import AppearanceSettings from '@/components/admin/settings/AppearanceSettings';
import ThemeSettings from '@/components/admin/settings/ThemeSettings';
import CustomCodeSettings from '@/components/admin/settings/CustomCodeSettings';
import SocialSettings from '@/components/admin/settings/SocialSettings';
import SitemapSettings from '@/components/admin/settings/SitemapSettings';
import AdSenseSettings from '@/components/admin/settings/AdSenseSettings';
import { useToast } from '@/components/ui/use-toast';
import { api, addAuthHeader } from '@/lib/api';
import { useAuth } from '@clerk/clerk-react';
import { useSiteConfig } from '@/contexts/SiteConfigContext';
import { useSiteSettings } from '@/hooks/useSiteSettings';
import type { SiteConfig } from '@/types/siteConfig';

interface ApiError {
  response?: {
    data?: {
      error?: string;
    };
    status?: number;
  };
  message?: string;
  code?: string;
}

export default function SiteSettingsPage() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { config: siteConfig, refreshConfig } = useSiteConfig();
  const { updateSettings, loading: updateLoading } = useSiteSettings();
  const { toast } = useToast();
  const { getToken } = useAuth();
  const [saving, setSaving] = useState(false);
  const [config, setConfig] = useState<SiteConfig>(siteConfig || {
    siteName: 'Internet Keeda',
    siteDescription: 'Discover the best AI tools for your needs',
    logo: '/logo.svg',
    logoLight: '/logo-light.svg',
    logoDark: '/logo-dark.svg',
    favicon: '/favicon.ico',
    primaryColor: '#10b981',
    secondaryColor: '#3b82f6',
    allowUserRegistration: true,
    allowUserSubmissions: true,
    requireApprovalForSubmissions: true,
    requireApprovalForReviews: true,
    footerText: '© 2024 Internet Keeda. All rights reserved.',
    contactEmail: '',
    socialLinks: {
      twitter: '',
      facebook: '',
      instagram: '',
      linkedin: '',
      github: ''
    },
    analyticsId: '',
    customCss: '',
    customJs: '',
    adsenseEnabled: false,
    adsensePublisherId: '',
    adsenseAutoAds: true,
    adsenseAdUnits: [],
    metaTags: {
      title: 'Internet Keeda - Discover the Best AI Tools',
      description: 'Find the best AI tools for your needs, from content creation to productivity and beyond.',
      keywords: 'AI tools, artificial intelligence, productivity tools, AI software',
      ogImage: '/og-image.svg'
    },
    defaultTheme: 'system',
    allowThemeToggle: true
  });

  // Sync local state with context whenever siteConfig changes
  useEffect(() => {
    if (siteConfig) {
      setConfig(siteConfig);
    }
  }, [siteConfig]);

  // Only load config initially if not already available from context
  useEffect(() => {
    const fetchConfig = async () => {
      try {
        setLoading(true);
        
        // If we already have config from context, use it
        if (siteConfig) {
          setConfig(siteConfig);
          setError(null);
          setLoading(false);
          return;
        }
        
        console.log('Fetching config from:', `${api.defaults.baseURL}/config`);
        const response = await api.get('/config');
        console.log('Config data:', response.data);
        setConfig(response.data);
        setError(null);
      } catch (err) {
        console.error('Error fetching site config:', err);
        const apiError = err as ApiError;
        
        if (apiError.response?.status === 401 || apiError.response?.status === 403) {
          setError('Authentication error. Please ensure you are logged in with admin privileges.');
        } else if (apiError.response?.status === 404) {
          setError('Site configuration endpoint not found. Please check your deployment configuration.');
        } else if (apiError.message?.includes('Network Error')) {
          setError('Network error. Please check your internet connection and try again.');
        } else {
          setError('Failed to load site configuration. Please check your connection and try again.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchConfig();
  }, [siteConfig]);

  // Handle saving changes using our new hook
  const saveChanges = async (updatedConfig: Partial<SiteConfig>, tab: string = 'general') => {
    try {
      setSaving(true);
      console.log('Saving changes for', tab, 'tab with data:', updatedConfig);
      
      const success = await updateSettings(updatedConfig);
      
      if (success) {
        // Refresh the site config context to ensure latest data
        await refreshConfig();
        
        // Update the local state with the latest config
        setConfig(prevConfig => ({
          ...prevConfig,
          ...updatedConfig
        }));
        
        toast({
          title: "Settings saved",
          description: `Your ${tab} settings have been updated successfully.`,
          variant: "default",
          className: "bg-green-50 border-green-200 text-green-800"
        });
      }
    } catch (err: unknown) {
      console.error('Error saving settings:', err);
      const apiError = err as ApiError;
      
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
      
      console.error('Save error details:', {
        status: apiError.response?.status,
        data: apiError.response?.data,
        message: apiError.message
      });
      
      toast({
        title: "Error saving settings",
        description: errorMessage,
        variant: "destructive"
      });
    } finally {
      setSaving(false);
    }
  };
  
  const handleRetry = async () => {
    setError(null);
    setLoading(true);
    
    try {
      // Try to fetch config again
      const response = await api.get('/config');
      setConfig(response.data);
      setError(null);
    } catch (err) {
      console.error('Error retrying config fetch:', err);
      const apiError = err as ApiError;
      
      if (apiError.response?.status === 401 || apiError.response?.status === 403) {
        setError('Authentication error. Please ensure you are logged in with admin privileges.');
      } else if (apiError.response?.status === 404) {
        setError('Site configuration endpoint not found. Please check your deployment configuration.');
      } else if (apiError.message?.includes('Network Error')) {
        setError('Network error. Please check your internet connection and try again.');
      } else {
        setError('Failed to load site configuration. Please check your connection and try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[calc(100vh-200px)]">
        <Loader2 className="w-8 h-8 animate-spin text-green-500" />
        <span className="ml-2 text-lg">Loading site settings...</span>
      </div>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive" className="max-w-lg mx-auto mt-8">
        <AlertTriangle className="h-5 w-5 mr-2" />
        <div className="flex-1">
          <AlertDescription className="mb-4">
            {error}
          </AlertDescription>
          <div className="flex items-center mt-4">
            <Button onClick={handleRetry} variant="outline" size="sm" className="mr-2">
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </Alert>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Site Settings</h2>
          <p className="text-muted-foreground">
            Manage your site's appearance, features, and other settings.
          </p>
        </div>
        <Button 
          onClick={async () => {
            setLoading(true);
            await refreshConfig();
            toast({
              title: "Settings refreshed",
              description: "Your site settings have been refreshed from the server.",
              variant: "default",
              className: "bg-green-50 border-green-200 text-green-800"
            });
            setLoading(false);
          }}
          variant="outline"
          size="sm"
          className="flex items-center gap-1"
          disabled={loading}
        >
          <RefreshCw className="h-4 w-4" />
          <span>Refresh</span>
        </Button>
      </div>

      <Tabs defaultValue="general" className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 md:grid-cols-7 gap-2">
          <TabsTrigger value="general">General</TabsTrigger>
          <TabsTrigger value="appearance">Appearance</TabsTrigger>
          <TabsTrigger value="theme">Theme</TabsTrigger>
          <TabsTrigger value="custom-code">Custom Code</TabsTrigger>
          <TabsTrigger value="social">Social</TabsTrigger>
          <TabsTrigger value="adsense">AdSense</TabsTrigger>
          <TabsTrigger value="sitemap">Sitemap</TabsTrigger>
        </TabsList>
        
        <TabsContent value="general">
          <Card>
            <CardHeader>
              <CardTitle>General Settings</CardTitle>
              <CardDescription>
                Basic information about your site.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <GeneralSettings 
                config={config} 
                onSave={(updates) => saveChanges({...updates}, 'general')} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle>Appearance Settings</CardTitle>
              <CardDescription>
                Customize your site's look and feel.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AppearanceSettings 
                config={config} 
                onSave={(updates) => saveChanges({...updates}, 'appearance')} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="theme">
          <Card>
            <CardHeader>
              <CardTitle>Theme Settings</CardTitle>
              <CardDescription>
                Choose the visual theme for your entire platform.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ThemeSettings 
                config={config} 
                onSave={(updates) => saveChanges({...updates}, 'theme')} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="custom-code">
          <Card>
            <CardHeader>
              <CardTitle>Custom Code</CardTitle>
              <CardDescription>
                Add custom CSS and JavaScript to your site.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <CustomCodeSettings 
                config={config} 
                onSave={(updates) => saveChanges({...updates}, 'custom code')} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="social">
          <Card>
            <CardHeader>
              <CardTitle>Social Media</CardTitle>
              <CardDescription>
                Configure your social media links and integrations.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SocialSettings 
                config={config} 
                onSave={(updates) => saveChanges({...updates}, 'social')} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="adsense">
          <Card>
            <CardHeader>
              <CardTitle>AdSense Settings</CardTitle>
              <CardDescription>
                Configure Google AdSense to monetize your website.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <AdSenseSettings 
                config={config} 
                onSave={(updates) => saveChanges({...updates}, 'adsense')} 
              />
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="sitemap">
          <Card>
            <CardHeader>
              <CardTitle>XML Sitemap</CardTitle>
              <CardDescription>
                Generate and manage your site's XML sitemap for search engines.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <SitemapSettings />
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 