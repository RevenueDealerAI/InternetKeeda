"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import Script from "next/script";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, Plus, Sparkles, XCircle, Edit, ChevronDown, ChevronUp, Trash2, LayoutGrid } from "lucide-react";
import { BoostModal } from "./BoostModal";
import { PlansModal } from "./PlansModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCreateSubscription, useMySubscriptions, useCancelSubscription } from "@/lib/api/subscriptions";
import { toast } from "@/components/ui/use-toast";
import { PaymentMethodPicker } from "@/components/payment/PaymentMethodPicker";
import { enabledProviders, type PaymentProvider } from "@/lib/payment/providers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";

// Cashfree's hosted-checkout JS SDK. Same loader and version as
// BoostModal — only the SDK *method* differs (subscriptionsCheckout
// vs checkout). The SDK exposes both off the same `window.Cashfree`.
const CF_SDK_URL = "https://sdk.cashfree.com/js/v3/cashfree.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { Cashfree?: any } }

interface MyTool {
  id: string;
  name: string;
  slug: string;
  logo?: string;
  category: string;
  description?: string;
  websiteUrl?: string;
  status: string;
  listingStatus: string;
  activeBoosts: Array<"category-top" | "home-rotation" | "featured-badge">;
  boostExpiresAt: Partial<Record<string, string>>;
  rejectionReason?: string;
  rejectedAt?: string;
  createdAt: string;
}

/**
 * Derived status pill per row. Single source of truth for what the
 * user sees — collapses (toolStatus, listingStatus, sub.status) into
 * one badge so the row never renders the old "Awaiting Payment +
 * Awaiting authorization" double-pill that confused users.
 */
function pillFor(
  toolStatus: string,
  listingStatus: string,
  subStatus: string | undefined,
): { label: string; className: string } {
  if (toolStatus === "rejected") {
    return { label: "Rejected", className: "bg-slate-100 text-slate-700 ring-slate-200/60" };
  }
  if (toolStatus === "pending") {
    return { label: "In review", className: "bg-amber-50 text-amber-700 ring-amber-200/60" };
  }
  if (listingStatus === "paid-active") {
    return { label: "Live", className: "bg-emerald-50 text-emerald-700 ring-emerald-200/60" };
  }
  if (listingStatus === "paid-expired") {
    return { label: "Expired", className: "bg-amber-50 text-amber-700 ring-amber-200/60" };
  }
  if (listingStatus === "unpaid-hidden") {
    return { label: "Hidden", className: "bg-red-50 text-red-700 ring-red-200/60" };
  }
  if (listingStatus === "free-seeded") {
    return { label: "Free Seeded", className: "bg-emerald-50 text-emerald-700 ring-emerald-200/60" };
  }
  // unpaid-pending: branch on the Subscription state so the user
  // gets one of the two payment-flow pills instead of both at once.
  if (subStatus === "initialized") {
    return {
      label: "Authorizing Payment…",
      className: "bg-amber-50 text-amber-700 ring-amber-200/60",
    };
  }
  return {
    label: "Payment Required",
    className: "bg-red-50 text-red-700 ring-red-200/60",
  };
}

