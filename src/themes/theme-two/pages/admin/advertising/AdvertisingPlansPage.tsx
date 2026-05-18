// Theme Two admin page (independent implementation)

import { useState } from 'react';
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
import {
  MoreHorizontal,
  Plus,
  Edit,
  Trash2,
  DollarSign,
  Target,
  Users,
  TrendingUp,
  Eye,
  EyeOff,
  Star
} from "lucide-react";
import { toast } from 'sonner';
import {
  useAdvertisingPlans,
  useAdvertisingStats,
  useDeleteAdvertisingPlan,
  useUpdateAdvertisingPlan,
  type AdvertisingPlan
} from '@/lib/api/advertisingPlans';
import { CreateAdvertisingPlanDialog } from '../../../components/admin/advertising/CreateAdvertisingPlanDialog';
import { EditAdvertisingPlanDialog } from '../../../components/admin/advertising/EditAdvertisingPlanDialog';
import { useDemoMode } from '@/hooks/useDemoMode';

export default function AdvertisingPlansPage() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<AdvertisingPlan | null>(null);

  const { data: plans, isLoading, error } = useAdvertisingPlans();
  const { data: stats, isLoading: statsLoading } = useAdvertisingStats();
  const deletePlan = useDeleteAdvertisingPlan();
  const updatePlan = useUpdateAdvertisingPlan();
  const { blockIfDemo } = useDemoMode();

  const handleDelete = async (plan: AdvertisingPlan) => {
    if (blockIfDemo()) return;

    if (!confirm(`Are you sure you want to delete the "${plan.name}" plan?`)) {
      return;
    }

    try {
      await deletePlan.mutateAsync(plan._id);
      toast.success('Advertising plan deleted successfully');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to delete plan');
    }
  };

  const handleToggleActive = async (plan: AdvertisingPlan) => {
    if (blockIfDemo()) return;

    try {
      await updatePlan.mutateAsync({
        id: plan._id,
        data: { isActive: !plan.isActive }
      });
      toast.success(`Plan ${plan.isActive ? 'deactivated' : 'activated'} successfully`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update plan');
    }
  };

  const handleTogglePopular = async (plan: AdvertisingPlan) => {
    if (blockIfDemo()) return;

    try {
      await updatePlan.mutateAsync({
        id: plan._id,
        data: { isPopular: !plan.isPopular }
      });
      toast.success(`Plan ${plan.isPopular ? 'unmarked' : 'marked'} as popular`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to update plan');
    }
  };

  const getPlacementColor = (placement: string) => {
    switch (placement) {
      case 'basic':
        return 'bg-gray-50 text-gray-700 border border-gray-200';
      case 'featured':
        return 'bg-blue-50 text-blue-700 border border-blue-200';
      case 'premium':
        return 'bg-purple-50 text-purple-700 border border-purple-200';
      case 'sponsored':
        return 'bg-green-50 text-green-700 border border-green-200';
      default:
        return 'bg-gray-50 text-gray-700 border border-gray-200';
    }
  };

  const formatCurrency = (amount: number, currency: string = 'USD') => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: currency,
    }).format(amount);
  };

  return (
    <div className="space-y-6 space-y-6 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Advertising Plans</h1>
          <p className="text-muted-foreground">
            Manage advertising plans and view performance statistics.
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="rounded-full bg-gradient-to-r from-purple-600 to-pink-500 text-white hover:from-purple-700 hover:to-pink-600">
          <Plus className="w-4 h-4 mr-2" />
          Create Plan
        </Button>
      </div>

      {/* Statistics Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Plans</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPlans}</div>
              <p className="text-xs text-muted-foreground">
                {stats.activePlans} active
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {formatCurrency(stats.totalRevenue)}
              </div>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Purchases</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-blue-600">{stats.activePurchases}</div>
              <p className="text-xs text-muted-foreground">
                {stats.totalPurchases} total
              </p>
            </CardContent>
          </Card>

          <Card className="rounded-2xl border shadow-sm">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Conversion Rate</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-purple-600">
                {stats.totalPurchases > 0
                  ? `${((stats.activePurchases / stats.totalPurchases) * 100).toFixed(1)}%`
                  : '0%'
                }
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Plans Table */}
      <Card className="rounded-2xl border shadow-sm">
        <CardHeader>
          <CardTitle>All Advertising Plans</CardTitle>
          <CardDescription>
            {isLoading ? 'Loading...' : `${plans?.length || 0} plans found`}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error ? (
            <div className="text-center py-8 text-red-600">
              Failed to load advertising plans. Please try again.
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-purple-50">
                <TableRow>
                  <TableHead className="text-purple-700 font-semibold">Name</TableHead>
                  <TableHead className="text-purple-700 font-semibold">Price</TableHead>
                  <TableHead className="text-purple-700 font-semibold">Duration</TableHead>
                  <TableHead className="text-purple-700 font-semibold">Placement</TableHead>
                  <TableHead className="text-purple-700 font-semibold">Status</TableHead>
                  <TableHead className="text-purple-700 font-semibold">Features</TableHead>
                  <TableHead className="w-[100px] text-purple-700 font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600" />
                      </div>
                    </TableCell>
                  </TableRow>
                ) : plans?.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={7} className="text-center py-8">
                      No advertising plans found. Create your first plan to get started.
                    </TableCell>
                  </TableRow>
                ) : (
                  plans?.map((plan) => (
                    <TableRow key={plan._id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{plan.name}</span>
                          {plan.isPopular && (
                            <Star className="h-4 w-4 text-yellow-500 fill-current" />
                          )}
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {plan.description}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">
                          {formatCurrency(plan.price, plan.currency)}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="rounded-full px-3 py-1 text-xs">
                          {plan.duration} day{plan.duration !== 1 ? 's' : ''}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getPlacementColor(plan.placement) + ' rounded-full px-3 py-1 text-xs'}>
                          {plan.placement}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={(plan.isActive ? 'bg-green-50 text-green-700 border border-green-200' : 'bg-gray-50 text-gray-700 border border-gray-200') + ' rounded-full px-3 py-1 text-xs'}>
                          {plan.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {plan.features.slice(0, 2).join(', ')}
                          {plan.features.length > 2 && (
                            <span className="text-muted-foreground">
                              {' '}+{plan.features.length - 2} more
                            </span>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" className="h-8 w-8 p-0">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem
                              onClick={() => setEditingPlan(plan)}
                            >
                              <Edit className="w-4 h-4 mr-2" />
                              Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleToggleActive(plan)}
                            >
                              {plan.isActive ? (
                                <EyeOff className="w-4 h-4 mr-2" />
                              ) : (
                                <Eye className="w-4 h-4 mr-2" />
                              )}
                              {plan.isActive ? 'Deactivate' : 'Activate'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleTogglePopular(plan)}
                            >
                              <Star className="w-4 h-4 mr-2" />
                              {plan.isPopular ? 'Unmark Popular' : 'Mark Popular'}
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              onClick={() => handleDelete(plan)}
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
          )}
        </CardContent>
      </Card>

      {/* Dialogs */}
      <CreateAdvertisingPlanDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {editingPlan && (
        <EditAdvertisingPlanDialog
          plan={editingPlan}
          open={!!editingPlan}
          onOpenChange={(open) => !open && setEditingPlan(null)}
        />
      )}
    </div>
  );
} 