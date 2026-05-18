'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardHeader, CardTitle, CardContent, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from '@/components/ui/table';
import { useToast } from '@/components/ui/use-toast';
import { Loader2, Copy, DollarSign, Users, ExternalLink, TrendingUp } from 'lucide-react';

export default function AffiliatePage() {
    const [loading, setLoading] = useState(true);
    const [isAffiliate, setIsAffiliate] = useState(false);
    const [data, setData] = useState<any>(null);
    const [joining, setJoining] = useState(false);
    const { toast } = useToast();

    useEffect(() => {
        fetchStats();
    }, []);

    const fetchStats = async () => {
        try {
            const res = await fetch('/api/affiliate/stats');
            const json = await res.json();
            if (json.isAffiliate) {
                setIsAffiliate(true);
                setData(json);
            }
        } catch (error) {
            console.error(error);
        } finally {
            setLoading(false);
        }
    };

    const joinProgram = async () => {
        setJoining(true);
        try {
            const res = await fetch('/api/affiliate/join', { method: 'POST' });
            const json = await res.json();
            if (json.success) {
                // setIsAffiliate(true); // Removed to avoid rendering before data is fetched
                await fetchStats();
                toast({ title: "Welcome!", description: "You are now an affiliate." });
            } else {
                toast({ title: "Error", description: json.error || "Failed to join", variant: "destructive" });
            }
        } catch (error) {
            toast({ title: "Error", description: "Something went wrong", variant: "destructive" });
        } finally {
            setJoining(false);
        }
    };

    const copyLink = () => {
        if (!data?.profile?.uniqueCode) return;
        const link = `${window.location.origin}/?ref=${data.profile.uniqueCode}`;
        navigator.clipboard.writeText(link);
        toast({ title: "Copied!", description: "Referral link copied to clipboard." });
    };

    if (loading) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    }

    if (!isAffiliate) {
        return (
            <div className="container mx-auto py-10 max-w-2xl text-center space-y-6">
                <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-400 to-pink-600 bg-clip-text text-transparent">Partner with Us</h1>
                <p className="text-xl text-muted-foreground">Join our affiliate program and earn 20% commission on every subscription you refer.</p>

                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                    <Card>
                        <CardHeader><DollarSign className="w-8 h-8 text-green-500 mb-2" /><CardTitle>20% Commission</CardTitle></CardHeader>
                        <CardContent>Earn recurring revenue on every sale.</CardContent>
                    </Card>
                    <Card>
                        <CardHeader><TrendingUp className="w-8 h-8 text-blue-500 mb-2" /><CardTitle>Real-time Stats</CardTitle></CardHeader>
                        <CardContent>Track clicks and conversions instantly.</CardContent>
                    </Card>
                    <Card>
                        <CardHeader><Users className="w-8 h-8 text-purple-500 mb-2" /><CardTitle>Easy Payouts</CardTitle></CardHeader>
                        <CardContent>Get paid via PayPal monthly.</CardContent>
                    </Card>
                </div>

                <Button size="lg" onClick={joinProgram} disabled={joining} className="mt-8 bg-gradient-to-r from-purple-600 to-pink-600 hover:opacity-90 transition-opacity">
                    {joining ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
                    Become an Affiliate
                </Button>
            </div>
        );
    }

    // Safety check: ensure data is available before rendering dashboard
    if (!data || !data.profile) {
        return <div className="flex justify-center p-10"><Loader2 className="animate-spin" /></div>;
    }

    const referralLink = typeof window !== 'undefined' ? `${window.location.origin}/?ref=${data.profile.uniqueCode}` : '';

    return (
        <div className="container mx-auto py-8">
            <h1 className="text-3xl font-bold mb-8 text-gray-900">Affiliate Dashboard</h1>

            {/* Link Section */}
            <Card className="mb-8 rounded-3xl border-purple-100 bg-gradient-to-r from-purple-50 to-pink-50 shadow-sm overflow-hidden">
                <CardHeader>
                    <CardTitle className="text-purple-900">Your Referral Link</CardTitle>
                    <CardDescription className="text-purple-700">Share this link to earn commissions</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col sm:flex-row gap-4">
                    <Input
                        value={referralLink}
                        readOnly
                        className="bg-white border-purple-200 text-gray-700 font-mono focus:ring-purple-500 rounded-xl h-12"
                    />
                    <Button
                        onClick={copyLink}
                        className="bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white !text-white rounded-xl h-12 px-8 shadow-md transition-all hover:shadow-lg !bg-purple-600 !border-0"
                        style={{ backgroundImage: 'linear-gradient(to right, #9333ea, #db2777)', color: 'white' }}
                    >
                        <Copy className="mr-2 h-4 w-4" />
                        Copy Link
                    </Button>
                </CardContent>
            </Card>

            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Card className="hover:shadow-lg transition-all duration-300 rounded-3xl border-gray-100 shadow-sm group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Earnings</CardTitle>
                        <div className="p-2 bg-green-100 rounded-xl group-hover:bg-green-200 transition-colors">
                            <DollarSign className="h-4 w-4 text-green-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">${(data.profile.totalEarnings / 100).toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all duration-300 rounded-3xl border-gray-100 shadow-sm group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Unpaid Balance</CardTitle>
                        <div className="p-2 bg-blue-100 rounded-xl group-hover:bg-blue-200 transition-colors">
                            <DollarSign className="h-4 w-4 text-blue-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-blue-600">${(data.profile.unpaidBalance / 100).toFixed(2)}</div>
                    </CardContent>
                </Card>
                <Card className="hover:shadow-lg transition-all duration-300 rounded-3xl border-gray-100 shadow-sm group">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium text-gray-500">Total Referrals</CardTitle>
                        <div className="p-2 bg-purple-100 rounded-xl group-hover:bg-purple-200 transition-colors">
                            <Users className="h-4 w-4 text-purple-600" />
                        </div>
                    </CardHeader>
                    <CardContent>
                        <div className="text-3xl font-bold text-gray-900">{data.referralCount}</div>
                    </CardContent>
                </Card>
            </div>

            {/* Recent Commissions */}
            <Card className="rounded-3xl border-gray-100 shadow-sm overflow-hidden">
                <CardHeader className="bg-gray-50/50 border-b border-gray-100">
                    <CardTitle className="text-gray-900">Recent Commissions</CardTitle>
                </CardHeader>
                <CardContent className="p-0">
                    <Table>
                        <TableHeader>
                            <TableRow className="hover:bg-transparent border-gray-100">
                                <TableHead className="pl-6">Date</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead className="pr-6">Type</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {data.recentCommissions.length === 0 && (
                                <TableRow>
                                    <TableCell colSpan={4} className="text-center py-8 text-gray-500">
                                        No commissions yet. Share your link to start earning!
                                    </TableCell>
                                </TableRow>
                            )}
                            {data.recentCommissions.map((comm: any) => (
                                <TableRow key={comm._id} className="hover:bg-gray-50/50 border-gray-100">
                                    <TableCell className="pl-6 font-medium text-gray-900">{new Date(comm.createdAt).toLocaleDateString()}</TableCell>
                                    <TableCell className="font-semibold text-gray-700">${(comm.amount / 100).toFixed(2)}</TableCell>
                                    <TableCell>
                                        <span className={`px-3 py-1 rounded-full text-xs font-medium ${comm.status === 'paid' ? 'bg-green-100 text-green-700' :
                                            comm.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                                                'bg-gray-100 text-gray-700'
                                            }`}>
                                            {comm.status}
                                        </span>
                                    </TableCell>
                                    <TableCell className="capitalize text-gray-600 pr-6">{comm.type}</TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                </CardContent>
            </Card>
        </div>
    );
}
