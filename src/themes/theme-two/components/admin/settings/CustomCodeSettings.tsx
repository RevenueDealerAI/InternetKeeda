import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { SiteConfig } from '@/types/siteConfig';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle } from 'lucide-react';

interface CustomCodeSettingsProps {
  config: SiteConfig;
  onSave: (updates: Partial<SiteConfig>) => Promise<void>;
}

export default function CustomCodeSettings({ config, onSave }: CustomCodeSettingsProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    customCss: config?.customCss || '',
    customJs: config?.customJs || ''
  });

  useEffect(() => {
    if (config) {
      setFormData({
        customCss: config.customCss || '',
        customJs: config.customJs || ''
      });
    }
  }, [config]);

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
      <Alert className="mb-4 border-amber-500 text-amber-800 bg-amber-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Custom code is injected directly into the site. Use with caution as it can affect site performance and security.
        </AlertDescription>
      </Alert>
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="customCss">Custom CSS</Label>
          <Textarea
            id="customCss"
            name="customCss"
            value={formData.customCss}
            onChange={handleChange}
            placeholder=".custom-class { color: blue; }"
            className="font-mono text-sm h-64 rounded-xl focus-visible:ring-2 focus-visible:ring-purple-500"
          />
          <p className="text-xs text-muted-foreground">Custom CSS will be injected into the head of the document</p>
        </div>
        <div className="space-y-2">
          <Label htmlFor="customJs">Custom JavaScript</Label>
          <Textarea
            id="customJs"
            name="customJs"
            value={formData.customJs}
            onChange={handleChange}
            placeholder="document.addEventListener('DOMContentLoaded', function() { /* Your code here */ });"
            className="font-mono text-sm h-64 rounded-xl focus-visible:ring-2 focus-visible:ring-purple-500"
          />
          <p className="text-xs text-muted-foreground">Custom JavaScript will be injected at the end of the body</p>
        </div>
      </div>
      <Button type="submit" disabled={saving} className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600">
        {saving ? 'Saving...' : 'Save Custom Code'}
      </Button>
    </form>
  );
}


