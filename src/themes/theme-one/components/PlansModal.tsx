"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  ArrowRight,
  TrendingUp,
  Home,
  Award,
  Sparkles,
  Lock,
} from "lucide-react";
import {
  useCreateBoost,
  type BoostProductType,
} from "@/lib/api/payments";
import { useCreateSubscription } from "@/lib/api/subscriptions";
import { toast } from "@/components/ui/use-toast";
import { PaymentMethodPicker } from "@/components/payment/PaymentMethodPicker";
import {
  enabledProviders,
  type PaymentProvider,
} from "@/lib/payment/providers";
import { BOOST_TIERS } from "@/lib/pricing/boost";
import { formatUsd } from "@/lib/format/money";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { Cashfree?: any } }

type TierKind = "listing" | "boost";

interface ListingTier {
  kind: "listing";
  name: string;
  description: string;
  priceUsd: number;
  priceUsdMinor: number;
  durationLabel: string;
}

const LISTING_TIER: ListingTier = {
  kind: "listing",
  name: "Monthly Listing",
  description: "Recurring listing — keeps your tool live in the catalog",
  priceUsd: 10,
  priceUsdMinor: 1000,
  durationLabel: "per month, recurring",
};

interface PlansModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolId: string;
  toolName: string;
  /** Cashfree JS SDK loaded on parent. Gates Cashfree-side Pay clicks. */
  sdkReady: boolean;
  /** True when this tool has a paid-active listing — unlocks boost tiers. */
  listingActive: boolean;
}

const BOOST_ICONS: Record<
  "TrendingUp" | "Home" | "Award",
  React.ComponentType<{ className?: string }>
> = { TrendingUp, Home, Award };

