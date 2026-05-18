import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { X, Plus } from "lucide-react";
import { toast } from 'sonner';
import { useUpdateAdvertisingPlan, type AdvertisingPlan, type AdvertisingPlanInput } from '@/lib/api/advertisingPlans';

type AdvertisingPlanInputFlexible = Partial<Omit<AdvertisingPlanInput, 'price' | 'duration' | 'maxListings'>> & {
  price?: number | "";
  duration?: number | "";
  maxListings?: number | "";
};

interface EditAdvertisingPlanDialogProps {
  plan: AdvertisingPlan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditAdvertisingPlanDialog({ plan, open, onOpenChange }: EditAdvertisingPlanDialogProps) {
  const [formData, setFormData] = useState<AdvertisingPlanInputFlexible>({});
  const [newFeature, setNewFeature] = useState('');
  const updatePlan = useUpdateAdvertisingPlan();

  useEffect(() => {
    if (plan) {
      setFormData({
        name: plan.name,
        slug: plan.slug,
        description: plan.description,
        price: plan.price,
        currency: plan.currency,
        duration: plan.duration,
        features: [...plan.features],
        isActive: plan.isActive,
        isPopular: plan.isPopular,
        placement: plan.placement,
        maxListings: plan.maxListings,
        analytics: plan.analytics,
        socialPromotion: plan.socialPromotion,
        newsletterFeature: plan.newsletterFeature,
        prioritySupport: plan.prioritySupport,
        customIntegrations: plan.customIntegrations,
      });
    }
  }, [plan]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.features || formData.features.length === 0) {
      toast.error('Please add at least one feature');
      return;
    }
    const submitData: AdvertisingPlanInput = {
      name: formData.name ?? plan.name,
      slug: formData.slug ?? plan.slug,
      description: formData.description ?? plan.description,
      features: formData.features ?? plan.features,
      price: formData.price === "" ? 0 : Number(formData.price ?? plan.price),
      duration: formData.duration === "" ? 1 : Number(formData.duration ?? plan.duration),
      currency: formData.currency ?? plan.currency,
      isActive: formData.isActive ?? plan.isActive,
      isPopular: formData.isPopular ?? plan.isPopular,
      stripePriceId: formData.stripePriceId ?? plan.stripePriceId,
      paypalPlanId: formData.paypalPlanId ?? plan.paypalPlanId,
      placement: formData.placement ?? plan.placement,
      maxListings: formData.maxListings === "" ? 1 : Number(formData.maxListings ?? plan.maxListings),
      analytics: formData.analytics ?? plan.analytics,
      socialPromotion: formData.socialPromotion ?? plan.socialPromotion,
      newsletterFeature: formData.newsletterFeature ?? plan.newsletterFeature,
      prioritySupport: formData.prioritySupport ?? plan.prioritySupport,
      customIntegrations: formData.customIntegrations ?? plan.customIntegrations,
    };
    try {
      await updatePlan.mutateAsync({ id: plan._id, data: submitData });
      toast.success('Advertising plan updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update advertising plan');
    }
  };

