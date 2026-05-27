"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

interface RejectToolDialogProps {
  tool: { id: string; name: string } | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onConfirm: (reason: string | null) => Promise<void>;
}

/**
 * Shared reject-confirmation dialog used by the admin dashboard
 * pending-review queue and the dedicated /admin/moderation page.
 * Reason is optional — server-side enforcement is in
 * /api/admin/tools/[id]/reject.
 *
 * Local error state stays inside the dialog so a failed reject
 * doesn't dismiss it; the caller still gets the Promise rejection
 * for toast/log handling.
 */
export function RejectToolDialog({
  tool,
  open,
  onOpenChange,
  onConfirm,
}: RejectToolDialogProps) {
  const [reason, setReason] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Reset form when target changes (e.g. operator clicks Reject on a
  // different row without closing the previous dialog).
  useEffect(() => {
    if (open) {
      setReason("");
      setError(null);
      setBusy(false);
    }
  }, [open, tool?.id]);

  const handleConfirm = async () => {
    setBusy(true);
    setError(null);
    try {
      const trimmed = reason.trim();
      await onConfirm(trimmed.length > 0 ? trimmed : null);
      onOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Reject failed");
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(o) => !busy && onOpenChange(o)}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject this tool?</DialogTitle>
          <DialogDescription>
            {tool ? (
              <>
                <span className="font-medium text-gray-900">{tool.name}</span>{" "}
                will be marked rejected and the submitter will see the
                reason on their dashboard.
              </>
            ) : (
              "Tool will be marked rejected."
            )}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-3">
          <Label htmlFor="reject-tool-reason" className="text-sm">
            Why are you rejecting this tool? (optional)
          </Label>
          <Textarea
            id="reject-tool-reason"
            rows={4}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. Doesn't fit our catalog, broken website, duplicate listing..."
            disabled={busy}
          />

          {error && (
            <div className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
              {error}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2">
            <Button variant="ghost" disabled={busy} onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              disabled={busy}
              onClick={handleConfirm}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {busy ? "Rejecting…" : "Reject"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
