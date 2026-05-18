// Theme Two admin page (independent implementation)

import { useState, useEffect } from 'react';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { MoreHorizontal, Mail, Users, TrendingUp, Calendar, Download, Trash2 } from "lucide-react";
import { format } from 'date-fns';
import { toast } from 'sonner';
import { useDemoMode } from '@/hooks/useDemoMode';

interface NewsletterSubscription {
  _id: string;
  email: string;
  status: 'active' | 'unsubscribed';
  subscribedAt: string;
  unsubscribedAt?: string;
  source: 'footer' | 'homepage' | 'other';
  ipAddress?: string;
  userAgent?: string;
}

interface NewsletterStats {
  total: number;
  active: number;
  unsubscribed: number;
  recent: number;
  bySource: {
    footer?: number;
    homepage?: number;
    other?: number;
  };
}

export default function NewsletterManagementPage() {
  const [subscriptions, setSubscriptions] = useState<NewsletterSubscription[]>([]);
  const [stats, setStats] = useState<NewsletterStats | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isUpdating, setIsUpdating] = useState<string | null>(null);
  const { blockIfDemo } = useDemoMode();

  // Fetch subscriptions and stats
  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setIsLoading(true);

      // Fetch subscriptions and stats in parallel
      const [subscriptionsResponse, statsResponse] = await Promise.all([
        fetch(`${""}/api/newsletter`),
        fetch(`${""}/api/newsletter/stats`)
      ]);

      if (subscriptionsResponse.ok) {
        const subscriptionsData = await subscriptionsResponse.json();
        setSubscriptions(subscriptionsData);
      }

      if (statsResponse.ok) {
        const statsData = await statsResponse.json();
        setStats(statsData);
      }
    } catch (error) {
      console.error('Error fetching newsletter data:', error);
      toast.error('Failed to fetch newsletter data');
    } finally {
      setIsLoading(false);
    }
  };

  // Update subscription status
  const handleUpdateStatus = async (subscriptionId: string, status: 'active' | 'unsubscribed') => {
    if (blockIfDemo()) return;

    try {
      setIsUpdating(subscriptionId);
      const response = await fetch(
        `${""}/api/newsletter/${subscriptionId}/status`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ status }),
        }
      );

      if (response.ok) {
        toast.success(`Subscription ${status === 'active' ? 'activated' : 'deactivated'} successfully`);
        fetchData(); // Refresh data
      } else {
        throw new Error('Failed to update subscription');
      }
    } catch (error) {
      console.error('Error updating subscription:', error);
      toast.error('Failed to update subscription');
    } finally {
      setIsUpdating(null);
    }
  };

  // Delete subscription
  const handleDelete = async (subscriptionId: string) => {
    if (blockIfDemo()) return;

    if (!confirm('Are you sure you want to delete this subscription?')) {
      return;
    }

    try {
      setIsUpdating(subscriptionId);
      const response = await fetch(
        `${""}/api/newsletter/${subscriptionId}`,
        {
          method: 'DELETE',
        }
      );

      if (response.ok) {
        toast.success('Subscription deleted successfully');
        fetchData(); // Refresh data
      } else {
        throw new Error('Failed to delete subscription');
      }
    } catch (error) {
      console.error('Error deleting subscription:', error);
      toast.error('Failed to delete subscription');
    } finally {
      setIsUpdating(null);
    }
  };

  // Export subscriptions to CSV
  const handleExport = () => {
    if (blockIfDemo()) return;

    const activeSubscriptions = subscriptions.filter(sub => sub.status === 'active');
    const csvContent = [
      'Email,Source,Subscribed Date',
      ...activeSubscriptions.map(sub =>
        `${sub.email},${sub.source},${format(new Date(sub.subscribedAt), 'yyyy-MM-dd')}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `newsletter-subscriptions-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);

    toast.success('Subscriptions exported successfully');
  };

  const getStatusColor = (status: 'active' | 'unsubscribed') => {
    return status === 'active'
      ? 'bg-green-50 text-green-700 border border-green-200'
      : 'bg-gray-50 text-gray-700 border border-gray-200';
  };

  const getSourceColor = (source: string) => {
    switch (source) {
      case 'footer':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'homepage':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  return (
    <div className="space-y-6 pt-8 space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Newsletter Subscriptions</h1>
          <p className="text-muted-foreground">
            Manage newsletter subscriptions and view analytics.
          </p>
        </div>
        <Button onClick={handleExport} variant="outline" className="rounded-full">
          <Download className="w-4 h-4 mr-2" />
          Export Active
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Subscriptions</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Subscribers</CardTitle>
              <Mail className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">{stats.active}</div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Recent (30 days)</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.recent}</div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unsubscribed</CardTitle>
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-gray-600">{stats.unsubscribed}</div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Subscriptions Table */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader>
          <CardTitle>All Subscriptions</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading...' : `${subscriptions.length} subscriptions found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader className="bg-purple-50">
              <TableRow>
                <TableHead className="text-purple-700 font-semibold">Email</TableHead>
                <TableHead className="text-purple-700 font-semibold">Status</TableHead>
                <TableHead className="text-purple-700 font-semibold">Source</TableHead>
                <TableHead className="text-purple-700 font-semibold">Subscribed Date</TableHead>
                <TableHead className="text-purple-700 font-semibold">IP Address</TableHead>
                <TableHead className="w-[100px] text-purple-700 font-semibold">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                    </div>
                  </TableCell>
                </TableRow>
              ) : subscriptions.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8">
                    No subscriptions found
                  </TableCell>
                </TableRow>
              ) : (
                subscriptions.map((subscription) => (
                  <TableRow key={subscription._id}>
                    <TableCell className="font-medium">
                      {subscription.email}
                    </TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(subscription.status) + ' rounded-full px-3 py-1 text-xs'}>
                        {subscription.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Badge className={getSourceColor(subscription.source) + ' rounded-full px-3 py-1 text-xs'}>
                        {subscription.source}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {format(new Date(subscription.subscribedAt), 'MMM d, yyyy')}
                    </TableCell>
                    <TableCell className="text-sm text-gray-500">
                      {subscription.ipAddress || 'N/A'}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            variant="ghost"
                            className="h-8 w-8 p-0"
                            disabled={isUpdating === subscription._id}
                          >
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          {subscription.status === 'active' ? (
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(subscription._id, 'unsubscribed')}
                            >
                              Unsubscribe
                            </DropdownMenuItem>
                          ) : (
                            <DropdownMenuItem
                              onClick={() => handleUpdateStatus(subscription._id, 'active')}
                            >
                              Reactivate
                            </DropdownMenuItem>
                          )}
                          <DropdownMenuItem
                            onClick={() => handleDelete(subscription._id)}
                            className="text-red-600"
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 