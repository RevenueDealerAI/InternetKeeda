'use client';

import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Loader2, Download, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Settings } from 'lucide-react';
import { AffiliateSettingsDialog } from '@/components/admin/affiliates/AffiliateSettingsDialog';
import { AdjustBalanceDialog } from '@/components/admin/affiliates/AdjustBalanceDialog';
import { useDemoMode } from '@/hooks/useDemoMode';

export default function AffiliatesPage() {
    const [affiliates, setAffiliates] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchQuery, setSearchQuery] = useState('');
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [adjustOpen, setAdjustOpen] = useState(false);
    const [selectedAffiliate, setSelectedAffiliate] = useState<any>(null);
    const { blockIfDemo } = useDemoMode();

    useEffect(() => {
        fetchAffiliates();
    }, []);

    const fetchAffiliates = async () => {
        try {
            const res = await fetch('/api/admin/affiliates');
            const json = await res.json();
            if (Array.isArray(json)) {
                setAffiliates(json);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const [processingId, setProcessingId] = useState<string | null>(null);

    const handlePayout = async (affiliateId: string, _id: string, amount: number) => {
        if (blockIfDemo()) return;

        if (!confirm(`Are you sure you want to mark $${(amount / 100).toFixed(2)} as PAID?`)) return;

        setProcessingId(_id);
        try {
            const res = await fetch('/api/admin/affiliates/payout', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    affiliateId: _id,
                    amount: amount
                })
            });

            if (res.ok) {
                setAffiliates(prev => prev.map(a => {
                    if (a._id === _id) {
                        return { ...a, unpaidBalance: 0 };
                    }
                    return a;
                }));
            } else {
                alert("Failed to process payout");
            }
        } catch (error) {
            console.error(error);
            alert("Error processing payout");
        } finally {
            setProcessingId(null);
        }
    };

    const filteredAffiliates = affiliates.filter(aff =>
        (aff.user?.firstName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (aff.user?.lastName?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (aff.user?.email?.toLowerCase() || '').includes(searchQuery.toLowerCase()) ||
        (aff.uniqueCode?.toLowerCase() || '').includes(searchQuery.toLowerCase())
    );

    if (loading) {
        return (
            <div className="min-h-[calc(100vh-72px)] pt-20">
                <div className="flex items-center justify-center h-96">
                    <Loader2 className="animate-spin h-8 w-8 text-purple-600" />
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-[calc(100vh-72px)] pt-8">
            <div className="space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                    <div>
                        <h2 className="text-2xl font-semibold tracking-tight">Affiliate Management</h2>
                        <p className="text-sm text-gray-500">
                            Monitor affiliate performance and process payouts
                        </p>
                    </div>
                    {/* Placeholder for export if needed later */}
                    <div className="flex w-full md:w-auto items-center gap-4">
                        <Button variant="outline" className="gap-2 rounded-full" onClick={() => setSettingsOpen(true)}>
                            <Settings className="h-4 w-4" />
                            Configuration
                        </Button>
                    </div>
                </div>

                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1 w-full max-w-md">
                        <div className="relative flex-1">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                            <Input
                                placeholder="Search affiliates..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="pl-9 w-full rounded-full focus-visible:ring-2 focus-visible:ring-purple-500"
                            />
                        </div>
                    </div>
                </div>

                <div className="bg-white shadow-sm rounded-2xl border overflow-hidden">
                    <div className="h-[600px] overflow-auto">
                        <Table className="min-w-[800px]">
                            <TableHeader className="sticky top-0 bg-purple-50 z-10">
                                <TableRow>
                                    <TableHead className="text-purple-700 font-semibold">User</TableHead>
                                    <TableHead className="text-purple-700 font-semibold">Code</TableHead>
                                    <TableHead className="text-purple-700 font-semibold">Total Earnings</TableHead>
                                    <TableHead className="text-purple-700 font-semibold">Unpaid Balance</TableHead>
                                    <TableHead className="text-purple-700 font-semibold">Status</TableHead>
                                    <TableHead className="text-purple-700 font-semibold">Actions</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {filteredAffiliates.length === 0 && (
                                    <TableRow>
                                        <TableCell colSpan={6} className="text-center py-8 text-gray-500">No affiliates found</TableCell>
                                    </TableRow>
                                )}
                                {filteredAffiliates.map((aff) => (
                                    <TableRow key={aff._id}>
                                        <TableCell className="flex items-center gap-2">
                                            <Avatar className="h-8 w-8">
                                                <AvatarImage src={aff.user?.profileImageUrl} />
                                                <AvatarFallback>{aff.user?.firstName?.[0] || 'U'}</AvatarFallback>
                                            </Avatar>
                                            <div className="flex flex-col">
                                                <span className="font-medium">{aff.user?.firstName} {aff.user?.lastName}</span>
                                                <span className="text-xs text-muted-foreground">{aff.user?.email}</span>
                                            </div>
                                        </TableCell>
                                        <TableCell className="font-mono">{aff.uniqueCode}</TableCell>
                                        <TableCell>${(aff.totalEarnings / 100).toFixed(2)}</TableCell>
                                        <TableCell className="text-green-600 font-bold">${(aff.unpaidBalance / 100).toFixed(2)}</TableCell>
                                        <TableCell>
                                            <span className={`px-2 py-1 rounded text-xs ${aff.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                                                }`}>
                                                {aff.status}
                                            </span>
                                        </TableCell>
                                        <TableCell className="flex gap-2">
                                            <button
                                                onClick={() => handlePayout(aff.userId, aff._id, aff.unpaidBalance)}
                                                disabled={processingId === aff._id || aff.unpaidBalance <= 0}
                                                className="px-3 py-1 bg-gradient-to-r from-purple-600 to-pink-500 text-white text-xs rounded hover:from-purple-700 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed"
                                            >
                                                {processingId === aff._id ? 'Processing...' : 'Mark Paid'}
                                            </button>
                                            <button
                                                onClick={() => {
                                                    setSelectedAffiliate(aff);
                                                    setAdjustOpen(true);
                                                }}
                                                className="px-3 py-1 bg-white text-gray-700 text-xs rounded border border-gray-200 hover:bg-gray-50 hover:text-purple-600 transition-colors"
                                            >
                                                Adjust
                                            </button>
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </div>
                </div>
            </div>
            <AffiliateSettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
            {selectedAffiliate && (
                <AdjustBalanceDialog
                    open={adjustOpen}
                    onOpenChange={setAdjustOpen}
                    affiliateId={selectedAffiliate._id}
                    currentBalance={selectedAffiliate.unpaidBalance}
                    onSuccess={(newBalance) => {
                        setAffiliates(prev => prev.map(a => a._id === selectedAffiliate._id ? { ...a, unpaidBalance: newBalance } : a));
                    }}
                />
            )}
        </div>
    );
}
