/**
 * Payment provider registry. Single source of truth for which
 * providers are wired and selectable at checkout. PaymentMethodPicker
 * reads from here; flipping `enabled: true` is what turns a stub
 * provider into a live option.
 *
 * Disabled providers still render in the picker (as a "Coming soon"
 * card) so users know what's coming, but they're not clickable and
 * the picker auto-skips itself entirely when only one provider is
 * enabled.
 */

export type PaymentProvider = "cashfree" | "paypal";

export type PaymentProviderConfig = {
  id: PaymentProvider;
  label: string;
  description: string;
  logoSrc: string;
  enabled: boolean;
};

export const PAYMENT_PROVIDERS: PaymentProviderConfig[] = [
  {
    id: "cashfree",
    label: "Card / UPI",
    description: "Cards, UPI, Net Banking",
    logoSrc: "/payment-providers/cashfree.svg",
    enabled: true,
  },
  {
    id: "paypal",
    label: "PayPal",
    description: "PayPal account or card",
    logoSrc: "/payment-providers/paypal.svg",
    enabled: false,
  },
];

export const enabledProviders = (): PaymentProviderConfig[] =>
  PAYMENT_PROVIDERS.filter((p) => p.enabled);
