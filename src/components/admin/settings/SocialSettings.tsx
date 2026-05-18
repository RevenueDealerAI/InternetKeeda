import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SiteConfig } from '@/types/siteConfig';
import { 
  Twitter, 
  Facebook, 
  Instagram, 
  Linkedin, 
  Github 
} from 'lucide-react';

interface SocialSettingsProps {
  config: SiteConfig;
  onSave: (updates: Partial<SiteConfig>) => Promise<void>;
}

export default function SocialSettings({ config, onSave }: SocialSettingsProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    socialLinks: {
      twitter: config?.socialLinks?.twitter || '',
      facebook: config?.socialLinks?.facebook || '',
      instagram: config?.socialLinks?.instagram || '',
      linkedin: config?.socialLinks?.linkedin || '',
      github: config?.socialLinks?.github || ''
    },
    analyticsId: config?.analyticsId || ''
  });

  // Sync component state when parent config prop changes
  useEffect(() => {
    if (config) {
      setFormData({
        socialLinks: {
          twitter: config.socialLinks?.twitter || '',
          facebook: config.socialLinks?.facebook || '',
          instagram: config.socialLinks?.instagram || '',
          linkedin: config.socialLinks?.linkedin || '',
          github: config.socialLinks?.github || ''
        },
        analyticsId: config.analyticsId || ''
      });
    }
  }, [config]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: {
          ...prev[parent as keyof typeof prev] as Record<string, string>,
          [child]: value
        }
      }));
    } else {
      setFormData(prev => ({
        ...prev,
        [name]: value
      }));
    }
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
      <div>
        <h3 className="text-lg font-medium mb-4">Social Media Links</h3>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="socialLinks.twitter" className="flex items-center gap-2">
              <Twitter className="h-4 w-4" />
              <span>Twitter / X</span>
            </Label>
            <Input
              id="socialLinks.twitter"
              name="socialLinks.twitter"
              value={formData.socialLinks.twitter}
              onChange={handleChange}
              placeholder="https://twitter.com/youraccount"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="socialLinks.facebook" className="flex items-center gap-2">
              <Facebook className="h-4 w-4" />
              <span>Facebook</span>
            </Label>
            <Input
              id="socialLinks.facebook"
              name="socialLinks.facebook"
              value={formData.socialLinks.facebook}
              onChange={handleChange}
              placeholder="https://facebook.com/yourpage"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="socialLinks.instagram" className="flex items-center gap-2">
              <Instagram className="h-4 w-4" />
              <span>Instagram</span>
            </Label>
            <Input
              id="socialLinks.instagram"
              name="socialLinks.instagram"
              value={formData.socialLinks.instagram}
              onChange={handleChange}
              placeholder="https://instagram.com/youraccount"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="socialLinks.linkedin" className="flex items-center gap-2">
              <Linkedin className="h-4 w-4" />
              <span>LinkedIn</span>
            </Label>
            <Input
              id="socialLinks.linkedin"
              name="socialLinks.linkedin"
              value={formData.socialLinks.linkedin}
              onChange={handleChange}
              placeholder="https://linkedin.com/company/yourcompany"
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="socialLinks.github" className="flex items-center gap-2">
              <Github className="h-4 w-4" />
              <span>GitHub</span>
            </Label>
            <Input
              id="socialLinks.github"
              name="socialLinks.github"
              value={formData.socialLinks.github}
              onChange={handleChange}
              placeholder="https://github.com/yourorganization"
            />
          </div>
        </div>
      </div>
      
      <div className="pt-4 border-t">
        <h3 className="text-lg font-medium mb-4">Analytics</h3>
        <div className="space-y-2">
          <Label htmlFor="analyticsId">Google Analytics ID</Label>
          <Input
            id="analyticsId"
            name="analyticsId"
            value={formData.analyticsId}
            onChange={handleChange}
            placeholder="G-XXXXXXXXXX"
          />
          <p className="text-xs text-muted-foreground">
            Your Google Analytics measurement ID (starts with G-)
          </p>
        </div>
      </div>
      
      <Button type="submit" disabled={saving} className="mt-6">
        {saving ? 'Saving...' : 'Save Social Settings'}
      </Button>
    </form>
  );
} 