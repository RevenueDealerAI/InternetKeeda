import { useState } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Loader2, Coins, ArrowRightLeft, FileText, CheckCircle2 } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AdjustBalanceDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    affiliateId: string;
    currentBalance: number;
    onSuccess: (newBalance: number) => void;
}

export function AdjustBalanceDialog({ open, onOpenChange, affiliateId, currentBalance, onSuccess }: AdjustBalanceDialogProps) {
    const [loading, setLoading] = useState(false);
    const [amount, setAmount] = useState('');
    const [type, setType] = useState<'bonus' | 'adjustment'>('bonus');
    const [description, setDescription] = useState('');

    const handleSave = async () => {
        if (!amount || isNaN(parseFloat(amount))) {
            toast.error("Please enter a valid amount");
            return;
        }

        setLoading(true);
        try {
            const finalAmount = parseFloat(amount) * 100; // Convert to cents

            const res = await fetch('/api/admin/affiliates/adjust', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    affiliateProfileId: affiliateId,
                    amount: finalAmount,
                    type,
                    description
                })
            });

            if (res.ok) {
                const data = await res.json();
                toast.success('Balance adjusted successfully');
                onSuccess(data.newBalance);
                onOpenChange(false);
                setAmount('');
                setDescription('');
            } else {
                const err = await res.json();
                throw new Error(err.error || 'Failed to update');
            }
        } catch (error) {
            console.error(error);
            toast.error(error instanceof Error ? error.message : 'Failed to adjust balance');
        } finally {
            setLoading(false);
        }
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-[450px] p-0 overflow-hidden bg-white border border-gray-100 shadow-2xl rounded-2xl">
                <div className="p-6 bg-gradient-to-br from-purple-50 to-white border-b border-purple-100">
                    <DialogHeader>
                        <DialogTitle className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-purple-600 to-pink-600">
                            Adjust Balance
                        </DialogTitle>
                        <DialogDescription className="text-gray-500 mt-1">
                            Manually modify the affiliate's unpaid balance.
                        </DialogDescription>
                    </DialogHeader>
                </div>

                <div className="p-6 space-y-5">
                    {/* Current Balance Display */}
                    <div className="bg-gray-50 rounded-xl p-4 border border-gray-100 flex items-center justify-between">
                        <span className="text-sm font-medium text-gray-500">Current Balance</span>
                        <span className="text-2xl font-bold text-gray-900 font-mono">
                            ${(currentBalance / 100).toFixed(2)}
                        </span>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase text-gray-500">Action Type</Label>
                            <Select value={type} onValueChange={(v: any) => setType(v)}>
                                <SelectTrigger className="h-11 rounded-xl border-gray-200 focus:ring-purple-500">
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="bonus">Bonus (Add)</SelectItem>
                                    <SelectItem value="adjustment">Adjustment</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="space-y-2">
                            <Label className="text-xs font-semibold uppercase text-gray-500">Amount ($)</Label>
                            <div className="relative">
                                <Coins className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-purple-500" />
                                <Input
                                    type="number"
                                    step="0.01"
                                    placeholder="0.00"
                                    className="pl-9 h-11 rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500"
                                    value={amount}
                                    onChange={(e) => setAmount(e.target.value)}
                                />
                            </div>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <Label className="text-xs font-semibold uppercase text-gray-500">Reason / Internal Note</Label>
                        <div className="relative">
                            <FileText className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                            <Textarea
                                placeholder="e.g. Compensation for missed tracking..."
                                className="pl-9 min-h-[80px] rounded-xl border-gray-200 focus:border-purple-500 focus:ring-purple-500 resize-none"
                                value={description}
                                onChange={(e) => setDescription(e.target.value)}
                            />
                        </div>
                    </div>
                </div>

                <div className="p-6 bg-gray-50 flex justify-end gap-3 border-t border-gray-100">
                    <Button
                        variant="ghost"
                        onClick={() => onOpenChange(false)}
                        disabled={loading}
                        className="hover:bg-gray-200 text-gray-600 rounded-lg"
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleSave}
                        disabled={loading}
                        className="bg-gradient-to-r from-purple-600 to-pink-500 hover:from-purple-700 hover:to-pink-600 text-white shadow-md hover:shadow-lg transition-all rounded-lg px-6"
                    >
                        {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <CheckCircle2 className="mr-2 h-4 w-4" />}
                        Apply Adjustment
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}
