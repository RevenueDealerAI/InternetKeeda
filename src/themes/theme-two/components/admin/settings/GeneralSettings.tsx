import { useState, useEffect } from 'react';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Loader2, CheckCircle, AlertTriangle, RefreshCw, ImageIcon, UploadCloud } from 'lucide-react';
import { useToast } from '@/components/ui/use-toast';
import { SiteConfig } from '@/types/siteConfig';
import { useAuth } from '@clerk/clerk-react';
import axios from 'axios';

interface GeneralSettingsProps {
  config: SiteConfig;
  onSave: (updates: Partial<SiteConfig>) => Promise<void>;
}

const OGImagePreview = ({ ogImage, title, description, siteName }: { ogImage: string; title: string; description: string; siteName: string }) => {
  return (
    <details className="mt-3 border rounded-md bg-white shadow-sm max-w-xl">
      <summary className="cursor-pointer px-3 py-2 text-sm text-gray-500 border-b bg-gray-50">
        Preview: How your site will appear when shared on social media
      </summary>
      <div className="p-4 max-h-[260px] overflow-y-auto">
        <div className="flex flex-col space-y-2 max-w-md">
          <div className="border rounded-md overflow-hidden shadow-sm">
            {ogImage ? (
              <div className="aspect-[1.91/1] bg-gray-100 relative overflow-hidden">
                <Image src={ogImage} alt="Social media preview" fill className="object-cover" unoptimized />
              </div>
            ) : (
              <div className="aspect-[1.91/1] bg-gray-100 flex items-center justify-center text-gray-400">
                <span className="text-sm">No OG Image URL provided</span>
              </div>
            )}
            <div className="p-3 space-y-1">
              <div className="text-xs text-gray-500 uppercase">{siteName || 'Your Website'}</div>
              <div className="font-medium text-sm line-clamp-1">
                {title || 'Your page title will appear here'}
              </div>
              <div className="text-xs text-gray-500 line-clamp-2">
                {description || 'Your page description will appear here. This text is truncated if it gets too long.'}
              </div>
            </div>
          </div>
          <div className="border rounded-md overflow-hidden shadow-sm mt-4">
            <div className="flex">
              {ogImage ? (
                <div className="w-24 h-24 bg-gray-100 shrink-0 relative">
                  <Image src={ogImage} alt="Twitter preview" fill className="object-cover" unoptimized />
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
    </details>
  );
};

const OGImageUploader = ({ ogImageUrl, onUpload }: { ogImageUrl: string; onUpload: (url: string) => void }) => {
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { getToken } = useAuth();

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const validTypes = ['image/jpeg', 'image/png', 'image/svg+xml', 'image/gif'];
    if (!validTypes.includes(file.type)) { setError('Invalid file type. Please upload a JPEG, PNG, SVG, or GIF file.'); return; }
    if (file.size > 2 * 1024 * 1024) { setError('File is too large. Maximum size is 2MB.'); return; }
    try {
      setUploading(true); setError(null);
      const token = await getToken();
      if (!token) { setError('Authentication failed. You must be logged in to upload an image.'); return; }
      const formData = new FormData(); formData.append('ogImage', file);
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || '/';
      const endpoint = `${apiBaseUrl}/api/config/upload-og-image`;
      const localEndpoint = `${apiBaseUrl}/api/config/upload-og-image-local`;
      try {
        const response = await axios.post(endpoint, formData, { headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` } });
        if (response.data.ogImageUrl) { onUpload(response.data.ogImageUrl); return; }
      } catch {
        try {
          const localResponse = await axios.post(localEndpoint, formData, { headers: { 'Content-Type': 'multipart/form-data', 'Authorization': `Bearer ${token}` } });
          if (localResponse.data.ogImageUrl) { onUpload(localResponse.data.ogImageUrl); return; }
        } catch {
          const testEndpoint = `${apiBaseUrl}/api/config/test-upload-og-image`;
          const testResponse = await axios.post(testEndpoint, formData, { headers: { 'Content-Type': 'multipart/form-data' } });
          if (testResponse.data.ogImageUrl) { onUpload(testResponse.data.ogImageUrl); return; }
          throw new Error('All upload attempts failed (cloud, local, and test)');
        }
      }
    } catch (err) { setError('An unexpected error occurred during upload.'); }
    finally { setUploading(false); event.target.value = ''; }
  };

  return (
    <div className="mt-4 flex flex-col gap-4">
      {error && (<div className="text-sm text-red-500 bg-red-50 p-2 rounded-md border border-red-200">{error}</div>)}
      <div className="flex gap-4 items-start">
        <div className="flex-shrink-0 w-32 h-32 border rounded-md flex items-center justify-center bg-gray-50 overflow-hidden">
          {/* {ogImageUrl ? (<Image src={ogImageUrl} alt="OG Image Preview" fill className="object-cover" unoptimized />) : (
            <div className="flex flex-col items-center text-gray-400"><ImageIcon className="h-8 w-8" /><span className="mt-2 text-xs">No image</span></div>
          )} */}
        </div>
        <div className="flex flex-col gap-2">
          <Button asChild variant="outline" className="cursor-pointer rounded-full" disabled={uploading}>
            <label>{uploading ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Uploading...</>) : (<><UploadCloud className="mr-2 h-4 w-4" />Upload OG Image</>)}
              <input type="file" accept=".jpg,.jpeg,.png,.svg,.gif" className="sr-only" onChange={handleFileUpload} disabled={uploading} />
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
    if (name.startsWith('metaTags.')) {
      const metaTagKey = name.split('.')[1];
      setFormData(prev => ({ ...prev, metaTags: { ...prev.metaTags, [metaTagKey]: value } }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleMetaTagsChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, metaTags: { ...prev.metaTags, [field]: value } }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault(); setSaving(true); setError(null);
    try {
      try { await onSave(formData); toast({ title: 'Settings saved', description: 'General settings have been updated successfully.', variant: 'default', className: 'bg-green-50 border-green-200 text-green-800' }); return; }
      catch {
        // Fallback to API call
      }
      try {
        const token = await getToken(); if (!token) throw new Error('Authentication token not available');
        const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
        await axios.put(`${apiBaseUrl}/api/config`, formData, { headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` } });
        toast({ title: 'Settings saved', description: 'General settings have been updated via direct API call.', variant: 'default', className: 'bg-green-50 border-green-200 text-green-800' }); return;
      } catch {
        // Fallback to test endpoint
      }
      const apiBaseUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3005';
      const response = await axios.put(`${apiBaseUrl}/api/config/test-save`, formData);
      if (response.data.success) { toast({ title: 'Settings saved', description: 'General settings have been updated via test endpoint.', variant: 'default', className: 'bg-green-50 border-green-200 text-green-800' }); return; }
      throw new Error('All save methods failed');
    } catch (err) {
      setError('An unexpected error occurred');
      toast({ title: 'Error saving settings', description: 'An unexpected error occurred', variant: 'destructive' });
    } finally { setSaving(false); }
  };

  const addSampleImage = () => { const sampleImageUrl = 'https://place-hold.it/1200x630/18B292/FFFFFF/JPEG?text=AI+Tool+Finder'; handleMetaTagsChange('ogImage', sampleImageUrl); };
  const handleOGImageUpdate = (imageUrl: string) => { handleMetaTagsChange('ogImage', imageUrl); };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="siteName">Site Name</Label>
          <Input id="siteName" name="siteName" value={formData.siteName} onChange={handleChange} placeholder="AI Tool Finder" required className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="siteDescription">Site Description</Label>
          <Textarea id="siteDescription" name="siteDescription" value={formData.siteDescription} onChange={handleChange} placeholder="Discover the best AI tools for your needs" rows={3} className="rounded-xl focus-visible:ring-2 focus-visible:ring-purple-500" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="footerText">Footer Text</Label>
          <Input id="footerText" name="footerText" value={formData.footerText} onChange={handleChange} placeholder="© 2024 AI Tool Finder. All rights reserved." className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
        </div>
        <div className="space-y-2">
          <Label htmlFor="contactEmail">Contact Email</Label>
          <Input id="contactEmail" name="contactEmail" type="email" value={formData.contactEmail} onChange={handleChange} placeholder="contact@example.com" className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
        </div>
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <Label htmlFor="meta-title" className="text-base font-medium">Meta Tags</Label>
            <Button onClick={() => window.location.reload()} variant="outline" size="sm" className="text-xs flex items-center gap-1"><RefreshCw className="h-3 w-3" />Refresh Page</Button>
          </div>
          <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-md border border-amber-200 mb-4"><p>Meta tag changes require a page refresh to update in the browser tab. After saving, click the "Refresh Page" button to see changes.</p></div>
          <div className="space-y-2"><Label htmlFor="meta-title">Title</Label><Input id="meta-title" placeholder="Meta title for SEO" value={formData.metaTags?.title || ''} onChange={(e) => handleMetaTagsChange('title', e.target.value)} className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" /></div>
          <div className="space-y-2"><Label htmlFor="meta-description">Description</Label><Textarea id="meta-description" placeholder="Meta description for SEO" value={formData.metaTags?.description || ''} onChange={(e) => handleMetaTagsChange('description', e.target.value)} rows={3} className="rounded-xl focus-visible:ring-2 focus-visible:ring-purple-500" /></div>
          <div className="space-y-2"><Label htmlFor="meta-keywords">Keywords</Label><Input id="meta-keywords" placeholder="Comma-separated keywords" value={formData.metaTags?.keywords || ''} onChange={(e) => handleMetaTagsChange('keywords', e.target.value)} className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" /></div>
          <div className="space-y-2">
            <div className="flex justify-between items-center"><Label htmlFor="ogImage" className="text-base font-medium">Social Media Sharing Image (OG Image)</Label></div>
            <Label htmlFor="ogImage">OG Image URL</Label>
            <div className="flex gap-2">
              <div className="flex-1"><Input id="ogImage" placeholder="URL for social media sharing image" value={formData.metaTags?.ogImage || ''} onChange={(e) => handleMetaTagsChange('ogImage', e.target.value)} className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" /></div>
              <Button type="button" variant="outline" size="sm" onClick={addSampleImage} className="whitespace-nowrap rounded-full">Try Sample</Button>
            </div>
            <p className="text-xs text-gray-500">Recommended size: 1200×630 pixels</p>
            <OGImageUploader ogImageUrl={formData.metaTags?.ogImage || ''} onUpload={handleOGImageUpdate} />
            <OGImagePreview ogImage={formData.metaTags?.ogImage || ''} title={formData.metaTags?.title || formData.siteName} description={formData.metaTags?.description || formData.siteDescription} siteName={formData.siteName} />
          </div>
        </div>
      </div>
      {error && (<div className="flex items-center text-red-500 text-sm mb-2"><AlertTriangle className="h-4 w-4 mr-1" /><span>{error}</span></div>)}
      <Button type="submit" disabled={saving} className={success ? 'rounded-full bg-green-500 hover:bg-green-600' : 'rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600'}>
        {saving ? (<><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving...</>) : success ? (<><CheckCircle className="mr-2 h-4 w-4" />Saved!</>) : ('Save General Settings')}
      </Button>
    </form>
  );
}


