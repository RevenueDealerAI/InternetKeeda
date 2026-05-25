"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Table, TableHeader, TableRow, TableHead, TableBody, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

interface AdminSub {
  id: string;
  subscriptionId: string;
  userId: string;
  toolId: { name?: string } | string | null;
  amount: number;
  currency: string;
  status: "initialized" | "active" | "paused" | "cancelled" | "failed" | "expired";
  billingCycle: string;
  nextBillingDate?: string;
  failedRenewalCount: number;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  initialized: "bg-amber-50 text-amber-700 ring-amber-200/60",
  active: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
  paused: "bg-blue-50 text-blue-700 ring-blue-200/60",
  cancelled: "bg-gray-100 text-gray-700 ring-gray-200/60",
  failed: "bg-red-50 text-red-700 ring-red-200/60",
  expired: "bg-purple-50 text-purple-700 ring-purple-200/60",
};

export default function SubscriptionsAdminPage() {
  const [status, setStatus] = useState<string>("");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-subscriptions", status],
    queryFn: async (): Promise<{ items: AdminSub[]; total: number }> => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const r = await fetch(`/api/admin/subscriptions?${params}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed to fetch subscriptions");
      return r.json();
    },
  });

  const cancelMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/subscriptions/${id}/cancel`, { method: "POST", credentials: "include" });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || "Cancel failed");
      }
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Cancellation requested" });
      qc.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    },
    onError: (err) => {
      toast({
        title: "Cancel failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const extendMut = useMutation({
    mutationFn: async ({ id, extraDays }: { id: string; extraDays: number }) => {
      const r = await fetch(`/api/admin/subscriptions/${id}/extend`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ extraDays }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || "Extend failed");
      }
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Extension applied" });
      qc.invalidateQueries({ queryKey: ["admin-subscriptions"] });
    },
    onError: (err) => {
      toast({
        title: "Extend failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Subscriptions</h1>
          <p className="text-sm text-gray-500">Recurring $10/mo listings via Cashfree.</p>
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="initialized">Initialized</SelectItem>
            <SelectItem value="paused">Paused</SelectItem>
            <SelectItem value="cancelled">Cancelled</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="expired">Expired</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tool</TableHead>
              <TableHead>Amount / cycle</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Next billing</TableHead>
              <TableHead>Failed cycles</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-sm text-gray-500 py-8">Loading…</TableCell></TableRow>
            ) : (data?.items ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-sm text-gray-500 py-8">No subscriptions yet.</TableCell></TableRow>
            ) : (
              (data?.items ?? []).map((s) => (
                <TableRow key={s.id}>
                  <TableCell>{typeof s.toolId === "object" && s.toolId ? s.toolId.name : <span className="text-gray-400">(deleted)</span>}</TableCell>
                  <TableCell>₹{(s.amount / 100).toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <Badge className={`ring-1 ${STATUS_STYLES[s.status] || ""}`}>{s.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {s.nextBillingDate ? format(new Date(s.nextBillingDate), "PP") : "—"}
                  </TableCell>
                  <TableCell>{s.failedRenewalCount}</TableCell>
                  <TableCell className="text-right space-x-2">
                    {["active", "paused", "initialized"].includes(s.status) && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={cancelMut.isPending}
                        onClick={() => { if (confirm("Cancel subscription?")) cancelMut.mutate(s.id); }}
                      >
                        Cancel
                      </Button>
                    )}
                    <Button
                      size="sm"
                      variant="ghost"
                      disabled={extendMut.isPending}
                      onClick={() => {
                        const v = prompt("Extend by how many days?", "30");
                        const n = Number(v);
                        if (!Number.isFinite(n) || n <= 0) return;
                        extendMut.mutate({ id: s.id, extraDays: n });
                      }}
                    >
                      Extend
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
