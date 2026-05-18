import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { SiteConfig } from '@/types/siteConfig';
import { THEMES, ThemeConfig } from '@/themes/theme-config';
import { toast } from 'sonner';
import { Check, Palette, Sparkles, Eye } from 'lucide-react';

interface ThemeSettingsProps {
  config: SiteConfig;
  onSave: (updates: Partial<SiteConfig>) => Promise<void>;
}

export default function ThemeSettings({ config, onSave }: ThemeSettingsProps) {
  const [saving, setSaving] = useState(false);
  const [selectedTheme, setSelectedTheme] = useState(config.activeTheme || 'theme-one');

  // Sync component state when parent config prop changes
  useEffect(() => {
    if (config) {
      setSelectedTheme(config.activeTheme || 'theme-one');
    }
  }, [config]);

  const handleThemeSelect = async (themeId: string) => {
    if (themeId === selectedTheme) return;
    
    console.log('ThemeSettings: Attempting to change theme from', selectedTheme, 'to', themeId);
    setSaving(true);
    try {
      console.log('ThemeSettings: Calling onSave with activeTheme:', themeId);
      await onSave({ activeTheme: themeId });
      console.log('ThemeSettings: Theme save successful, updating local state');
      setSelectedTheme(themeId);
      toast.success(`Theme changed to ${THEMES.find(t => t.id === themeId)?.name}!`);
    } catch (error) {
      console.error('ThemeSettings: Error updating theme:', error);
      toast.error("Failed to update theme");
    } finally {
      setSaving(false);
    }
  };

  const getThemePreview = (theme: ThemeConfig) => {
    // This will show a preview of each theme
    if (theme.id === 'theme-one') {
      return (
        <div className="w-full h-32 bg-gradient-to-br from-purple-50 to-blue-50 rounded-lg border-2 border-gray-200 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-purple-100/50 to-blue-100/50"></div>
          <div className="absolute top-2 left-2 w-8 h-8 bg-purple-300 rounded-full opacity-60"></div>
          <div className="absolute top-4 right-4 w-6 h-6 bg-blue-300 rounded-full opacity-60"></div>
          <div className="absolute bottom-2 left-4 w-4 h-4 bg-pink-300 rounded-full opacity-60"></div>
          <div className="absolute bottom-4 right-2 w-5 h-5 bg-indigo-300 rounded-full opacity-60"></div>
        </div>
      );
    } else if (theme.id === 'theme-two') {
      return (
        <div className="w-full h-32 bg-gradient-to-br from-gray-900 to-gray-800 rounded-lg border-2 border-gray-700 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-gray-800/50 to-gray-700/50"></div>
          <div className="absolute top-2 left-2 w-8 h-8 bg-green-400 rounded-full opacity-60"></div>
          <div className="absolute top-4 right-4 w-6 h-6 bg-blue-400 rounded-full opacity-60"></div>
          <div className="absolute bottom-2 left-4 w-4 h-4 bg-yellow-400 rounded-full opacity-60"></div>
          <div className="absolute bottom-4 right-2 w-5 h-5 bg-red-400 rounded-full opacity-60"></div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6">
      <div className="space-y-2">
        <h3 className="text-lg font-semibold flex items-center gap-2">
          <Palette className="h-5 w-5" />
          Site Theme Selection
        </h3>
        <p className="text-sm text-muted-foreground">
          Choose the visual theme for your entire platform. This will change the UI design for all users.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {THEMES.filter(theme => theme.isAvailable).map((theme) => (
          <Card 
            key={theme.id} 
            className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
              selectedTheme === theme.id 
                ? (theme.id === 'theme-two' ? 'ring-2 ring-purple-500 border-purple-500' : 'ring-2 ring-blue-500 border-blue-500') 
                : 'hover:border-gray-300'
            }`}
            onClick={() => handleThemeSelect(theme.id)}
          >
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <CardTitle className="text-lg">{theme.name}</CardTitle>
                  {selectedTheme === theme.id && (
                    <Badge variant="default" className={theme.id === 'theme-two' ? 'bg-purple-600' : 'bg-blue-500'}>
                      <Check className="h-3 w-3 mr-1" />
                      Active
                    </Badge>
                  )}
                </div>
                
              </div>
              <CardDescription className="text-sm">
                {theme.description}
              </CardDescription>
            </CardHeader>
            <CardContent className="pt-0">
              <div className="space-y-3">
                {getThemePreview(theme)}
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Eye className="h-4 w-4" />
                    Preview
                  </div>
                  <Button 
                    variant={selectedTheme === theme.id ? "default" : "outline"}
                    size="sm"
                    disabled={saving}
                    className={
                      selectedTheme === theme.id
                        ? (theme.id === 'theme-two'
                            ? 'rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600'
                            : 'rounded-full')
                        : 'rounded-full'
                    }
                    onClick={(e) => {
                      e.stopPropagation();
                      handleThemeSelect(theme.id);
                    }}
                  >
                    {saving && selectedTheme === theme.id ? 'Saving...' : 
                     selectedTheme === theme.id ? 'Active' : 'Select'}
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="flex items-start gap-3">
          <div className="w-5 h-5 bg-blue-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
            <Check className="h-3 w-3 text-white" />
          </div>
          <div className="space-y-1">
            <h4 className="font-medium text-blue-900">Theme Change Notice</h4>
            <p className="text-sm text-blue-800">
              When you change the theme, it will immediately apply to your entire platform. 
              All users will see the new design. You can always switch back to any theme at any time.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
