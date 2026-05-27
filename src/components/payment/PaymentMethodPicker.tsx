"use client";

import Image from "next/image";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { PAYMENT_PROVIDERS, type PaymentProvider } from "@/lib/payment/providers";

interface PaymentMethodPickerProps {
  open: boolean;
  orderType: "subscription" | "boost";
  amount: number;
  currency: string;
  productLabel: string;
  onSelect: (method: PaymentProvider) => void;
  onCancel: () => void;
}

/**
 * Modal that asks the user to pick a payment provider. Renders one
 * card per entry in PAYMENT_PROVIDERS. Disabled providers (e.g.
 * PayPal until it's wired) appear as non-clickable "Coming soon"
 * cards so users see the roadmap.
 *
 * Note: when only one provider is enabled, callers should auto-fire
 * onSelect directly without ever opening this modal — see the
 * `pickPaymentMethod()` helper for that flow.
 */
export function PaymentMethodPicker({
  open,
  orderType,
  amount,
  currency,
  productLabel,
  onSelect,
  onCancel,
}: PaymentMethodPickerProps) {
  const priceLabel = formatPrice(amount, currency);
  const headline =
    orderType === "subscription" ? "Pick a payment method" : "Pay for this boost";

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onCancel()}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>{headline}</DialogTitle>
          <DialogDescription>
            {productLabel} · <span className="font-medium text-gray-900">{priceLabel}</span>
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-2">
          {PAYMENT_PROVIDERS.map((p) => {
            const isDisabled = !p.enabled;
            return (
              <button
                key={p.id}
                type="button"
                onClick={() => !isDisabled && onSelect(p.id)}
                disabled={isDisabled}
                aria-label={`Pay with ${p.label}`}
                className={cn(
                  "group relative flex flex-col items-start gap-3 rounded-xl border bg-white p-4 text-left transition-all duration-200",
                  isDisabled
                    ? "border-gray-200 opacity-60 cursor-not-allowed"
                    : "border-gray-200 hover:border-orange-300 hover:shadow-md hover:-translate-y-0.5 cursor-pointer",
                )}
              >
                <div className="flex items-center gap-3 w-full">
                  {/* h-10 fixed height, w-24 budget so both wordmarks
                   * (PayPal + Cashfree) render at the same visible
                   * height. SVGs share a 200x80 viewBox so object-
                   * contain settles them at ~96x38 inside this slot
                   * for visual parity. */}
                  <div className="relative h-10 w-24 shrink-0">
                    <Image
                      src={p.logoSrc}
                      alt={p.label}
                      fill
                      sizes="96px"
                      className="object-contain object-left"
                    />
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2">
                      <div className="text-sm font-semibold text-gray-900">{p.label}</div>
                      {isDisabled && (
                        <Badge className="bg-gray-100 text-gray-600 ring-1 ring-gray-200">
                          Coming soon
                        </Badge>
                      )}
                    </div>
                    <div className="text-xs text-gray-500 mt-0.5">{p.description}</div>
                  </div>
                </div>
                <div className="text-xs text-gray-500 mt-1">{priceLabel}</div>
              </button>
            );
          })}
        </div>

        <div className="flex justify-end pt-2">
          <Button variant="ghost" onClick={onCancel}>
            Cancel
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function formatPrice(amount: number, currency: string): string {
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency,
      maximumFractionDigits: amount % 1 === 0 ? 0 : 2,
    }).format(amount);
  } catch {
    return `${currency} ${amount.toLocaleString()}`;
  }
}
