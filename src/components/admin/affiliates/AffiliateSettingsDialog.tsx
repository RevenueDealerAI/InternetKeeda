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
import { toast } from "sonner";
import { Loader2, DollarSign, Percent, Clock, Save } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AffiliateSettingsDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

interface Settings {
    commissionRate: number;
    minimumPayout: number;
    cookieDurationDays: number;
}

export function AffiliateSettingsDialog({ open, onOpenChange }: AffiliateSettingsDialogProps) {
    const [loading, setLoading] = useState(false);
    const [saving, setSaving] = useState(false);
    const [settings, setSettings] = useState<Settings>({
        commissionRate: 0.20,
        minimumPayout: 50,
        cookieDurationDays: 30
    });

    useEffect(() => {
        if (open) {
            fetchSettings();
        }
    }, [open]);

    const fetchSettings = async () => {
        setLoading(true);
        try {
            const res = await fetch('/api/admin/affiliates/settings');
            if (res.ok) {
                const data = await res.json();
                setSettings({
                    commissionRate: data.commissionRate,
                    minimumPayout: data.minimumPayout,
                    cookieDurationDays: data.cookieDurationDays
                });
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to load settings');
        } finally {
            setLoading(false);
        }
    };

    const handleSave = async () => {
        setSaving(true);
        try {
            const res = await fetch('/api/admin/affiliates/settings', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(settings)
            });

            if (res.ok) {
                toast.success('Configuration saved successfully');
                onOpenChange(false);
            } else {
                throw new Error('Failed to update');
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to update settings');
        } finally {
            setSaving(false);
        }
    };

    const handleChange = (field: keyof Settings, value: string) => {
        const numValue = parseFloat(value);
        setSettings(prev => ({
            ...prev,
            [field]: isNaN(numValue) ? 0 : numValue
        }));
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[500px] p-0 overflow-hidden bg-white border border-gray-100 shadow-2xl rounded-2xl">
                <div className="p-6 bg-gradient-to-br from-purple-50 to-white border-b border-purple-100">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                            Affiliate Configuration
                        </DialogTitle>
                        <DialogDescription className="text-gray-500 mt-1">
                            Manage global reward settings for your affiliate program.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                {loading ? (
                    <div className="flex justify-center items-center h-64">
                        <Loader2 className="animate-spin h-8 w-8 text-purple-600" />
                    </div>
                ) : (
                    <div className="p-6 space-y-6">

                        {/* Commission Rate */}
                        <div className="space-y-3">
                            <Label htmlFor="commission" className="text-sm font-medium text-gray-700">
                                Commission Rate
                            </Label>
                            <div className="relative group">
                                <Percent className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-500 group-focus-within:text-purple-600 transition-colors" />
                                <Input
                                    id="commission"
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    max="1"
                                    value={settings.commissionRate}
                                    onChange={(e) => handleChange('commissionRate', e.target.value)}
                                    className="pl-10 h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl transition-all"
                                    placeholder="0.20"
                                />
                            </div>
                            <div className="flex items-center justify-between text-xs text-gray-500 px-1">
                                <span>Value between 0.0 and 1.0</span>
                                <span className="font-medium text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full">
                                    {(settings.commissionRate * 100).toFixed(0)}% per sale
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4">
                            {/* Minimum Payout */}
                            <div className="space-y-3">
                                <Label htmlFor="payout" className="text-sm font-medium text-gray-700">
                                    Min Payout
                                </Label>
                                <div className="relative group">
                                    <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-green-600 group-focus-within:text-green-700 transition-colors" />
                                    <Input
                                        id="payout"
                                        type="number"
                                        min="0"
                                        value={settings.minimumPayout}
                                        onChange={(e) => handleChange('minimumPayout', e.target.value)}
                                        className="pl-10 h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl transition-all"
                                    />
                                </div>
                            </div>

                            {/* Cookie Duration */}
                            <div className="space-y-3">
                                <Label htmlFor="cookie" className="text-sm font-medium text-gray-700">
                                    Cookie Duration
                                </Label>
                                <div className="relative group">
                                    <Clock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-orange-500 group-focus-within:text-orange-600 transition-colors" />
                                    <Input
                                        id="cookie"
                                        type="number"
                                        min="1"
                                        value={settings.cookieDurationDays}
                                        onChange={(e) => handleChange('cookieDurationDays', e.target.value)}
                                        className="pl-10 h-11 border-gray-200 focus:border-purple-500 focus:ring-purple-500 rounded-xl transition-all"
                                    />
                                    <span className="absolute right-3 top-1/2 transform -translate-y-1/2 text-xs text-gray-400 font-medium pointer-events-none">
                                        Days
                                    </span>
                                </div>
                            </div>
                        </div>

                    </div>
                )}

                <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={saving}
                        className="hover:bg-gray-200 text-gray-600"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={saving}
                        className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all rounded-lg px-6"
                    >
                        {saving ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                        Save Changes
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
