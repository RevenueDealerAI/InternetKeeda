"use client";

import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { IndianRupee, Repeat, AlertTriangle, Hourglass } from "lucide-react";

interface RevenueResponse {
  asOf: string;
  thisMonth: {
    boostRevenuePaise: number;
    boostCount: number;
    subscriptionRevenuePaise: number;
    subscriptionCount: number;
    totalRevenuePaise: number;
    paymentsFailed: number;
    paymentsRefunded: number;
  };
  allTime: {
    boostRevenuePaise: number;
    boostCount: number;
    activeSubscriptions: number;
  };
  stuckPending: number;
}

const formatRupees = (paise: number) =>
  `₹${(paise / 100).toLocaleString("en-IN")}`;

/**
 * Revenue summary cards for the admin dashboard. Hits
 * /api/admin/revenue every 60 s. Designed to slot in below the
 * existing Overview Stats grid.
 */
export function RevenueCards() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-revenue"],
    queryFn: async (): Promise<RevenueResponse> => {
      const r = await fetch("/api/admin/revenue", { credentials: "include" });
      if (!r.ok) throw new Error("Failed to load revenue");
      return r.json();
    },
    refetchInterval: 60_000,
  });

  if (isLoading) {
    return (
      <div className="text-sm text-gray-500 py-4">Loading revenue…</div>
    );
  }
  if (error || !data) {
    return (
      <div className="text-sm text-red-600 py-4">
        {error instanceof Error ? error.message : "No revenue data"}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <h3 className="text-sm md:text-base font-semibold text-gray-700">
        Revenue (this month)
      </h3>
      <div className="grid grid-cols-2 gap-3 sm:gap-4 md:gap-6 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 px-3 md:px-6 py-2 md:py-4">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-500">Total this month</CardTitle>
            <div className="p-1.5 md:p-2 bg-emerald-50 rounded-xl">
              <IndianRupee className="h-3 w-3 md:h-4 md:w-4 text-emerald-600" />
            </div>
          </CardHeader>
          <CardContent className="px-3 md:px-6 py-1 md:py-2">
            <div className="text-lg md:text-2xl font-bold text-gray-900">
              {formatRupees(data.thisMonth.totalRevenuePaise)}
            </div>
            <p className="text-[10px] md:text-xs text-gray-500 mt-1">
              Boost {formatRupees(data.thisMonth.boostRevenuePaise)} + Sub {formatRupees(data.thisMonth.subscriptionRevenuePaise)}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 px-3 md:px-6 py-2 md:py-4">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-500">Active subscriptions</CardTitle>
            <div className="p-1.5 md:p-2 bg-blue-50 rounded-xl">
              <Repeat className="h-3 w-3 md:h-4 md:w-4 text-blue-600" />
            </div>
          </CardHeader>
          <CardContent className="px-3 md:px-6 py-1 md:py-2">
            <div className="text-lg md:text-2xl font-bold text-gray-900">
              {data.allTime.activeSubscriptions}
            </div>
            <p className="text-[10px] md:text-xs text-gray-500 mt-1">Recurring listings</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 px-3 md:px-6 py-2 md:py-4">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-500">Failed payments</CardTitle>
            <div className="p-1.5 md:p-2 bg-red-50 rounded-xl">
              <AlertTriangle className="h-3 w-3 md:h-4 md:w-4 text-red-600" />
            </div>
          </CardHeader>
          <CardContent className="px-3 md:px-6 py-1 md:py-2">
            <div className="text-lg md:text-2xl font-bold text-gray-900">{data.thisMonth.paymentsFailed}</div>
            <p className="text-[10px] md:text-xs text-gray-500 mt-1">
              {data.thisMonth.paymentsRefunded} refunded
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1 md:pb-2 px-3 md:px-6 py-2 md:py-4">
            <CardTitle className="text-xs md:text-sm font-medium text-gray-500">Stuck pending</CardTitle>
            <div className="p-1.5 md:p-2 bg-amber-50 rounded-xl">
              <Hourglass className="h-3 w-3 md:h-4 md:w-4 text-amber-600" />
            </div>
          </CardHeader>
          <CardContent className="px-3 md:px-6 py-1 md:py-2">
            <div className="text-lg md:text-2xl font-bold text-gray-900">{data.stuckPending}</div>
            <p className="text-[10px] md:text-xs text-gray-500 mt-1">&gt;10 min pending</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
