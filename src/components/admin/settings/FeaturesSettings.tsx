import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { SiteConfig } from '@/types/siteConfig';

interface FeaturesSettingsProps {
  config: SiteConfig;
  onSave: (updates: Partial<SiteConfig>) => Promise<void>;
}

export default function FeaturesSettings({ config, onSave }: FeaturesSettingsProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    allowUserRegistration: config?.allowUserRegistration !== false,
    allowUserSubmissions: config?.allowUserSubmissions !== false,
    requireApprovalForSubmissions: config?.requireApprovalForSubmissions !== false,
    requireApprovalForReviews: config?.requireApprovalForReviews !== false,
  });

  // Sync component state when parent config prop changes
  useEffect(() => {
    if (config) {
      setFormData({
        allowUserRegistration: config.allowUserRegistration !== false,
        allowUserSubmissions: config.allowUserSubmissions !== false,
        requireApprovalForSubmissions: config.requireApprovalForSubmissions !== false,
        requireApprovalForReviews: config.requireApprovalForReviews !== false,
      });
    }
  }, [config]);

  const handleToggle = (name: string) => {
    setFormData(prev => ({
      ...prev,
      [name]: !prev[name as keyof typeof prev]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="space-y-4">
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="allowUserRegistration" className="flex flex-col space-y-1">
            <span>Allow User Registration</span>
            <span className="font-normal text-sm text-muted-foreground">
              When enabled, visitors can register for accounts
            </span>
          </Label>
          <Switch
            id="allowUserRegistration"
            checked={formData.allowUserRegistration}
            onCheckedChange={() => handleToggle('allowUserRegistration')}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="allowUserSubmissions" className="flex flex-col space-y-1">
            <span>Allow Tool Submissions</span>
            <span className="font-normal text-sm text-muted-foreground">
              When enabled, users can submit new AI tools
            </span>
          </Label>
          <Switch
            id="allowUserSubmissions"
            checked={formData.allowUserSubmissions}
            onCheckedChange={() => handleToggle('allowUserSubmissions')}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="requireApprovalForSubmissions" className="flex flex-col space-y-1">
            <span>Require Approval for Submissions</span>
            <span className="font-normal text-sm text-muted-foreground">
              When enabled, tool submissions require admin approval
            </span>
          </Label>
          <Switch
            id="requireApprovalForSubmissions"
            checked={formData.requireApprovalForSubmissions}
            onCheckedChange={() => handleToggle('requireApprovalForSubmissions')}
          />
        </div>
        
        <div className="flex items-center justify-between space-x-2">
          <Label htmlFor="requireApprovalForReviews" className="flex flex-col space-y-1">
            <span>Require Approval for Reviews</span>
            <span className="font-normal text-sm text-muted-foreground">
              When enabled, user reviews require admin approval before being published
            </span>
          </Label>
          <Switch
            id="requireApprovalForReviews"
            checked={formData.requireApprovalForReviews}
            onCheckedChange={() => handleToggle('requireApprovalForReviews')}
          />
        </div>
      </div>
      
      <Button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save Features'}
      </Button>
    </form>
  );
} 