export function PlansModal({
  open,
  onOpenChange,
  toolId,
  toolName,
  sdkReady,
  listingActive,
}: PlansModalProps) {
  const router = useRouter();
  const createBoost = useCreateBoost();
  const createSub = useCreateSubscription();

  const [selectedKind, setSelectedKind] = useState<TierKind | null>(null);
  const [selectedBoost, setSelectedBoost] = useState<BoostProductType | null>(
    null,
  );
  const [pickerOpen, setPickerOpen] = useState(false);

  const selectedBoostTier = selectedBoost
    ? BOOST_TIERS.find((t) => t.productType === selectedBoost) ?? null
    : null;

  const selectedPriceMinor =
    selectedKind === "listing"
      ? LISTING_TIER.priceUsdMinor
      : selectedBoostTier?.priceUsdMinor ?? 0;
  const selectedLabel =
    selectedKind === "listing"
      ? `Listing for ${toolName}`
      : selectedBoostTier
      ? `${selectedBoostTier.name} · ${toolName}`
      : "";

  const handlePay = () => {
    if (!selectedKind) return;
    if (selectedKind === "boost" && !listingActive) return;
    const enabled = enabledProviders();
    if (enabled.length <= 1) {
      void handlePayWithProvider(enabled[0]?.id ?? "cashfree");
    } else {
      setPickerOpen(true);
    }
  };

  const handlePayWithProvider = async (provider: PaymentProvider) => {
    setPickerOpen(false);
    if (selectedKind === "listing") {
      await payListing(provider);
    } else if (selectedKind === "boost" && selectedBoost) {
      await payBoost(provider, selectedBoost);
    }
  };

  const payListing = async (provider: PaymentProvider) => {
    if (provider === "paypal") {
      try {
        const r = await fetch("/api/payments/paypal/create-subscription", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ toolId }),
        });
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || "Failed to start PayPal subscription");
        }
        const { approveUrl } = (await r.json()) as { approveUrl?: string };
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
    // Cashfree subscription flow.
    let session;
    try {
      session = await createSub.mutateAsync({ toolId });
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
      try {
        window.localStorage.setItem(
          "ik_pending_subscription_id",
          session.subscriptionId,
        );
      } catch {
        /* private mode — fall through */
      }
      const returnUrl = `${window.location.origin}/subscription/return-bounce`;
      const result = await cashfree.subscriptionsCheckout({
        subsSessionId: session.sessionId,
        returnUrl,
        redirectTarget: "_self",
      });
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

  const payBoost = async (
    provider: PaymentProvider,
    productType: BoostProductType,
  ) => {
    if (provider === "paypal") {
      try {
        const r = await fetch("/api/payments/paypal/create-boost-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ toolId, productType }),
        });
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || "Failed to start PayPal order");
        }
        const { approveUrl } = (await r.json()) as { approveUrl?: string };
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
    let session;
    try {
      session = await createBoost.mutateAsync({ toolId, productType });
    } catch (err) {
      toast({
        title: "Could not start payment",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
      return;
    }
    if (!window.Cashfree) {
      router.push(`/payment/return?order_id=${session.orderId}`);
      return;
    }
    try {
      const cf = window.Cashfree({ mode: session.mode });
      const result = await cf.checkout({
        paymentSessionId: session.paymentSessionId,
        redirectTarget: "_self",
      });
      if (result?.error) {
        const errObj = result.error as { e?: string; message?: string };
        toast({
          title: "Cashfree payment failed",
          description: errObj.e || errObj.message || "Unknown error",
          variant: "destructive",
        });
      }
    } catch (err) {
      toast({
        title: "Payment failed to start",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  const busy = createBoost.isPending || createSub.isPending;
  const boostLocked = !listingActive;
  const payDisabled =
    !selectedKind ||
    busy ||
    !sdkReady ||
    (selectedKind === "boost" && boostLocked);

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Plans for {toolName}</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              {listingActive
                ? "Stack a boost on top of your active listing — paid the moment checkout confirms."
                : "Start with the Monthly Listing. Boost slots unlock once your listing is active."}
            </p>
          </DialogHeader>

          <div className="grid gap-3 mt-2">
            {/* Listing tier */}
            <button
              type="button"
              onClick={() => {
                setSelectedKind("listing");
                setSelectedBoost(null);
              }}
              className={`text-left rounded-xl border p-4 transition-all ${
                selectedKind === "listing"
                  ? "border-emerald-400 bg-emerald-50/40 ring-2 ring-emerald-500/30"
                  : "border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/20"
              }`}
            >
              <div className="flex items-start gap-3">
                <div className="w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br from-emerald-500 to-emerald-600 text-white grid place-items-center">
                  <Sparkles className="w-4 h-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-3">
                    <h3 className="text-sm font-semibold text-gray-900">
                      {LISTING_TIER.name}
                    </h3>
                    <span className="text-sm font-bold text-emerald-700">
                      {formatUsd(LISTING_TIER.priceUsdMinor)}/mo
                    </span>
                  </div>
                  <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                    {LISTING_TIER.description}.
                  </p>
                  <p className="text-[11px] text-gray-400 mt-1">
                    {LISTING_TIER.durationLabel}
                    {listingActive && " · already active on this tool"}
                  </p>
                </div>
              </div>
            </button>

            {/* Boost tiers */}
            {BOOST_TIERS.map((tier) => {
              const Icon = BOOST_ICONS[tier.icon];
              const active =
                selectedKind === "boost" && selectedBoost === tier.productType;
              const locked = boostLocked;
              return (
                <button
                  key={tier.productType}
                  type="button"
                  onClick={() => {
                    if (locked) return;
                    setSelectedKind("boost");
                    setSelectedBoost(tier.productType);
                  }}
                  disabled={locked}
                  className={`text-left rounded-xl border p-4 transition-all ${
                    locked
                      ? "border-gray-200 bg-gray-50/60 opacity-70 cursor-not-allowed"
                      : active
                      ? "border-orange-400 bg-orange-50/40 ring-2 ring-orange-500/30"
                      : "border-gray-200 hover:border-orange-300 hover:bg-orange-50/20"
                  }`}
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 shrink-0 rounded-lg bg-gradient-to-br from-orange-500 to-red-600 text-white grid place-items-center">
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-3">
                        <h3 className="text-sm font-semibold text-gray-900">
                          {tier.name}
                        </h3>
                        <span className="text-sm font-bold text-orange-600">
                          {formatUsd(tier.priceUsdMinor)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {tier.description} for {tier.durationDays} days.
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1 flex items-center gap-1.5">
                        {locked && <Lock className="w-3 h-3" aria-hidden="true" />}
                        {locked
                          ? "Activate Monthly Listing to unlock"
                          : `Duration: ${tier.durationDays} days`}
                      </p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePay}
              disabled={payDisabled}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white"
            >
              {busy ? (
                "Starting…"
              ) : !sdkReady ? (
                "Loading SDK…"
              ) : selectedKind === "boost" && boostLocked ? (
                "Activate listing first"
              ) : (
                <>
                  Pay {selectedPriceMinor ? formatUsd(selectedPriceMinor) : ""}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {pickerOpen && selectedKind && (
        <PaymentMethodPicker
          open={pickerOpen}
          orderType={selectedKind === "listing" ? "subscription" : "boost"}
          amount={
            selectedKind === "listing"
              ? LISTING_TIER.priceUsd
              : selectedBoostTier?.priceUsd ?? 0
          }
          currency="USD"
          productLabel={selectedLabel}
          onSelect={handlePayWithProvider}
          onCancel={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}
