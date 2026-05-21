"use client";

import { useState } from "react";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ArrowRight, TrendingUp, Home, Award } from "lucide-react";
import { useCreateBoost, type BoostProductType } from "@/lib/api/payments";
import { toast } from "@/components/ui/use-toast";

interface BoostModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  toolId: string;
  toolName: string;
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

// Cashfree's hosted-checkout JS SDK. Loaded once, lazily, via next/script.
const CF_SDK_URL = "https://sdk.cashfree.com/js/v3/cashfree.js";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
declare global { interface Window { Cashfree?: any } }

export function BoostModal({ open, onOpenChange, toolId, toolName }: BoostModalProps) {
  const [selected, setSelected] = useState<BoostProductType | null>(null);
  const [sdkReady, setSdkReady] = useState(false);
  const router = useRouter();
  const createBoost = useCreateBoost();

  const handlePay = async () => {
    if (!selected) return;
    try {
      const session = await createBoost.mutateAsync({ toolId, productType: selected });

      // The CF JS SDK takes the paymentSessionId returned by the
      // server-side PGCreateOrder call. `redirect` mode bounces the
      // user to Cashfree's hosted page and back to our return_url.
      if (!window.Cashfree) {
        // Fall back: redirect to the return page; the polling there
        // will catch up once the webhook lands. This shouldn't happen
        // — the Script tag below sets sdkReady on load.
        router.push(`/payment/return?order_id=${session.orderId}`);
        return;
      }
      const cf = window.Cashfree({ mode: session.mode });
      cf.checkout({
        paymentSessionId: session.paymentSessionId,
        redirectTarget: "_self",
      });
    } catch (err) {
      toast({
        title: "Could not start payment",
        description: err instanceof Error ? err.message : "Unknown error",
        variant: "destructive",
      });
    }
  };

  return (
    <>
      <Script
        src={CF_SDK_URL}
        strategy="lazyOnload"
        onLoad={() => setSdkReady(true)}
      />
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
