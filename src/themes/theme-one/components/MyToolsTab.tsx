"use client";

import { useState } from "react";
import Link from "next/link";
import Script from "next/script";
import { formatDistanceToNow, format as formatDate } from "date-fns";
import { ToolLogo } from "@/components/nexus/ToolLogo";
import type { Tool } from "@/types/tool";
import { Button, buttonVariants } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Rocket, Plus, Sparkles, XCircle, Edit, ChevronDown, ChevronUp, Trash2, LayoutGrid, Loader2 } from "lucide-react";
import { BoostModal } from "./BoostModal";
import { PlansModal } from "./PlansModal";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useCreateSubscription, useMySubscriptions, useCancelSubscription } from "@/lib/api/subscriptions";
import { toast } from "@/components/ui/use-toast";
import { PaymentMethodPicker } from "@/components/payment/PaymentMethodPicker";
import { enabledProviders, type PaymentProvider } from "@/lib/payment/providers";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
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
import { WhatsAppSupportButton } from "@/components/nexus/WhatsAppSupportButton";
import {
  PhoneRequiredDialog,
  fetchProfileStatus,
} from "@/components/nexus/PhoneRequiredDialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCategories } from "@/hooks/useCategories";
import { cn } from "@/lib/utils";
import { useRouter } from "next/navigation";

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
  deletedAt?: string;
}

type DeleteStage = "A" | "B" | "C";
interface DeleteTarget {
  tool: MyTool;
  stage: DeleteStage;
  /** Set on the State C upgrade so the modal shows the actual
   *  earliest expiry the server returned, even if the client-side
   *  boostExpiresAt was missing or stale. */
  serverEarliestBoostExpiresAt?: string;
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
  const [deleteTarget, setDeleteTarget] = useState<DeleteTarget | null>(null);
  const [showDeleted, setShowDeleted] = useState(false);
  const [phoneRequiredOpen, setPhoneRequiredOpen] = useState(false);
  const createSub = useCreateSubscription();
  const cancelSub = useCancelSubscription();
  const { data: subData } = useMySubscriptions();
  const qc = useQueryClient();
  const { data: catData } = useCategories();
  const categories = catData?.data ?? [];
  const router = useRouter();

  const deleteToolMut = useMutation({
    mutationFn: async (input: { toolId: string; confirmForfeitBoost?: boolean }) => {
      const r = await fetch(`/api/tools/${input.toolId}`, {
        method: "DELETE",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          confirmForfeitBoost: input.confirmForfeitBoost === true,
        }),
      });
      const body = await r.json().catch(() => ({}));
      if (!r.ok) {
        // Surface the structured error code so the modal can branch.
        const err = new Error(body?.error || "Delete failed") as Error & {
          code?: string;
          payload?: Record<string, unknown>;
        };
        err.code = body?.error;
        err.payload = body;
        throw err;
      }
      return body;
    },
    onSuccess: () => {
      toast({ title: "Tool deleted" });
      qc.invalidateQueries({ queryKey: ["my-tools"] });
      qc.invalidateQueries({ queryKey: ["my-tools", "deleted"] });
      qc.invalidateQueries({ queryKey: ["my-subscriptions"] });
    },
    onError: (err) => {
      // Suppress the toast for the 409 forfeit-not-confirmed signal —
      // the modal upgrades to State C in-place instead of toasting an
      // error the user can't act on.
      const code = (err as Error & { code?: string }).code;
      if (code === "BOOST_FORFEIT_NOT_CONFIRMED") return;
      toast({
        title: "Delete failed",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    },
  });

  /** Pick which dialog stage to show, using already-fetched data
   *  on the page (no extra round-trip). Server is the final word —
   *  if it disagrees (race against subscription cancel landing
   *  mid-modal) the catch block in confirmDelete upgrades the
   *  dialog to the right stage. */
  const stageFor = (tool: MyTool, sub?: { status?: string }): DeleteStage => {
    if (sub && (sub.status === "active" || sub.status === "paused")) return "B";
    const now = Date.now();
    const hasActiveBoost = Object.values(tool.boostExpiresAt || {}).some(
      (iso) => iso && new Date(iso).getTime() > now,
    );
    if (hasActiveBoost) return "C";
    return "A";
  };

  const handleDelete = (tool: MyTool) => {
    const sub = subsByTool.get(tool.id);
    setDeleteTarget({ tool, stage: stageFor(tool, sub) });
  };

