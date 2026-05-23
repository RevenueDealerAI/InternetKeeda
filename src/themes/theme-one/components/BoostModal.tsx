"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Home, Award } from "lucide-react";
import { useCreateBoost, type BoostProductType } from "@/lib/api/payments";
import { toast } from "@/components/ui/use-toast";

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

interface BoostOption {
  productType: BoostProductType;
  label: string;
  description: string;
  priceLabel: string;
  durationLabel: string;
  icon: React.ComponentType<{ className?: string }>;
}

const OPTIONS: BoostOption[] = [
  {
    productType: "boost-category-top",
    label: "Category Top",
    description: "Pin your tool to the #1 spot in its category page for 7 days.",
    priceLabel: "₹999",
    durationLabel: "7 days",
    icon: TrendingUp,
  },
  {
    productType: "boost-home-rotation",
    label: "Home Rotation",
    description: "Get your tool into the home page featured rotation for 7 days.",
    priceLabel: "₹2,499",
    durationLabel: "7 days",
    icon: Home,
  },
  {
    productType: "boost-featured-badge",
    label: "Featured Badge",
    description: "A red-gradient Featured badge on every card for 30 days.",
    priceLabel: "₹4,999",
    durationLabel: "30 days",
    icon: Award,
  },
];

export function BoostModal({ open, onOpenChange, toolId, toolName, sdkReady }: BoostModalProps) {
  const [selected, setSelected] = useState<BoostProductType | null>(null);
  const router = useRouter();
  const createBoost = useCreateBoost();

  const handlePay = async () => {
    if (!selected) return;
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
              One-time payment via Cashfree. Boosts start the moment payment confirms.
            </p>
          </DialogHeader>

          <div className="grid gap-3 mt-2">
            {OPTIONS.map((opt) => {
              const Icon = opt.icon;
              const active = selected === opt.productType;
              return (
                <button
                  key={opt.productType}
                  type="button"
                  onClick={() => setSelected(opt.productType)}
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
                        <h3 className="text-sm font-semibold text-gray-900">{opt.label}</h3>
                        <span className="text-sm font-bold text-orange-600">{opt.priceLabel}</span>
                      </div>
                      <p className="text-xs text-gray-600 mt-1 leading-relaxed">{opt.description}</p>
                      <p className="text-[11px] text-gray-400 mt-1">Duration: {opt.durationLabel}</p>
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
              disabled={!selected || createBoost.isPending || !sdkReady}
              className="bg-gradient-to-r from-orange-500 to-red-600 text-white"
            >
              {createBoost.isPending ? "Starting…" : !sdkReady ? "Loading SDK…" : (
                <>
                  Pay {selected ? OPTIONS.find((o) => o.productType === selected)?.priceLabel : ""}
                  <ArrowRight className="w-4 h-4 ml-1" />
                </>
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
