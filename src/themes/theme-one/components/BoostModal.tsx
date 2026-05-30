"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Home, Award } from "lucide-react";
import { useCreateBoost, type BoostProductType } from "@/lib/api/payments";
import { toast } from "@/components/ui/use-toast";
import { PaymentMethodPicker } from "@/components/payment/PaymentMethodPicker";
import { enabledProviders, type PaymentProvider } from "@/lib/payment/providers";
import { BOOST_TIERS } from "@/lib/pricing/boost";
import { formatUsd } from "@/lib/format/money";

// Cashfree's hosted-checkout JS SDK is loaded once at the parent
// (MyToolsTab) level via next/script — Next dedupes <Script> elements
// by URL, so rendering a second one here would not fire onLoad again
// and leave our local sdkReady state stuck at false. Take sdkReady
// as a prop instead and trust window.Cashfree.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { Cashfree?: any } }

interface BoostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolId: string;
  toolName: string;
  /** Provided by the parent that already mounted the CF JS SDK
   * <Script>. False until that load completes; gates the Pay button. */
  sdkReady: boolean;
}

const ICONS: Record<"TrendingUp" | "Home" | "Award", React.ComponentType<{ className?: string }>> = {
  TrendingUp,
  Home,
  Award,
};

export function BoostModal({ open, onOpenChange, toolId, toolName, sdkReady }: BoostModalProps) {
  const [selected, setSelected] = useState<BoostProductType | null>(null);
  const [pickerOpen, setPickerOpen] = useState(false);
  const router = useRouter();
  const createBoost = useCreateBoost();

  const selectedTier = selected ? BOOST_TIERS.find((t) => t.productType === selected) ?? null : null;

  // Click on Pay: when one provider is enabled, fire directly; when
  // two+, open the picker and let the user choose.
  const handlePay = () => {
    if (!selected) return;
    const enabled = enabledProviders();
    if (enabled.length <= 1) {
      handlePayWithProvider(enabled[0]?.id ?? "cashfree");
    } else {
      setPickerOpen(true);
    }
  };

  const handlePayWithProvider = async (provider: PaymentProvider) => {
    setPickerOpen(false);
    if (!selected) return;
    if (provider === "paypal") {
      try {
        const r = await fetch("/api/payments/paypal/create-boost-order", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ toolId, productType: selected }),
        });
        if (!r.ok) {
          const body = await r.json().catch(() => ({}));
          throw new Error(body.error || "Failed to start PayPal order");
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
      session = await createBoost.mutateAsync({ toolId, productType: selected });
    } catch (err) {
      toast({
        title: "Could not start payment",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
      return;
    }

    // Belt-and-suspenders: parent gates the button on sdkReady, but
    // if window.Cashfree is somehow missing at click time, bounce
    // the user to the return page. The webhook + polling there will
    // pick up the order once it lands.
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
      // The SDK does NOT throw on option-validation errors — it
      // resolves with { error: { e, message } }. Mirror the same
      // result-handling we added to subscriptionsCheckout so a
      // misnamed field surfaces as a toast.
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

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>Boost {toolName}</DialogTitle>
            <p className="text-sm text-gray-500 mt-1">
              One-time payment. Boosts start the moment payment confirms.
            </p>
          </DialogHeader>

          <div className="grid gap-3 mt-2">
            {BOOST_TIERS.map((tier) => {
              const Icon = ICONS[tier.icon];
              const active = selected === tier.productType;
              return (
                <button
                  key={tier.productType}
                  type="button"
                  onClick={() => setSelected(tier.productType)}
                  className={`text-left rounded-xl border p-4 transition-all ${
                    active
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
                        <h3 className="text-sm font-semibold text-gray-900">{tier.name}</h3>
                        <span className="text-sm font-bold text-orange-600">
                          {formatUsd(tier.priceUsdMinor)}
                        </span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">
                        {tier.description} for {tier.durationDays} days.
                      </p>
                      <p className="text-[11px] text-gray-400 mt-1">Duration: {tier.durationDays} days</p>
                    </div>
                  </div>
                </button>
              );
            })}
          </div>

          <p className="mt-3 text-[11px] text-gray-500">
            Payments are non-refundable. See our{' '}
            <a href="/refund" target="_blank" rel="noopener noreferrer" className="underline">
              Refund Policy
            </a>
            .
          </p>

          <div className="mt-4 flex items-center justify-end gap-2">
            <Button variant="ghost" onClick={() => onOpenChange(false)}>
              Cancel
            </Button>
            <Button
              onClick={handlePay}
              disabled={!selected || createBoost.isPending || !sdkReady}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white"
            >
              {createBoost.isPending ? "Starting…" : !sdkReady ? "Loading SDK…" : (
                <>
                  Pay {selectedTier ? formatUsd(selectedTier.priceUsdMinor) : ""}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {pickerOpen && selectedTier && (
        <PaymentMethodPicker
          open={pickerOpen}
          orderType="boost"
          amount={selectedTier.priceUsd}
          currency="USD"
          productLabel={`${selectedTier.name} · ${toolName}`}
          onSelect={handlePayWithProvider}
          onCancel={() => setPickerOpen(false)}
        />
      )}
    </>
  );
}