  const generateSlug = (name: string) => name.toLowerCase().replace(/[^a-z0-9\s-]/g, '').replace(/\s+/g, '-').replace(/-+/g, '-').trim();
  const handleNameChange = (name: string) => setFormData(prev => ({ ...prev, name, slug: generateSlug(name) }));
  const addFeature = () => { if (!newFeature.trim()) return; setFormData(prev => ({ ...prev, features: [...(prev.features || []), newFeature.trim()] })); setNewFeature(''); };
  const removeFeature = (index: number) => setFormData(prev => ({ ...prev, features: prev.features?.filter((_, i) => i !== index) || [] }));
  const handleKeyPress = (e: React.KeyboardEvent) => { if (e.key === 'Enter') { e.preventDefault(); addFeature(); } };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="theme-two max-w-2xl rounded-2xl overflow-hidden p-0">
        <DialogHeader className="px-6 pt-6 pb-2">
          <DialogTitle>Edit Advertising Plan</DialogTitle>
          <DialogDescription>Update the advertising plan details.</DialogDescription>
        </DialogHeader>
        <div className="max-h-[80vh] overflow-y-auto modal-scroll px-6 pb-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="name">Plan Name</Label>
                <Input id="name" value={formData.name || ''} onChange={(e) => handleNameChange(e.target.value)} placeholder="e.g., Premium Plan" required className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="slug">Slug</Label>
                <Input id="slug" value={formData.slug || ''} onChange={(e) => setFormData(prev => ({ ...prev, slug: e.target.value }))} placeholder="premium-plan" pattern="^[a-z0-9-]+$" required className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" value={formData.description || ''} onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))} placeholder="Describe what this plan offers..." required className="rounded-xl focus-visible:ring-2 focus-visible:ring-purple-500" />
            </div>

            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="price">Price</Label>
                <Input id="price" type="number" min="0" step="0.01" value={formData.price === 0 ? "" : formData.price} onChange={(e) => { const val = e.target.value; setFormData(prev => ({ ...prev, price: val === "" ? "" : Number(val) })); }} required className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="currency">Currency</Label>
                <Select value={formData.currency || 'USD'} onValueChange={(currency) => setFormData(prev => ({ ...prev, currency }))}>
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
                <Select value={formData.placement || 'basic'} onValueChange={(placement: 'basic' | 'featured' | 'premium' | 'sponsored') => setFormData(prev => ({ ...prev, placement }))}>
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
                {formData.features?.map((feature, index) => (
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
                <Switch id="analytics" className="data-[state=checked]:bg-purple-600" checked={formData.analytics || false} onCheckedChange={(analytics) => setFormData(prev => ({ ...prev, analytics }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="socialPromotion">Social Promotion</Label>
                <Switch id="socialPromotion" className="data-[state=checked]:bg-purple-600" checked={formData.socialPromotion || false} onCheckedChange={(socialPromotion) => setFormData(prev => ({ ...prev, socialPromotion }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="newsletterFeature">Newsletter Feature</Label>
                <Switch id="newsletterFeature" className="data-[state=checked]:bg-purple-600" checked={formData.newsletterFeature || false} onCheckedChange={(newsletterFeature) => setFormData(prev => ({ ...prev, newsletterFeature }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="prioritySupport">Priority Support</Label>
                <Switch id="prioritySupport" className="data-[state=checked]:bg-purple-600" checked={formData.prioritySupport || false} onCheckedChange={(prioritySupport) => setFormData(prev => ({ ...prev, prioritySupport }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="customIntegrations">Custom Integrations</Label>
                <Switch id="customIntegrations" className="data-[state=checked]:bg-purple-600" checked={formData.customIntegrations || false} onCheckedChange={(customIntegrations) => setFormData(prev => ({ ...prev, customIntegrations }))} />
              </div>
              <div className="flex items-center justify-between">
                <Label htmlFor="isPopular">Mark as Popular</Label>
                <Switch id="isPopular" className="data-[state=checked]:bg-purple-600" checked={formData.isPopular || false} onCheckedChange={(isPopular) => setFormData(prev => ({ ...prev, isPopular }))} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="stripePriceId">Stripe Price ID (optional)</Label>
                <Input id="stripePriceId" value={formData.stripePriceId || ''} onChange={(e) => setFormData(prev => ({ ...prev, stripePriceId: e.target.value }))} placeholder="price_..." className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="paypalPlanId">PayPal Plan ID (optional)</Label>
                <Input id="paypalPlanId" value={formData.paypalPlanId || ''} onChange={(e) => setFormData(prev => ({ ...prev, paypalPlanId: e.target.value }))} placeholder="P-..." className="rounded-full focus-visible:ring-2 focus-visible:ring-purple-500" />
              </div>
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)} className="rounded-full">Cancel</Button>
              <Button type="submit" disabled={updatePlan.isPending} className="rounded-full bg-purple-600 text-white hover:bg-purple-700">
                {updatePlan.isPending ? 'Saving...' : 'Save Changes'}
              </Button>
            </DialogFooter>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
}


