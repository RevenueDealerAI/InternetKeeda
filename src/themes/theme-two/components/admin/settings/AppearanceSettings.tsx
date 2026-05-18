import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SiteConfig } from '@/types/siteConfig';
import LogoManagement from '@/components/admin/settings/LogoManagement';
import FaviconManagement from '@/components/admin/settings/FaviconManagement';
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
    setFormData(prev => ({
      ...prev,
      [name]: checked
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
      toast.success("Appearance settings saved successfully");
    } catch (error) {
      toast.error("Failed to save appearance settings");
    } finally {
      setSaving(false);
    }
  };

  const handleLogoDisplayToggle = async (checked: boolean) => {
    try {
      setFormData(prev => ({
        ...prev,
        showSiteNameWithLogo: checked
      }));
      await onSave({ showSiteNameWithLogo: checked });
      toast.success("Logo display setting updated");
    } catch (error) {
      toast.error("Failed to update logo display setting");
    }
  };

  const handleLogoUpdate = async (logoUrl: string, type: 'default' | 'dark' | 'light' = 'default') => {
    const update: Partial<SiteConfig> = {};
    if (type === 'default') update.logo = logoUrl;
    if (type === 'dark') update.logoDark = logoUrl;
    if (type === 'light') update.logoLight = logoUrl;
    try {
      await onSave(update);
      if (type === 'default') setFormData(prev => ({ ...prev, logo: logoUrl }));
    } catch (error) {
      // ignore
    }
  };

  const handleFaviconUpdate = async (faviconUrl: string) => {
    try {
      setFormData(prev => ({ ...prev, favicon: faviconUrl }));
      await onSave({ favicon: faviconUrl });
      toast.success("Favicon updated successfully");
    } catch (error) {
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
              className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500"
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
              className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500"
            />
            <p className="text-xs text-muted-foreground">
              URL to your site's favicon (or use the uploader below)
            </p>
          </div>
          <div className="flex items-center justify-between pt-2">
            <div>
              <Label htmlFor="showSiteNameWithLogo" className="font-medium">Show Site Name with Logo</Label>
              <p className="text-xs text-muted-foreground mt-1">
                {formData.showSiteNameWithLogo ? "Site name text will be displayed alongside your logo" : "Only your logo will be displayed without site name text"}
              </p>
            </div>
            <Switch
              id="showSiteNameWithLogo"
              checked={formData.showSiteNameWithLogo}
              onCheckedChange={handleLogoDisplayToggle}
              className="data-[state=checked]:bg-purple-600"
            />
          </div>
        </div>
        <Button type="submit" disabled={saving} className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600">
          {saving ? 'Saving...' : 'Save Appearance'}
        </Button>
      </form>
      <Separator className="my-6" />
      <div>
        <h3 className="text-lg font-medium mb-4">Logo Management</h3>
        <LogoManagement currentLogo={config.logo || ''} currentLogoDark={config.logoDark || ''} currentLogoLight={config.logoLight || ''} onLogoUpdate={handleLogoUpdate} />
      </div>
      <Separator className="my-6" />
      <div>
        <h3 className="text-lg font-medium mb-4">Favicon Management</h3>
        <FaviconManagement currentFavicon={config.favicon || ''} onFaviconUpdate={handleFaviconUpdate} />
      </div>
    </div>
  );
}