export function MyToolsTab() {
  const [boostTarget, setBoostTarget] = useState<MyTool | null>(null);
  const [plansTarget, setPlansTarget] = useState<MyTool | null>(null);
  const [editTarget, setEditTarget] = useState<MyTool | null>(null);
  const [expandedReason, setExpandedReason] = useState<Record<string, boolean>>({});
  const [sdkReady, setSdkReady] = useState(false);
  // When more than one provider is enabled, clicking Activate opens
  // this picker first. With only Cashfree enabled today, the picker
  // is auto-skipped and we go straight to the Cashfree flow — see
  // handleActivate.
  const [pickerTarget, setPickerTarget] = useState<MyTool | null>(null);
  const createSub = useCreateSubscription();
  const cancelSub = useCancelSubscription();
  const { data: subData } = useMySubscriptions();
  const qc = useQueryClient();
  const { data: catData } = useCategories();
  const categories = catData?.data ?? [];

  const deleteToolMut = useMutation({
    mutationFn: async (toolId: string) => {
      const r = await fetch(`/api/tools/${toolId}`, {
        method: "DELETE",
        credentials: "include",
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || "Delete failed");
      }
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Tool deleted" });
      qc.invalidateQueries({ queryKey: ["my-tools"] });
      qc.invalidateQueries({ queryKey: ["my-subscriptions"] });
    },
    onError: (err) => {
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const handleDelete = (tool: MyTool) => {
    if (!confirm(`Delete "${tool.name}"? This cannot be undone.`)) return;
    deleteToolMut.mutate(tool.id);
  };

  const resubmitMut = useMutation({
    mutationFn: async ({
      id,
      data,
    }: {
      id: string;
      data: { name: string; websiteUrl: string; description: string; category: string };
    }) => {
      const r = await fetch(`/api/tools/${id}/resubmit`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(data),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || "Resubmit failed");
      }
      return r.json();
    },
    onSuccess: () => {
      toast({ title: "Resubmitted", description: "Your tool is back in review." });
      setEditTarget(null);
      qc.invalidateQueries({ queryKey: ["my-tools"] });
    },
    onError: (err) => {
      toast({
        title: "Resubmit failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["my-tools"],
    queryFn: async (): Promise<{ tools: MyTool[] }> => {
      const r = await fetch("/api/tools/mine", { credentials: "include" });
      if (!r.ok) throw new Error("Failed to fetch your tools");
      return r.json();
    },
  });

  // Map toolId → active subscription (initialized / active / paused).
  const subsByTool = new Map<string, { subscriptionId: string; status: string }>();
  for (const s of subData?.subscriptions ?? []) {
    const tid = typeof s.toolId === "object" ? s.toolId._id : s.toolId;
    if (!tid) continue;
    if (["initialized", "active", "paused"].includes(s.status)) {
      subsByTool.set(String(tid), { subscriptionId: s.subscriptionId, status: s.status });
    }
  }

  // Click handler on the per-row Activate button. With one enabled
  // provider, dispatch immediately. With two+, open the picker and
  // let the user choose; the picker fires handleActivateWithProvider
  // for the chosen one.
  const handleActivate = (tool: MyTool) => {
    const enabled = enabledProviders();
    if (enabled.length <= 1) {
      const only = enabled[0]?.id ?? "cashfree";
      handleActivateWithProvider(tool, only);
    } else {
      setPickerTarget(tool);
    }
  };

  const handleActivateWithProvider = async (
    tool: MyTool,
    provider: PaymentProvider,
  ) => {
    setPickerTarget(null);
    if (provider === "paypal") {
      try {
        const r = await fetch("/api/payments/paypal/create-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ toolId: tool.id }),
        });
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || "Failed to start PayPal subscription");
        }
        const { approveUrl } = (await r.json()) as { approveUrl: string };
        if (!approveUrl) throw new Error("PayPal did not return an approve URL");
        window.location.href = approveUrl;
      } catch (err) {
        toast({
          title: "Could not start PayPal",
          description: err instanceof Error ? err.message : "Unknown error",
          variant: "destructive",
        });
      }
      return;
    }
    // provider === 'cashfree' — existing flow.
    let session;
    try {
      session = await createSub.mutateAsync({ toolId: tool.id });
    } catch (err) {
      toast({
        title: "Could not start subscription",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
      return;
    }

    if (!session.sessionId) {
      toast({
        title: "Cashfree didn't return a session",
        description: "Please retry. If this keeps happening, contact support.",
        variant: "destructive",
      });
      return;
    }

    // Cashfree subscription auth flow: hand the session_id to the
    // hosted-checkout SDK and let it redirect to CF's authorization
    // page. CF bounces the user back to returnUrl after the mandate
    // is set up.
    if (!window.Cashfree) {
      toast({
        title: "Payment gateway unavailable",
        description: "Cashfree SDK didn't load. Please retry.",
        variant: "destructive",
      });
      return;
    }

    try {
      const cashfree = window.Cashfree({ mode: session.mode });
      // Cashfree's redirect doesn't reliably template-substitute
      // `{subscription_id}` in the return URL we hand it. Some
      // attempts come back with the literal placeholder string. To
      // avoid that whole class of bug, bridge the id via
      // localStorage and pass a clean URL with no query params.
      // The return page reads localStorage first, URL params second.
      try {
        window.localStorage.setItem(
          "ik_pending_subscription_id",
          session.subscriptionId,
        );
      } catch {
        // Private mode / blocked storage — fall back to URL only.
      }
      // /subscription/return-bounce is a route handler that accepts
      // Cashfree's form POST, extracts subscription_id from the body,
      // and 303-redirects to /subscription/return?subscription_id=…
      // The page can't do this itself (Next.js page.tsx serves GET
      // only — POST yields 405).
      const returnUrl = `${window.location.origin}/subscription/return-bounce`;
      // NOTE: the browser SDK v3 calls this field `subsSessionId`.
      // The server-side cashfree-pg SDK returns it as
      // `subscription_session_id`. Different SDKs, different naming;
      // the browser-side one wins because that's who we're calling.
      const result = await cashfree.subscriptionsCheckout({
        subsSessionId: session.sessionId,
        returnUrl,
        redirectTarget: "_self",
      });

      // The SDK does NOT throw on option-validation errors — it
      // resolves with { error: { e, message } }. Without surfacing
      // this, a misnamed field looks like a no-op to the user.
      if (result?.error) {
        const errObj = result.error as { e?: string; message?: string };
        toast({
          title: "Cashfree authorization failed",
          description: errObj.e || errObj.message || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Authorization failed to start",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const handleCancel = async (subscriptionId: string) => {
    if (!confirm("Cancel this subscription? Your tool will be hidden from the directory.")) return;
    try {
      await cancelSub.mutateAsync({ subscriptionId });
      toast({
        title: "Cancellation requested",
        description: "Cashfree will confirm in a moment. Refresh the page if needed.",
      });
      setTimeout(refetch, 1500);
    } catch (err) {
      toast({
        title: "Cancel failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  if (isLoading) return <div className="text-sm text-gray-500 py-10 text-center">Loading your tools…</div>;
  if (error) return <div className="text-sm text-red-600 py-10 text-center">{error instanceof Error ? error.message : "Failed to load"}</div>;
  const tools = data?.tools ?? [];

  if (tools.length === 0) {
    return (
      <div className="text-center bg-white border border-dashed border-gray-300 rounded-2xl py-16 px-6">
        <h3 className="text-lg font-semibold text-gray-900">You haven&apos;t submitted any tools yet</h3>
        <p className="mt-2 text-sm text-gray-600">Listings show up here once you submit one.</p>
        <div className="mt-5">
          <Link href="/submit-tool">
            <Button className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
              <Plus className="w-4 h-4 mr-1" />
              Submit a tool
            </Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <>
      <Script
        src={CF_SDK_URL}
        strategy="lazyOnload"
        onLoad={() => setSdkReady(true)}
      />
      <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-semibold text-gray-900">My Tools</h2>
        <Link href="/submit-tool">
          <Button variant="outline">
            <Plus className="w-4 h-4 mr-1" />
            Submit another
          </Button>
        </Link>
      </div>

      <div className="grid gap-3">
        {tools.map((t) => {
          const sub = subsByTool.get(t.id);
          const statusPill = pillFor(t.status, t.listingStatus, sub?.status);
          const isRejected = t.status === "rejected";
          const isPendingReview = t.status === "pending";
          // Don't show Activate / Retry while the tool is in admin
          // review or rejected — paying before approval is wasteful.
          const blockedByModeration = isRejected || isPendingReview;
          // First-time Activate: never tried paying yet.
          const needsActivation =
            t.listingStatus === "unpaid-pending" && !sub && !blockedByModeration;
          // Retry: there's an initialized sub row (or failed renewal)
          // but no successful charge. Same handler — the API cleans
          // the abandoned row and creates fresh for whichever provider
          // the user picks in the picker.
          const needsRetry =
            t.listingStatus === "unpaid-pending" &&
            (sub?.status === "initialized" || sub?.status === "failed") &&
            !blockedByModeration;
          const isActive = t.listingStatus === "paid-active" && sub?.status === "active";
          // Owner can soft-delete tools that aren't currently live.
          // Seeded directory rows + paid-active rows are excluded —
          // those go through admin or subscription-cancel respectively.
          const canDelete =
            t.listingStatus !== "paid-active" &&
            t.listingStatus !== "free-seeded";
          const reasonOpen = !!expandedReason[t.id];

          return (
            <div key={t.id} className="bg-white border border-gray-200 rounded-xl p-4">
              <div className="flex items-center gap-4">
                <div className="relative w-12 h-12 shrink-0 rounded-lg overflow-hidden bg-gradient-to-br from-orange-50 to-gray-50 ring-1 ring-gray-200/80">
                  {t.logo ? (
                    <Image src={t.logo} alt={t.name} fill sizes="48px" className="object-cover" unoptimized />
                  ) : (
                    <div className="absolute inset-0 grid place-items-center text-orange-500 font-bold">
                      {t.name.slice(0, 1).toUpperCase()}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="text-sm font-semibold text-gray-900 truncate">{t.name}</h3>
                    <Badge className={`ring-1 ${statusPill.className}`}>{statusPill.label}</Badge>
                    {t.activeBoosts.map((b) => (
                      <Badge key={b} className="bg-gradient-to-r from-orange-500 to-red-600 text-white ring-0">
                        {b.replace(/-/g, " ")}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-xs text-gray-500 truncate">{t.category}</p>
                </div>
                <div className="flex items-center gap-2">
                  {isRejected && (
                    <Button
                      size="sm"
                      onClick={() => setEditTarget(t)}
                      className="bg-gradient-to-r from-orange-500 to-red-600 text-white"
                    >
                      <Edit className="w-4 h-4 mr-1" />
                      Edit & resubmit
                    </Button>
                  )}
                  {needsActivation && (
                    <Button
                      size="sm"
                      onClick={() => handleActivate(t)}
                      disabled={createSub.isPending || !sdkReady}
                      className="bg-gradient-to-r from-emerald-500 to-emerald-600 text-white"
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      {sdkReady ? "Activate $10/mo" : "Loading…"}
                    </Button>
                  )}
                  {!blockedByModeration && t.listingStatus !== "free-seeded" && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setPlansTarget(t)}
                      disabled={!sdkReady}
                      title="View all plans"
                    >
                      <LayoutGrid className="w-4 h-4 mr-1" />
                      All plans
                    </Button>
                  )}
                  {needsRetry && (
                    <Button
                      size="sm"
                      onClick={() => handleActivate(t)}
                      disabled={createSub.isPending || !sdkReady}
                      className="bg-gradient-to-r from-orange-500 to-red-600 text-white"
                    >
                      <Sparkles className="w-4 h-4 mr-1" />
                      {sdkReady ? "Retry Payment" : "Loading…"}
                    </Button>
                  )}
                  {isActive && (
                    <>
                      <Button
                        size="sm"
                        onClick={() => setBoostTarget(t)}
                        className="bg-gradient-to-r from-orange-500 to-red-600 text-white"
                      >
                        <Rocket className="w-4 h-4 mr-1" /> Boost
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => sub && handleCancel(sub.subscriptionId)}
                        disabled={cancelSub.isPending}
                      >
                        <XCircle className="w-4 h-4 text-gray-400" />
                      </Button>
                    </>
                  )}
                  {t.listingStatus === "free-seeded" && (
                    <span className="text-xs text-gray-400">Grandfathered free</span>
                  )}
                  {canDelete && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => handleDelete(t)}
                      disabled={deleteToolMut.isPending}
                      aria-label={`Delete ${t.name}`}
                      title="Delete tool"
                      className="text-slate-400 hover:text-red-600 hover:bg-red-50"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  )}
                </div>
              </div>

              {isRejected && t.rejectionReason && (
                <div className="mt-3 ml-16 text-xs">
                  <button
                    type="button"
                    onClick={() =>
                      setExpandedReason((m) => ({ ...m, [t.id]: !reasonOpen }))
                    }
                    className="inline-flex items-center text-red-700 hover:underline"
                  >
                    {reasonOpen ? (
                      <>
                        Hide reason
                        <ChevronUp className="w-3 h-3 ml-1" />
                      </>
                    ) : (
                      <>
                        View reason
                        <ChevronDown className="w-3 h-3 ml-1" />
                      </>
                    )}
                  </button>
                  {reasonOpen && (
                    <p className="mt-2 p-3 bg-red-50 border border-red-100 rounded-md text-red-900 whitespace-pre-wrap">
                      {t.rejectionReason}
                    </p>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Edit & resubmit modal */}
      <Dialog open={!!editTarget} onOpenChange={(o) => !o && setEditTarget(null)}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle>Edit and resubmit</DialogTitle>
          </DialogHeader>
          {editTarget && (
            <ResubmitForm
              tool={editTarget}
              categories={categories}
              busy={resubmitMut.isPending}
              onCancel={() => setEditTarget(null)}
              onSubmit={(data) => resubmitMut.mutate({ id: editTarget.id, data })}
            />
          )}
        </DialogContent>
      </Dialog>

      {boostTarget && (
        <BoostModal
          open={!!boostTarget}
          onOpenChange={(o) => !o && setBoostTarget(null)}
          toolId={boostTarget.id}
          toolName={boostTarget.name}
          sdkReady={sdkReady}
        />
      )}

      {plansTarget && (
        <PlansModal
          open={!!plansTarget}
          onOpenChange={(o) => !o && setPlansTarget(null)}
          toolId={plansTarget.id}
          toolName={plansTarget.name}
          sdkReady={sdkReady}
          listingActive={
            plansTarget.listingStatus === "paid-active" &&
            subsByTool.get(plansTarget.id)?.status === "active"
          }
        />
      )}

      {pickerTarget && (
        <PaymentMethodPicker
          open={!!pickerTarget}
          orderType="subscription"
          amount={10}
          currency="USD"
          productLabel={`Listing for ${pickerTarget.name}`}
          onSelect={(provider) => handleActivateWithProvider(pickerTarget, provider)}
          onCancel={() => setPickerTarget(null)}
        />
      )}
      </div>
    </>
  );
}

interface ResubmitFormProps {
  tool: MyTool;
  categories: Array<{ slug: string; name: string }>;
  busy: boolean;
  onCancel: () => void;
  onSubmit: (data: { name: string; websiteUrl: string; description: string; category: string }) => void;
}

function ResubmitForm({ tool, categories, busy, onCancel, onSubmit }: ResubmitFormProps) {
  const [name, setName] = useState(tool.name);
  const [websiteUrl, setWebsiteUrl] = useState(tool.websiteUrl ?? "");
  const [description, setDescription] = useState(tool.description ?? "");
  const [category, setCategory] = useState(tool.category);

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!category) {
          toast({ title: "Pick a category", variant: "destructive" });
          return;
        }
        onSubmit({ name, websiteUrl, description, category });
      }}
      className="space-y-4"
    >
      <div>
        <Label htmlFor="resub-name">Tool name</Label>
        <Input id="resub-name" required minLength={2} value={name} onChange={(e) => setName(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="resub-url">Website</Label>
        <Input id="resub-url" required type="url" value={websiteUrl} onChange={(e) => setWebsiteUrl(e.target.value)} />
      </div>
      <div>
        <Label htmlFor="resub-cat">Category</Label>
        <Select value={category} onValueChange={setCategory}>
          <SelectTrigger id="resub-cat">
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
      </div>
      <div>
        <Label htmlFor="resub-desc">Short description</Label>
        <Textarea
          id="resub-desc"
          required
          minLength={20}
          maxLength={2000}
          rows={4}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
        />
      </div>
      <div className="flex justify-end gap-2 pt-2">
        <Button type="button" variant="ghost" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={busy} className="bg-gradient-to-r from-orange-500 to-red-600 text-white">
          {busy ? "Resubmitting…" : "Resubmit for review"}
        </Button>
      </div>
    </form>
  );
}
