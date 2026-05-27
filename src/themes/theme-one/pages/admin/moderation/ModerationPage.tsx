"use client";

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { toast } from "@/components/ui/use-toast";
import { ExternalLink, Check, X } from "lucide-react";
import { useCategories } from "@/hooks/useCategories";
import { RejectToolDialog } from "@/components/admin/moderation/RejectToolDialog";

interface PendingTool {
  id: string;
  name: string;
  slug: string;
  description: string;
  description_ai?: string;
  websiteUrl: string;
  category: string;
  logo?: string;
  status: string;
  listingStatus: string;
  ownerUserId?: string;
  ownerEmail?: string;
  ownerName?: string;
  createdAt: string;
}

const LISTING_STATUS_STYLES: Record<string, string> = {
  "paid-active": "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
  "free-seeded": "bg-emerald-50 text-emerald-700 ring-emerald-200/60",
  "unpaid-pending": "bg-amber-50 text-amber-700 ring-amber-200/60",
  "unpaid-hidden": "bg-red-50 text-red-700 ring-red-200/60",
};

export default function ModerationPage() {
  const qc = useQueryClient();
  const [page] = useState(1);
  const [rejectTarget, setRejectTarget] = useState<PendingTool | null>(null);
  // Per-row category overrides — only set when an admin changes the
  // dropdown before clicking Approve. Tool.id → slug.
  const [categoryOverride, setCategoryOverride] = useState<Record<string, string>>({});

  const { data: catData } = useCategories();
  const categories = catData?.data ?? [];

  const { data, isLoading, error } = useQuery({
    queryKey: ["admin-pending-tools", page],
    queryFn: async (): Promise<{ items: PendingTool[]; total: number }> => {
      const r = await fetch(`/api/admin/tools/pending?page=${page}`, {
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed to fetch pending tools");
      return r.json();
    },
  });

  const approveMut = useMutation({
    mutationFn: async ({ id, category }: { id: string; category?: string }) => {
      const r = await fetch(`/api/admin/tools/${id}/approve`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(category ? { category } : {}),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || "Approve failed");
      }
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Approved" });
      qc.invalidateQueries({ queryKey: ["admin-pending-tools"] });
    },
    onError: (err) => {
      toast({
        title: "Approve failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const rejectMut = useMutation({
    mutationFn: async ({ id, reason }: { id: string; reason: string | null }) => {
      const r = await fetch(`/api/admin/tools/${id}/reject`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(reason ? { reason } : {}),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || "Reject failed");
      }
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Tool rejected" });
      qc.invalidateQueries({ queryKey: ["admin-pending-tools"] });
    },
    onError: (err) => {
      // Re-throw so the dialog can surface the error and stay open.
      toast({
        title: "Reject failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
      throw err;
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Tool moderation</h1>
        <p className="text-sm text-gray-500">
          Review pending submissions. Approve to publish (becomes
          publicly visible once the subscription is paid-active), or
          reject with a reason that surfaces to the submitter.
        </p>
      </div>

      {isLoading ? (
        <div className="text-sm text-gray-500 py-10 text-center">Loading…</div>
      ) : error ? (
        <div className="text-sm text-red-600 py-10 text-center">
          {error instanceof Error ? error.message : "Failed to load"}
        </div>
      ) : (data?.items ?? []).length === 0 ? (
        <div className="text-center bg-white border border-dashed border-gray-300 rounded-2xl py-16">
          <p className="text-sm text-gray-600">No pending tools. Nice work.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {data!.items.map((t) => {
            const overrideSlug = categoryOverride[t.id] ?? t.category;
            const listingMeta = LISTING_STATUS_STYLES[t.listingStatus] || "bg-gray-100 text-gray-700 ring-gray-200/60";
            const knownCat = categories.find((c) => c.slug === t.category);
            return (
              <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-5">
                <div className="flex items-start justify-between gap-4 flex-wrap">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h3 className="text-base font-semibold text-gray-900">{t.name}</h3>
                      <Badge className={`ring-1 ${listingMeta}`}>{t.listingStatus}</Badge>
                      {!knownCat && (
                        <Badge className="ring-1 bg-amber-50 text-amber-700 ring-amber-200/60">
                          unknown category: {t.category}
                        </Badge>
                      )}
                    </div>
                    <p className="mt-1 text-xs text-gray-500">
                      Submitted {format(new Date(t.createdAt), "PP p")}
                      {t.ownerEmail && (
                        <> · by <span className="text-gray-700">{t.ownerEmail}</span></>
                      )}
                      {t.ownerName && <> ({t.ownerName})</>}
                    </p>
                    <p className="mt-3 text-sm text-gray-700 whitespace-pre-wrap">
                      {t.description_ai || t.description}
                    </p>
                    <a
                      href={t.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-2 inline-flex items-center text-xs text-orange-600 hover:underline"
                    >
                      {t.websiteUrl}
                      <ExternalLink className="w-3 h-3 ml-1" />
                    </a>
                  </div>

                  <div className="flex flex-col gap-2 shrink-0 w-full sm:w-56">
                    <Label className="text-xs text-gray-500">Category</Label>
                    <Select
                      value={overrideSlug}
                      onValueChange={(v) =>
                        setCategoryOverride((m) => ({ ...m, [t.id]: v }))
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Pick a category" />
                      </SelectTrigger>
                      <SelectContent className="max-h-72">
                        {categories.map((c) => (
                          <SelectItem key={c.slug} value={c.slug}>
                            {c.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <div className="flex gap-2 mt-2">
                      <Button
                        size="sm"
                        disabled={approveMut.isPending}
                        onClick={() =>
                          approveMut.mutate({
                            id: t.id,
                            // Only send if changed from the stored value.
                            category: overrideSlug !== t.category ? overrideSlug : undefined,
                          })
                        }
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white flex-1"
                      >
                        <Check className="w-4 h-4 mr-1" />
                        Approve
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        disabled={rejectMut.isPending}
                        onClick={() => setRejectTarget(t)}
                        className="text-red-600 border-red-200 hover:bg-red-50 flex-1"
                      >
                        <X className="w-4 h-4 mr-1" />
                        Reject
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <RejectToolDialog
        tool={rejectTarget ? { id: rejectTarget.id, name: rejectTarget.name } : null}
        open={!!rejectTarget}
        onOpenChange={(o) => !o && setRejectTarget(null)}
        onConfirm={async (reason) => {
          if (!rejectTarget) return;
          await rejectMut.mutateAsync({ id: rejectTarget.id, reason });
        }}
      />
    </div>
  );
}
