import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { SiteConfig } from '@/types/siteConfig';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AlertCircle, Plus, Trash2, Eye, EyeOff } from 'lucide-react';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AdSenseSettingsProps {
  config: SiteConfig;
  onSave: (updates: Partial<SiteConfig>) => Promise<void>;
}

const AD_POSITIONS = [
  { value: 'header', label: 'Header' },
  { value: 'sidebar', label: 'Sidebar' },
  { value: 'footer', label: 'Footer' },
  { value: 'content-top', label: 'Content Top' },
  { value: 'content-bottom', label: 'Content Bottom' },
] as const;

export default function AdSenseSettings({ config, onSave }: AdSenseSettingsProps) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    adsenseEnabled: config?.adsenseEnabled || false,
    adsensePublisherId: config?.adsensePublisherId || '',
    adsenseAutoAds: config?.adsenseAutoAds !== undefined ? config.adsenseAutoAds : true,
    adsenseAdUnits: config?.adsenseAdUnits || [],
  });

  const [newAdUnit, setNewAdUnit] = useState({
    adUnitId: '',
    position: 'header' as 'header' | 'sidebar' | 'footer' | 'content-top' | 'content-bottom',
  });

  useEffect(() => {
    if (config) {
      setFormData({
        adsenseEnabled: config.adsenseEnabled || false,
        adsensePublisherId: config.adsensePublisherId || '',
        adsenseAutoAds: config.adsenseAutoAds !== undefined ? config.adsenseAutoAds : true,
        adsenseAdUnits: config.adsenseAdUnits || [],
      });
    }
  }, [config]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleToggleAutoAds = (checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      adsenseAutoAds: checked
    }));
  };

  const handleAddAdUnit = () => {
    if (!newAdUnit.adUnitId.trim() || !newAdUnit.position) {
      return;
    }

    const adUnit = {
      id: `ad-${Date.now()}`,
      adUnitId: newAdUnit.adUnitId.trim(),
      position: newAdUnit.position,
      enabled: true,
    };

    setFormData(prev => ({
      ...prev,
      adsenseAdUnits: [...prev.adsenseAdUnits, adUnit]
    }));

    setNewAdUnit({
      adUnitId: '',
      position: 'header',
    });
  };

  const handleDeleteAdUnit = (id: string) => {
    setFormData(prev => ({
      ...prev,
      adsenseAdUnits: prev.adsenseAdUnits.filter(unit => unit.id !== id)
    }));
  };

  const handleToggleAdUnit = (id: string) => {
    setFormData(prev => ({
      ...prev,
      adsenseAdUnits: prev.adsenseAdUnits.map(unit =>
        unit.id === id ? { ...unit, enabled: !unit.enabled } : unit
      )
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (formData.adsenseEnabled && formData.adsensePublisherId) {
      const publisherIdPattern = /^ca-pub-[0-9]{10,16}$/;
      if (!publisherIdPattern.test(formData.adsensePublisherId)) {
        alert('Invalid AdSense Publisher ID. Must be in format: ca-pub-XXXXXXXXXX');
        return;
      }
    }

    setSaving(true);
    try {
      await onSave(formData);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <Alert className="mb-4 border-blue-500 text-blue-800 bg-blue-50">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          Configure Google AdSense to monetize your website. You need a Google AdSense account and Publisher ID to use this feature.
        </AlertDescription>
      </Alert>

      <div className="space-y-4">
        <div className="flex items-center justify-between p-4 border rounded-lg">
          <div className="space-y-0.5">
            <Label htmlFor="adsenseEnabled" className="text-base font-medium">
              Enable AdSense
            </Label>
            <p className="text-sm text-muted-foreground">
              Turn on Google AdSense integration
            </p>
          </div>
          <input
            type="checkbox"
            id="adsenseEnabled"
            name="adsenseEnabled"
            checked={formData.adsenseEnabled}
            onChange={handleChange}
            className="h-4 w-4"
          />
        </div>

        {formData.adsenseEnabled && (
          <>
            <div className="space-y-2">
              <Label htmlFor="adsensePublisherId">AdSense Publisher ID</Label>
              <Input
                id="adsensePublisherId"
                name="adsensePublisherId"
                value={formData.adsensePublisherId}
                onChange={handleChange}
                placeholder="ca-pub-1234567890123456"
                required={formData.adsenseEnabled}
              />
              <p className="text-xs text-muted-foreground">
                Your AdSense Publisher ID (format: ca-pub-XXXXXXXXXX)
              </p>
            </div>

            <div className="flex items-center justify-between p-4 border rounded-lg">
              <div className="space-y-0.5">
                <Label htmlFor="adsenseAutoAds" className="text-base font-medium">
                  Enable Auto Ads
                </Label>
                <p className="text-sm text-muted-foreground">
                  Let Google automatically place ads throughout your site
                </p>
              </div>
              <input
                type="checkbox"
                id="adsenseAutoAds"
                checked={formData.adsenseAutoAds}
                onChange={(e) => handleToggleAutoAds(e.target.checked)}
                className="h-4 w-4"
              />
            </div>

            <div className="space-y-4 pt-4 border-t">
              <div>
                <h3 className="text-lg font-medium mb-4">Manual Ad Units</h3>
                <p className="text-sm text-muted-foreground mb-4">
                  Add specific ad units to place ads in particular locations on your site.
                </p>

                <div className="flex flex-col md:flex-row gap-3 mb-4 w-full">
                  <div className="w-full md:flex-1">
                    <Input
                      placeholder="Ad Unit ID (e.g., 1234567890)"
                      value={newAdUnit.adUnitId}
                      onChange={(e) => setNewAdUnit(prev => ({ ...prev, adUnitId: e.target.value }))}
                      className="w-full"
                    />
                  </div>
                  <div className="flex gap-2 w-full md:w-auto">
                    <div className="flex-1 md:w-[180px] md:flex-none">
                      <Select
                        value={newAdUnit.position}
                        onValueChange={(value: typeof newAdUnit.position) =>
                          setNewAdUnit(prev => ({ ...prev, position: value }))
                        }
                      >
                        <SelectTrigger className="w-full">
                          <SelectValue placeholder="Position" />
                        </SelectTrigger>
                        <SelectContent>
                          {AD_POSITIONS.map((pos) => (
                            <SelectItem key={pos.value} value={pos.value}>
                              {pos.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <Button
                      type="button"
                      onClick={handleAddAdUnit}
                      disabled={!newAdUnit.adUnitId.trim()}
                      className="flex-shrink-0"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>
                </div>

                {formData.adsenseAdUnits.length > 0 ? (
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ad Unit ID</TableHead>
                          <TableHead>Position</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="w-[100px]">Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {formData.adsenseAdUnits.map((unit) => (
                          <TableRow key={unit.id}>
                            <TableCell className="font-mono text-sm">
                              {unit.adUnitId}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline">
                                {AD_POSITIONS.find(p => p.value === unit.position)?.label || unit.position}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <Badge className={cn(
                                unit.enabled
                                  ? "bg-green-50 text-green-700 border-green-200"
                                  : "bg-gray-50 text-gray-700 border-gray-200"
                              )}>
                                {unit.enabled ? 'Enabled' : 'Disabled'}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              <div className="flex gap-2">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleToggleAdUnit(unit.id)}
                                >
                                  {unit.enabled ? (
                                    <EyeOff className="h-4 w-4" />
                                  ) : (
                                    <Eye className="h-4 w-4" />
                                  )}
                                </Button>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleDeleteAdUnit(unit.id)}
                                >
                                  <Trash2 className="h-4 w-4" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                ) : (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No manual ad units added yet.</p>
                    <p className="text-sm mt-1">Add ad units above to place ads in specific locations.</p>
                  </div>
                )}
              </div>
            </div>
          </>
        )}
      </div>

      <Button type="submit" disabled={saving}>
        {saving ? 'Saving...' : 'Save AdSense Settings'}
      </Button>
    </form>
  );
}




