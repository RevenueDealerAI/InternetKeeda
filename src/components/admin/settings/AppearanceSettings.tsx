import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SiteConfig } from '@/types/siteConfig';
import LogoManagement from './LogoManagement';
import FaviconManagement from './FaviconManagement';
import { Separator } from '@/components/ui/separator';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';

interface AppearanceSettingsProps {
  config: SiteConfig;
  onSave: (updates: Partial<SiteConfig>) => Promise<void>;
}

export default function AppearanceSettings({ config, onSave }: AppearanceSettingsProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    favicon: config.favicon || '',
    logo: config.logo || '',
    showSiteNameWithLogo: config.showSiteNameWithLogo !== false,
  });

  // Sync component state when parent config prop changes
  useEffect(() => {
    if (config) {
      setFormData({
        favicon: config.favicon || '',
        logo: config.logo || '',
        showSiteNameWithLogo: config.showSiteNameWithLogo !== false,
      });
    }
  }, [config]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSwitchChange = (name: string) => (checked: boolean) => {
    console.log(`Switch ${name} changed to:`, checked);
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      console.log('Submitting form data:', formData);
      await onSave(formData);
      toast.success("Appearance settings saved successfully");
    } catch (error) {
      console.error('Error saving appearance settings:', error);
      toast.error("Failed to save appearance settings");
    } finally {
      setSaving(false);
    }
  };

  // Separate function to update just the logo display setting
  const handleLogoDisplayToggle = async (checked: boolean) => {
    try {
      console.log('Updating logo display setting to:', checked);
      setFormData(prev => ({
        ...prev,
        showSiteNameWithLogo: checked
      }));
      
      // Save this specific setting immediately
      await onSave({ showSiteNameWithLogo: checked });
      toast.success("Logo display setting updated");
    } catch (error) {
      console.error('Error updating logo display setting:', error);
      toast.error("Failed to update logo display setting");
    }
  };

  const handleLogoUpdate = async (logoUrl: string, type: 'default' | 'dark' | 'light' = 'default') => {
    // Create an update object based on the logo type
    const update: Partial<SiteConfig> = {};
    
    if (type === 'default') {
      update.logo = logoUrl;
    } else if (type === 'dark') {
      update.logoDark = logoUrl;
    } else if (type === 'light') {
      update.logoLight = logoUrl;
    }
    
    try {
      // Call the onSave function with the specific updates
      await onSave(update);
      
      // Update local form state if it's the default logo
      if (type === 'default') {
        setFormData(prev => ({ ...prev, logo: logoUrl }));
      }
    } catch (error) {
      console.error(`Error updating ${type} logo:`, error);
    }
  };

  const handleFaviconUpdate = async (faviconUrl: string) => {
    try {
      // Update the favicon and save it immediately
      console.log('Updating favicon to:', faviconUrl);
      setFormData(prev => ({ ...prev, favicon: faviconUrl }));
      
      await onSave({ favicon: faviconUrl });
      toast.success("Favicon updated successfully");
    } catch (error) {
      console.error('Error updating favicon:', error);
      toast.error("Failed to update favicon");
    }
  };

  return (
    <div className="space-y-8">
      <form onSubmit={handleSubmit} className="space-y-6">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="logo">Logo URL</Label>
            <Input
              id="logo"
              name="logo"
              value={formData.logo}
              onChange={handleChange}
              placeholder="/logo.svg"
            />
            <p className="text-xs text-muted-foreground">
              URL to your site's logo (or use the uploader below)
            </p>
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="favicon">Favicon URL</Label>
            <Input
              id="favicon"
              name="favicon"
              value={formData.favicon}
              onChange={handleChange}
              placeholder="/favicon.ico"
            />
            <p className="text-xs text-muted-foreground">
              URL to your site's favicon (or use the uploader below)
            </p>
          </div>

          <div className="flex items-center justify-between pt-2">
            <div>
              <Label htmlFor="showSiteNameWithLogo" className="font-medium">Show Site Name with Logo</Label>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.showSiteNameWithLogo ? 
                  "Site name text will be displayed alongside your logo" : 
                  "Only your logo will be displayed without site name text"}
              </p>
            </div>
            <Switch
              id="showSiteNameWithLogo"
              checked={formData.showSiteNameWithLogo}
              onCheckedChange={handleLogoDisplayToggle}
            />
          </div>
        </div>
        
        <Button type="submit" disabled={saving}>
          {saving ? 'Saving...' : 'Save Appearance'}
        </Button>
      </form>
      
      <Separator className="my-6" />
      
      <div>
        <h3 className="text-lg font-medium mb-4">Logo Management</h3>
        <LogoManagement 
          currentLogo={config.logo || ''} 
          currentLogoDark={config.logoDark || ''}
          currentLogoLight={config.logoLight || ''}
          onLogoUpdate={handleLogoUpdate}
        />
        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
          <h4 className="text-sm font-medium text-blue-800 mb-1">Recommended Logo Sizes</h4>
          <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
            <li>Optimal logo size: 250-400px wide, height proportional</li>
            <li>For high-resolution displays: 500px wide recommended</li>
            <li>Maximum file size: 2MB</li>
            <li>Supported formats: PNG, JPEG, SVG (transparent background recommended)</li>
          </ul>
        </div>
      </div>

      <Separator className="my-6" />
      
      <div>
        <h3 className="text-lg font-medium mb-4">Favicon Management</h3>
        <FaviconManagement 
          currentFavicon={config.favicon || ''} 
          onFaviconUpdate={handleFaviconUpdate}
        />
        <div className="mt-4 p-3 bg-blue-50 rounded-md border border-blue-100">
          <h4 className="text-sm font-medium text-blue-800 mb-1">Recommended Favicon Sizes</h4>
          <ul className="text-xs text-blue-700 space-y-1 list-disc pl-4">
            <li>Standard favicon size: 32×32 pixels</li>
            <li>For modern browsers and mobile devices: 192×192 pixels</li>
            <li>Maximum file size: 1MB</li>
            <li>Supported formats: ICO, PNG, SVG (square images work best)</li>
          </ul>
        </div>
      </div>
    </div>
  );
} 