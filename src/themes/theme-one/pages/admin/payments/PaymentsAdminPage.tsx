"use client";

import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button, buttonVariants } from "@/components/ui/button";
import {
  Table,
  TableHeader,
  TableRow,
  TableHead,
  TableBody,
  TableCell,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "@/components/ui/use-toast";
import { formatMoney } from "@/lib/format/money";
import {
  MoreHorizontal,
  RefreshCw,
  XCircle,
  Undo2,
  Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  provider: "cashfree" | "paypal";
  paypalOrderId?: string;
  paypalCaptureId?: string;
  refundStatus?: "SUCCESS" | "PENDING" | "ONHOLD" | "FAILED";
  refundAmount?: number;
  cfRefundId?: string;
  paypalRefundId?: string;
  paidAt?: string;
  refundedAt?: string;
  manuallyMarkedAt?: string;
  manuallyMarkedBy?: string;
  createdAt: string;
}

const REFUND_STYLES: Record<string, string> = {
  SUCCESS: "bg-purple-50 text-purple-700 ring-purple-200/60",
  PENDING: "bg-amber-50 text-amber-700 ring-amber-200/60",
  ONHOLD: "bg-amber-50 text-amber-700 ring-amber-200/60",
  FAILED: "bg-red-50 text-red-700 ring-red-200/60",
};
const REFUND_LABELS: Record<string, string> = {
  SUCCESS: "Refunded",
  PENDING: "Refund pending",
  ONHOLD: "Refund on hold",
  FAILED: "Refund failed",
};

const STATUS_STYLES: Record<string, string> = {
  pending: "bg-amber-50 text-amber-700 ring-amber-200/60",
  success: "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
  failed: "bg-red-50 text-red-700 ring-red-200/60",
  dropped: "bg-gray-50 text-gray-700 ring-gray-200/60",
  refunded: "bg-purple-50 text-purple-700 ring-purple-200/60",
};

// Neutral monochrome — matches the Freemium/Free chip family the
// admin uses elsewhere. No brand colors: providers come and go,
// the admin's restrained palette doesn't.
const PROVIDER_BADGE_CLASS =
  "bg-gray-50 text-gray-700 ring-gray-200/60 capitalize";

const PROVIDER_LABEL: Record<string, string> = {
  cashfree: "cashfree",
  paypal: "paypal",
  stripe: "stripe",
};

function providerOf(p: AdminPayment): string | null {
  if (p.provider && PROVIDER_LABEL[p.provider]) return p.provider;
  // Legacy fallback: infer from whichever provider-specific id is
  // populated. The Payment model only has Cashfree + PayPal id fields
  // today; stripePaymentIntentId is here for forward-compat.
  const r = p as AdminPayment & { stripePaymentIntentId?: string };
  if (r.paypalOrderId) return "paypal";
  if (r.stripePaymentIntentId) return "stripe";
  if (p.orderId) return "cashfree";
  return null;
}

type DialogTarget =
  | { kind: "verify"; payment: AdminPayment }
  | { kind: "mark-failed"; payment: AdminPayment }
  | { kind: "refund"; payment: AdminPayment }
  | null;

export default function PaymentsAdminPage() {
  const [status, setStatus] = useState<string>("");
  const [dialogTarget, setDialogTarget] = useState<DialogTarget>(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: ["admin-payments", status],
    queryFn: async (): Promise<{ items: AdminPayment[]; total: number }> => {
      const params = new URLSearchParams();
      if (status) params.set("status", status);
      const r = await fetch(`/api/admin/payments?${params}`, {
        credentials: "include",
      });
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
      toast({
        title: "Refund initiated",
        description: "Webhook will mark refunded shortly.",
      });
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

  const verifyMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/payments/${id}/verify`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || "Verify failed");
      }
      return r.json() as Promise<{
        ok: boolean;
        changed: boolean;
        providerStatus?: string;
        note?: string;
      }>;
    },
    onSuccess: (resp) => {
      toast({
        title: resp.changed ? "Payment reconciled" : "No change",
        description:
          resp.note ||
          (resp.providerStatus
            ? `Provider says: ${resp.providerStatus}`
            : "Status synced from provider."),
      });
      qc.invalidateQueries({ queryKey: ["admin-payments"] });
    },
    onError: (err) => {
      toast({
        title: "Verify failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const markFailedMut = useMutation({
    mutationFn: async (id: string) => {
      const r = await fetch(`/api/admin/payments/${id}/mark-failed`, {
        method: "POST",
        credentials: "include",
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || "Mark-failed failed");
      }
      return r.json();
    },
    onSuccess: () => {
      toast({
        title: "Payment marked failed",
        description: "Row force-closed by admin override.",
      });
      qc.invalidateQueries({ queryKey: ["admin-payments"] });
    },
    onError: (err) => {
      toast({
        title: "Mark failed errored",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  // Whichever mutation matches the open dialog drives the
  // spinner/disabled state — block dismissal while in flight.
  const pendingMut =
    dialogTarget?.kind === "verify"
      ? verifyMut
      : dialogTarget?.kind === "mark-failed"
      ? markFailedMut
      : dialogTarget?.kind === "refund"
      ? refundMut
      : null;
  const dialogBusy = !!pendingMut?.isPending;

  const handleConfirm = async () => {
    if (!dialogTarget) return;
    const id = dialogTarget.payment.id;
    try {
      if (dialogTarget.kind === "verify") {
        await verifyMut.mutateAsync(id);
      } else if (dialogTarget.kind === "mark-failed") {
        await markFailedMut.mutateAsync(id);
      } else if (dialogTarget.kind === "refund") {
        await refundMut.mutateAsync(id);
      }
    } catch {
      // toast handled in onError
    } finally {
      setDialogTarget(null);
    }
  };

  const dialogCopy = dialogCopyFor(dialogTarget);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Payments</h1>
          <p className="text-sm text-gray-500">One-time boost payments.</p>
        </div>
        <Select
          value={status}
          onValueChange={(v) => setStatus(v === "all" ? "" : v)}
        >
          <SelectTrigger className="w-44">
            <SelectValue placeholder="All statuses" />
          </SelectTrigger>
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
              <TableHead className="hidden md:table-cell">Provider</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-sm text-gray-500 py-8"
                >
                  Loading…
                </TableCell>
              </TableRow>
            ) : (data?.items ?? []).length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={7}
                  className="text-center text-sm text-gray-500 py-8"
                >
                  No payments yet.
                </TableCell>
              </TableRow>
            ) : (
              (data?.items ?? []).map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    {typeof p.toolId === "object" && p.toolId ? (
                      p.toolId.name
                    ) : (
                      <span className="text-gray-400">(deleted)</span>
                    )}
                  </TableCell>
                  <TableCell className="text-xs">
                    {p.productType.replace(/^boost-/, "")} ·{" "}
                    {p.boostDurationDays}d
                  </TableCell>
                  <TableCell>
                    <div className="flex flex-col gap-1">
                      <span>{formatMoney(p.amount, p.currency)}</span>
                      {/* On narrow viewports the Provider column is
                       * hidden — surface it under the amount instead
                       * so the row never leaves the operator guessing
                       * by currency symbol alone. */}
                      <ProviderTag
                        provider={providerOf(p)}
                        className="md:hidden"
                      />
                    </div>
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <ProviderTag provider={providerOf(p)} />
                  </TableCell>
                  <TableCell>
                    <Badge
                      className={`ring-1 ${STATUS_STYLES[p.status] || ""}`}
                    >
                      {p.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-xs text-gray-500">
                    {format(new Date(p.createdAt), "PP")}
                  </TableCell>
                  <TableCell className="text-right">
                    <RowActions
                      payment={p}
                      onChoose={setDialogTarget}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      <AlertDialog
        open={!!dialogTarget}
        onOpenChange={(open) => {
          if (!open && dialogBusy) return;
          if (!open) setDialogTarget(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{dialogCopy.title}</AlertDialogTitle>
            <AlertDialogDescription>{dialogCopy.body}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={dialogBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={(e) => {
                e.preventDefault();
                void handleConfirm();
              }}
              disabled={dialogBusy}
              className={cn(
                buttonVariants({
                  variant:
                    dialogTarget?.kind === "verify" ? "default" : "destructive",
                }),
                "gap-2",
              )}
            >
              {dialogBusy && <Loader2 className="h-4 w-4 animate-spin" />}
              {dialogBusy ? dialogCopy.busyLabel : dialogCopy.confirmLabel}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

function toolNameOf(payment: AdminPayment): string {
  if (typeof payment.toolId === "object" && payment.toolId?.name) {
    return payment.toolId.name;
  }
  return "this tool";
}

function ProviderTag({
  provider,
  className,
}: {
  provider: string | null;
  className?: string;
}) {
  if (!provider) {
    return (
      <span className={cn("text-xs text-gray-400", className)}>—</span>
    );
  }
  return (
    <Badge className={cn("ring-1", PROVIDER_BADGE_CLASS, className)}>
      {PROVIDER_LABEL[provider] || provider}
    </Badge>
  );
}

function dialogCopyFor(target: DialogTarget) {
  if (!target) {
    return {
      title: "",
      body: "",
      confirmLabel: "Confirm",
      busyLabel: "Working…",
    };
  }
  const name = toolNameOf(target.payment);
  const money = formatMoney(target.payment.amount, target.payment.currency);
  if (target.kind === "verify") {
    return {
      title: `Verify with ${
        target.payment.provider === "paypal" ? "PayPal" : "Cashfree"
      }?`,
      body: `Asks ${
        target.payment.provider === "paypal" ? "PayPal" : "Cashfree"
      } for the current status of order ${target.payment.orderId}. If it reports PAID/COMPLETED, the boost on ${name} is activated; if EXPIRED/TERMINATED, the row is closed as failed.`,
      confirmLabel: "Verify",
      busyLabel: "Verifying…",
    };
  }
  if (target.kind === "mark-failed") {
    return {
      title: `Force-close ${name} payment as failed?`,
      body: `Manual override. Use only when neither the webhook nor the provider's order-status API has resolved this ${money} pending row. The override is stamped with your admin id.`,
      confirmLabel: "Mark failed",
      busyLabel: "Marking…",
    };
  }
  return {
    title: `Refund ${money} for ${name}?`,
    body: `This calls ${
      target.payment.provider === "paypal" ? "PayPal" : "Cashfree"
    } to issue a full refund against order ${target.payment.orderId}. The boost is removed from ${name} when the refund webhook confirms. This cannot be undone.`,
    confirmLabel: "Refund",
    busyLabel: "Refunding…",
  };
}

function RowActions({
  payment,
  onChoose,
}: {
  payment: AdminPayment;
  onChoose: (target: DialogTarget) => void;
}) {
  if (payment.status === "pending") {
    return (
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem
            onClick={() => onChoose({ kind: "verify", payment })}
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            Verify with provider
          </DropdownMenuItem>
          <DropdownMenuItem
            onClick={() => onChoose({ kind: "mark-failed", payment })}
            className="text-red-600"
          >
            <XCircle className="mr-2 h-4 w-4" />
            Mark failed
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }
  if (payment.status === "success") {
    // Once a refund is in flight (SUCCESS or PENDING), the row
    // shows the status badge instead of a fresh Refund button so
    // the admin doesn't double-fire. FAILED is allowed to retry.
    if (
      payment.refundStatus === "SUCCESS" ||
      payment.refundStatus === "PENDING" ||
      payment.refundStatus === "ONHOLD"
    ) {
      return (
        <Badge
          className={`ring-1 ${REFUND_STYLES[payment.refundStatus] || ""}`}
        >
          {REFUND_LABELS[payment.refundStatus] || payment.refundStatus}
        </Badge>
      );
    }
    return (
      <Button
        size="sm"
        variant="outline"
        onClick={() => onChoose({ kind: "refund", payment })}
      >
        <Undo2 className="mr-1 h-3.5 w-3.5" />
        Refund
      </Button>
    );
  }
  if (payment.status === "refunded") {
    return (
      <Badge className={`ring-1 ${REFUND_STYLES.SUCCESS}`}>
        {REFUND_LABELS.SUCCESS}
      </Badge>
    );
  }
  // failed / dropped — no actions surfaced.
  return null;
}
