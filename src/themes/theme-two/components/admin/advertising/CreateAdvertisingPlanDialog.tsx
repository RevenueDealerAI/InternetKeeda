import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { toast } from 'sonner';
import { useCreateAdvertisingPlan, type AdvertisingPlanInput } from '@/lib/api/advertisingPlans';

interface CreateAdvertisingPlanDialogProps { open: boolean; onOpenChange: (open: boolean) => void; }

type AdvertisingPlanInputFlexible = Omit<AdvertisingPlanInput, 'price' | 'duration' | 'maxListings'> & { price: number | ""; duration: number | ""; maxListings?: number | ""; };

export function CreateAdvertisingPlanDialog({ open, onOpenChange }: CreateAdvertisingPlanDialogProps) {
  const [formData, setFormData] = useState<AdvertisingPlanInputFlexible>({
    name: '', slug: '', description: '', price: "", currency: 'USD', duration: "",
    features: [], isActive: true, isPopular: false, placement: 'basic', maxListings: "",
    analytics: false, socialPromotion: false, newsletterFeature: false, prioritySupport: false, customIntegrations: false,
  });
  const [newFeature, setNewFeature] = useState('');
  const createPlan = useCreateAdvertisingPlan();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.features.length === 0) { toast.error('Please add at least one feature'); return; }
    const submitData: AdvertisingPlanInput = {
      ...formData,
      price: formData.price === "" ? 0 : Number(formData.price),
      duration: formData.duration === "" ? 1 : Number(formData.duration),
      maxListings: formData.maxListings === "" ? 1 : Number(formData.maxListings),
    };
    try { await createPlan.mutateAsync(submitData); toast.success('Advertising plan created successfully'); onOpenChange(false); resetForm(); }
    catch (error) { toast.error(error instanceof Error ? error.message : 'Failed to create advertising plan'); }
  };

  const resetForm = () => {
    setFormData({ name: '', slug: '', description: '', price: "", currency: 'USD', duration: "", features: [], isActive: true, isPopular: false, placement: 'basic', maxListings: "", analytics: false, socialPromotion: false, newsletterFeature: false, prioritySupport: false, customIntegrations: false });
    setNewFeature('');
  };

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
  const handleNameChange = (name: string) => setFormData(prev => ({ ...prev, name, slug: generateSlug(name) }));
  const addFeature = () => { if (!newFeature.trim()) return; setFormData(prev => ({ ...prev, features: [...prev.features, newFeature.trim()] })); setNewFeature(''); };
  const removeFeature = (index: number) => setFormData(prev => ({ ...prev, features: prev.features.filter((_, i) => i !== index) }));
  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="theme-two max-w-2xl rounded-2xl overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Create Advertising Plan</DialogTitle>
          <DialogDescription>Create a new advertising plan for customers to purchase.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[80vh] modal-scroll px-6 pb-6 overflow-y-auto">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input id="name" value={formData.name} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g., Premium Plan" required className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" value={formData.slug} onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))} placeholder="premium-plan" pattern="^[a-z0-9-]+$" required className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe what this plan offers..." required className="rounded-xl focus-visible:ring-2 focus-visible:ring-purple-500" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input id="price" type="number" min="0" step="0.01" value={formData.price === 0 ? "" : formData.price} onChange={(e) => { const val = e.target.value; setFormData(prev => ({ ...prev, price: val === "" ? "" : Number(val) })); }} required className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency} onValueChange={(currency) => setFormData(prev => ({ ...prev, currency }))}>
                  <SelectTrigger className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="USD">USD</SelectItem>
                    <SelectItem value="EUR">EUR</SelectItem>
                    <SelectItem value="GBP">GBP</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="duration">Duration (days)</Label>
                <Input id="duration" type="number" min="1" value={formData.duration === 0 ? "" : formData.duration} onChange={(e) => { const val = e.target.value; setFormData(prev => ({ ...prev, duration: val === "" ? "" : Number(val) })); }} required className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="placement">Placement Type</Label>
                <Select value={formData.placement} onValueChange={(placement: 'basic' | 'featured' | 'premium' | 'sponsored') => setFormData(prev => ({ ...prev, placement }))}>
                  <SelectTrigger className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="basic">Basic</SelectItem>
                    <SelectItem value="featured">Featured</SelectItem>
                    <SelectItem value="premium">Premium</SelectItem>
                    <SelectItem value="sponsored">Sponsored</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="maxListings">Max Listings</Label>
                <Input id="maxListings" type="number" min="1" value={formData.maxListings === 0 ? "" : formData.maxListings} onChange={(e) => { const val = e.target.value; setFormData(prev => ({ ...prev, maxListings: val === "" ? "" : Number(val) })); }} required className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Features</Label>
              <div className="flex gap-2">
                <Input value={newFeature} onChange={(e) => setNewFeature(e.target.value)} placeholder="Add a feature..." onKeyPress={handleKeyPress} className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
                <Button type="button" onClick={addFeature} size="sm" className="rounded-full bg-purple-600 text-white hover:bg-purple-700">
                  <Plus className="w-4 h-4" />
                </Button>
              </div>
              <div className="flex flex-wrap gap-2 mt-2">
                {formData.features.map((feature, index) => (
                  <Badge key={index} variant="secondary" className="gap-1 rounded-full">
                    {feature}
                    <X className="w-3 h-3 cursor-pointer" onClick={() => removeFeature(index)} />
                  </Badge>
                ))}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="analytics">Analytics Included</Label>
                <Switch id="analytics" className="data-[state=checked]:bg-purple-600" checked={formData.analytics} onCheckedChange={(analytics) => setFormData(prev => ({ ...prev, analytics }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="socialPromotion">Social Promotion</Label>
                <Switch id="socialPromotion" className="data-[state=checked]:bg-purple-600" checked={formData.socialPromotion} onCheckedChange={(socialPromotion) => setFormData(prev => ({ ...prev, socialPromotion }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="newsletterFeature">Newsletter Feature</Label>
                <Switch id="newsletterFeature" className="data-[state=checked]:bg-purple-600" checked={formData.newsletterFeature} onCheckedChange={(newsletterFeature) => setFormData(prev => ({ ...prev, newsletterFeature }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="prioritySupport">Priority Support</Label>
                <Switch id="prioritySupport" className="data-[state=checked]:bg-purple-600" checked={formData.prioritySupport} onCheckedChange={(prioritySupport) => setFormData(prev => ({ ...prev, prioritySupport }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="customIntegrations">Custom Integrations</Label>
                <Switch id="customIntegrations" className="data-[state=checked]:bg-purple-600" checked={formData.customIntegrations} onCheckedChange={(customIntegrations) => setFormData(prev => ({ ...prev, customIntegrations }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isPopular">Mark as Popular</Label>
                <Switch id="isPopular" className="data-[state=checked]:bg-purple-600" checked={formData.isPopular} onCheckedChange={(isPopular) => setFormData(prev => ({ ...prev, isPopular }))} />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">Cancel</Button>
              <Button type="submit" disabled={createPlan.isPending} className="rounded-full bg-purple-600 text-white hover:bg-purple-700">
                {createPlan.isPending ? 'Creating...' : 'Create Plan'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}


