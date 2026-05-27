/**
 * Boost tier registry — single source of truth for the three boost
 * products (Category Top / Home Rotation / Featured Badge), pricing,
 * and duration.
 *
 * Both currencies are stored side-by-side: USD minor units (cents)
 * for the PayPal flow, INR minor units (paise) for the existing
 * Cashfree flow. The UI displays USD only (per the May 2026
 * user-facing-currency directive); Cashfree's hosted checkout
 * handles the rupee charge transparently for INR-card payers.
 *
 * Cashfree backend keeps reading the INR paise number through the
 * legacy `PRICING.BOOST_*` re-export in src/lib/cashfree.ts.
 */

export type BoostProductType =
  | "boost-category-top"
  | "boost-home-rotation"
  | "boost-featured-badge";

export type BoostSlot = "category-top" | "home-rotation" | "featured-badge";

export interface BoostTier {
  /** Internal product id used in /api/payments/boost/create + PayPal. */
  productType: BoostProductType;
  /** Tool.activeBoosts string — productType without the "boost-" prefix. */
  slot: BoostSlot;
  name: string;
  description: string;
  /** lucide-react icon name, resolved at render time. */
  icon: "TrendingUp" | "Home" | "Award";
  durationDays: number;
  priceUsd: number;
  /** USD cents — what PayPal sees. */
  priceUsdMinor: number;
  /** INR paise — what Cashfree sees. */
  priceInrMinor: number;
}

export const BOOST_TIERS: readonly BoostTier[] = [
  {
    productType: "boost-category-top",
    slot: "category-top",
    name: "Category Top",
    description: "Pin your tool to the #1 spot in its category page",
    icon: "TrendingUp",
    durationDays: 7,
    priceUsd: 12,
    priceUsdMinor: 1200,
    priceInrMinor: 99900,
  },
  {
    productType: "boost-home-rotation",
    slot: "home-rotation",
    name: "Home Rotation",
    description: "Get your tool into the home page featured rotation",
    icon: "Home",
    durationDays: 7,
    priceUsd: 30,
    priceUsdMinor: 3000,
    priceInrMinor: 249900,
  },
  {
    productType: "boost-featured-badge",
    slot: "featured-badge",
    name: "Featured Badge",
    description: "A red-gradient Featured badge on every card",
    icon: "Award",
    durationDays: 30,
    priceUsd: 60,
    priceUsdMinor: 6000,
    priceInrMinor: 499900,
  },
];

const TIER_BY_PRODUCT = new Map<BoostProductType, BoostTier>(
  BOOST_TIERS.map((t) => [t.productType, t]),
);

export function getBoostTier(productType: BoostProductType): BoostTier {
  const tier = TIER_BY_PRODUCT.get(productType);
  if (!tier) {
    throw new Error(`Unknown boost productType: ${productType}`);
  }
  return tier;
}

/** Compat with the legacy `boostSlotFor()` helper. */
export function boostSlotForProduct(productType: BoostProductType): BoostSlot {
  return getBoostTier(productType).slot;
}
