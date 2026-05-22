"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/components/ui/use-toast";

interface AdminPayment {
  id: string;
  orderId: string;
  userId: string;
  toolId: { name?: string; slug?: string } | string | null;
  amount: number;
  currency: string;
  productType: string;
  boostDurationDays: number;
  status: "pending" | "success" | "failed" | "dropped" | "refunded";
  paidAt?: string;
  refundedAt?: string;
  createdAt: string;
}

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200/60",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
  failed: "bg-red-50 text-red-700 ring-red-200/60",
  dropped: "bg-gray-50 text-gray-700 ring-gray-200/60",
  refunded: "bg-purple-50 text-purple-700 ring-purple-200/60",
};

export default function PaymentsAdminPage() {
  const [status, setStatus] = useState<string>("");
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments", status],
    queryFn: async (): Promise<{ items: AdminPayment[]; total: number }> => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const r = await fetch(`/api/admin/payments?${params}`, { credentials: "include" });
      if (!r.ok) throw new Error("Failed to fetch payments");
      return r.json();
    },
  });

  const refundMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/payments/${id}/refund`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || "Refund failed");
      }
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Refund initiated", description: "Webhook will mark refunded shortly." });
      qc.invalidateQueries({ queryKey: ["admin-payments"] });
    },
    onError: (err) => {
      toast({
        title: "Refund failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500">One-time boost payments via Cashfree.</p>
        </div>
        <Select value={status} onValueChange={(v) => setStatus(v === "all" ? "" : v)}>
          <SelectTrigger className="w-44"><SelectValue placeholder="All statuses" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="success">Success</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="failed">Failed</SelectItem>
            <SelectItem value="dropped">Dropped</SelectItem>
            <SelectItem value="refunded">Refunded</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="border border-gray-200 rounded-xl bg-white overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Tool</TableHead>
              <TableHead>Product</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow><TableCell colSpan={6} className="text-center text-sm text-gray-500 py-8">Loading…</TableCell></TableRow>
            ) : (data?.items ?? []).length === 0 ? (
              <TableRow><TableCell colSpan={6} className="text-center text-sm text-gray-500 py-8">No payments yet.</TableCell></TableRow>
            ) : (
              (data?.items ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    {typeof p.toolId === "object" && p.toolId
                      ? p.toolId.name
                      : <span className="text-gray-400">(deleted)</span>}
                  </TableCell>
                  <TableCell className="text-xs">{p.productType.replace(/^boost-/, "")} · {p.boostDurationDays}d</TableCell>
                  <TableCell>₹{(p.amount / 100).toLocaleString("en-IN")}</TableCell>
                  <TableCell>
                    <Badge className={`ring-1 ${STATUS_STYLES[p.status] || ""}`}>{p.status}</Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {format(new Date(p.createdAt), "PP")}
                  </TableCell>
                  <TableCell className="text-right">
                    {p.status === "success" && (
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={refundMut.isPending}
                        onClick={() => {
                          if (confirm(`Refund ₹${p.amount / 100}?`)) refundMut.mutate(p.id);
                        }}
                      >
                        Refund
                      </Button>
                    )}
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