  const confirmDelete = async () => {
    if (!deleteTarget) return;
    try {
      await deleteToolMut.mutateAsync({
        toolId: deleteTarget.tool.id,
        confirmForfeitBoost: deleteTarget.stage === "C",
      });
      setDeleteTarget(null);
    } catch (err) {
      const code = (err as Error & { code?: string }).code;
      const payload = (err as Error & {
        payload?: { earliestBoostExpiresAt?: string; subscriptionId?: string };
      }).payload;
      // Server raced ahead of the client view — upgrade the dialog
      // in place to the stage the server demands rather than closing
      // and forcing the operator to re-click Delete.
      if (code === "BOOST_FORFEIT_NOT_CONFIRMED") {
        setDeleteTarget((t) =>
          t
            ? {
                ...t,
                stage: "C",
                serverEarliestBoostExpiresAt: payload?.earliestBoostExpiresAt,
              }
            : null,
        );
        return;
      }
      if (code === "ACTIVE_SUBSCRIPTION") {
        setDeleteTarget((t) => (t ? { ...t, stage: "B" } : null));
        return;
      }
      // Other errors fall through to the mutation's onError toast.
      setDeleteTarget(null);
    }
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
  const deletedQuery = useQuery({
    queryKey: ["my-tools", "deleted"],
    enabled: showDeleted,
    queryFn: async (): Promise<{ tools: MyTool[] }> => {
      const r = await fetch("/api/tools/mine?deletedOnly=true", {
        credentials: "include",
      });
      if (!r.ok) throw new Error("Failed to fetch deleted tools");
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
  //
  // Pre-flight phone check is intentionally Cashfree-only: PayPal
  // subscriptions don't require a phone, and adding the modal in
  // front of the PayPal path would push users to add a phone they
  // don't actually need for their chosen provider.
  const handleActivate = async (tool: MyTool) => {
    const enabled = enabledProviders();
    if (enabled.length <= 1) {
      const only = enabled[0]?.id ?? "cashfree";
      if (only === "cashfree") {
        const status = await fetchProfileStatus();
        if (status && !status.hasVerifiedPhone) {
          setPhoneRequiredOpen(true);
          return;
        }
      }
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
    // Pre-flight phone check (matches the gate on /handleActivate
    // for the single-provider case). The server returns 400
    // PHONE_REQUIRED if missing; this just avoids the round-trip.
    const phoneStatus = await fetchProfileStatus();
    if (phoneStatus && !phoneStatus.hasVerifiedPhone) {
      setPhoneRequiredOpen(true);
      return;
    }
    let session;
    try {
      session = await createSub.mutateAsync({ toolId: tool.id });
    } catch (err) {
      // Defense in depth: if the server returns PHONE_REQUIRED
      // anyway (race against profile-update or stale Clerk session),
      // surface the modal instead of the generic error toast.
      const msg = err instanceof Error ? err.message : "";
      if (msg.includes("PHONE_REQUIRED")) {
        setPhoneRequiredOpen(true);
        return;
      }
      // SUBSCRIPTIONS_DISABLED → friendlier "try again shortly"
      // toast. The kill-switch path returns 503 + this error code.
      if (msg.includes("SUBSCRIPTIONS_DISABLED")) {
        toast({
          title: "Subscriptions temporarily unavailable",
          description:
            "Please try again in a few minutes. If this persists, contact us on WhatsApp.",
          variant: "destructive",
        });
        return;
      }
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
      <div className="flex items-center justify-between gap-3 flex-wrap">
        <h2 className="text-2xl font-semibold text-gray-900">My Tools</h2>
        <div className="flex items-center gap-2">
          <Button
            variant={showDeleted ? "default" : "outline"}
            size="sm"
            onClick={() => setShowDeleted((v) => !v)}
            title={
              showDeleted
                ? "Hide deleted tools"
                : "Show tools you have deleted (admin can restore)"
            }
          >
            {showDeleted ? "Hide deleted" : "Show deleted"}
          </Button>
          <Link href="/submit-tool">
            <Button variant="outline">
              <Plus className="w-4 h-4 mr-1" />
              Submit another
            </Button>
          </Link>
        </div>
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
                <ToolLogo tool={t as unknown as Tool} size={48} radius={8} />

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

      {showDeleted && (
        <section className="mt-8">
          <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
            Deleted tools
          </h3>
          <p className="mt-1 text-xs text-gray-500">
            Soft-deleted by you. No actions available here — admin can
            restore on request via the Contact button.
          </p>
          <div className="mt-3 grid gap-3">
            {deletedQuery.isLoading && (
              <div className="text-sm text-gray-500 py-6 text-center">
                Loading deleted tools…
              </div>
            )}
            {!deletedQuery.isLoading &&
              (deletedQuery.data?.tools ?? []).length === 0 && (
                <div className="text-sm text-gray-500 py-6 text-center bg-white border border-dashed border-gray-300 rounded-xl">
                  Nothing deleted yet.
                </div>
              )}
            {(deletedQuery.data?.tools ?? []).map((t) => (
              <div
                key={t.id}
                className="bg-white border border-gray-200 rounded-xl p-4 opacity-60"
              >
                <div className="flex items-center gap-4">
                  <ToolLogo tool={t as unknown as Tool} size={48} radius={8} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <h4 className="text-sm font-semibold text-gray-900 truncate line-through">
                        {t.name}
                      </h4>
                      <Badge className="bg-slate-100 text-slate-700 ring-1 ring-slate-200/60">
                        Deleted
                      </Badge>
                    </div>
                    <p className="text-xs text-gray-500 truncate">{t.category}</p>
                    <p className="text-[11px] text-gray-400 mt-1">
                      Deleted{" "}
                      {t.deletedAt
                        ? formatDistanceToNow(new Date(t.deletedAt), {
                            addSuffix: true,
                          })
                        : "—"}
                      . Contact us to restore.
                    </p>
                  </div>
                </div>
              </div>
            ))}
            {(deletedQuery.data?.tools ?? []).length > 0 && (
              <div className="pt-2">
                <WhatsAppSupportButton label="Request restore on WhatsApp" size="sm" />
              </div>
            )}
          </div>
        </section>
      )}

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

      <DeleteToolDialog
        target={deleteTarget}
        busy={deleteToolMut.isPending}
        onCancel={() => {
          if (!deleteToolMut.isPending) setDeleteTarget(null);
        }}
        onConfirm={confirmDelete}
        onManageSubscription={() => {
          setDeleteTarget(null);
          router.push("/dashboard");
        }}
      />

      <PhoneRequiredDialog
        open={phoneRequiredOpen}
        onOpenChange={setPhoneRequiredOpen}
      />
      </div>
    </>
  );
}

interface DeleteToolDialogProps {
  target: DeleteTarget | null;
  busy: boolean;
  onCancel: () => void;
  onConfirm: () => void | Promise<void>;
  onManageSubscription: () => void;
}

function DeleteToolDialog({
  target,
  busy,
  onCancel,
  onConfirm,
  onManageSubscription,
}: DeleteToolDialogProps) {
  if (!target) {
    return (
      <AlertDialog open={false} onOpenChange={() => onCancel()}>
        <AlertDialogContent />
      </AlertDialog>
    );
  }
  const { tool, stage } = target;
  // Format the active-boost expiry. Prefer the server-confirmed value
  // (set after a State-A → State-C upgrade) and fall back to the
  // client-side earliest boost expiry.
  const expiryIso =
    target.serverEarliestBoostExpiresAt ??
    Object.values(tool.boostExpiresAt || {})
      .filter((iso): iso is string => !!iso)
      .filter((iso) => new Date(iso).getTime() > Date.now())
      .sort()[0];
  const expiryLong = expiryIso
    ? formatDate(new Date(expiryIso), "PPP")
    : "the expiry date";
  return (
    <AlertDialog
      open
      onOpenChange={(open) => {
        if (!open && !busy) onCancel();
      }}
    >
      <AlertDialogContent>
        {stage === "A" && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Delete {tool.name}?</AlertDialogTitle>
              <AlertDialogDescription>
                This permanently removes your tool from Internet Keeda.
                Your past payment history is kept for our records but no
                longer visible to others. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  void onConfirm();
                }}
                disabled={busy}
                className={cn(buttonVariants({ variant: "destructive" }), "gap-2")}
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {busy ? "Deleting…" : "Delete permanently"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
        {stage === "B" && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>Cancel subscription first</AlertDialogTitle>
              <AlertDialogDescription>
                {tool.name} has an active subscription. Cancel the
                subscription before deleting the tool.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  onManageSubscription();
                }}
                className={cn(buttonVariants({ variant: "default" }))}
              >
                Manage subscription
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
        {stage === "C" && (
          <>
            <AlertDialogHeader>
              <AlertDialogTitle>
                Delete {tool.name} and forfeit active boost?
              </AlertDialogTitle>
              <AlertDialogDescription>
                Your boost is active until {expiryLong}. Deleting now
                forfeits the remaining time. Per our{" "}
                <a href="/refund" className="underline" target="_blank" rel="noopener noreferrer">
                  Refund Policy
                </a>
                , this is non-refundable. This action cannot be undone.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
              <AlertDialogAction
                onClick={(e) => {
                  e.preventDefault();
                  void onConfirm();
                }}
                disabled={busy}
                className={cn(buttonVariants({ variant: "destructive" }), "gap-2")}
              >
                {busy && <Loader2 className="h-4 w-4 animate-spin" />}
                {busy ? "Deleting…" : "Forfeit boost and delete"}
              </AlertDialogAction>
            </AlertDialogFooter>
          </>
        )}
      </AlertDialogContent>
    </AlertDialog>
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
