/**
 * Currency-aware money formatter.
 *
 * USD: $XX.YY (2dp)
 * INR: ₹X (rounded, no decimals — back-office reporting on Cashfree
 *      settlement amounts; never user-facing per the May 2026
 *      currency directive)
 * Anything else: "<CCY> X" as a safe fallback.
 *
 * `amountMinorUnit` is the minor-unit value (cents for USD, paise
 * for INR). Display layer divides by 100.
 */
export function formatMoney(amountMinorUnit: number, currency: string): string {
  const upper = currency?.toUpperCase?.() ?? "";
  if (upper === "USD") {
    return `$${(amountMinorUnit / 100).toFixed(2)}`;
  }
  if (upper === "INR") {
    return `₹${(amountMinorUnit / 100).toLocaleString("en-IN", {
      maximumFractionDigits: 0,
    })}`;
  }
  return `${currency} ${(amountMinorUnit / 100).toLocaleString()}`;
}

/**
 * User-facing override: regardless of how the payment was charged
 * (Cashfree-INR or PayPal-USD), the public UI shows USD because
 * USD is the canonical display currency. Pass the tier-derived USD
 * minor unit (priceUsdMinor) here, not the raw payment doc amount —
 * the doc amount may be paise on Cashfree rows.
 */
export function formatUsd(amountUsdMinor: number): string {
  return `$${(amountUsdMinor / 100).toFixed(2)}`;
}

/**
 * Fixed USD price anchors for user-facing surfaces. These are
 * INTENTIONALLY decoupled from the Subscription/Payment doc fields
 * — a Cashfree row stores ₹830 in paise, a PayPal row stores
 * $10 in cents, but the UI consistently reads "$10/mo" for either
 * by pulling from this constant. Cashfree's hosted checkout shows
 * ₹830 at payment time; that's outside our control and expected
 * for Indian buyers.
 *
 * Boost prices mirror BOOST_TIERS.priceUsd for the three slots —
 * exposed here so non-tier callers (success copy, marketing
 * copy, future help text) don't have to import BOOST_TIERS just
 * to render a price string.
 */
export const USER_FACING_PRICES = {
  MONTHLY_LISTING: "$10/mo",
  BOOST_CATEGORY_TOP: "$12",
  BOOST_HOME_ROTATION: "$30",
  BOOST_FEATURED_BADGE: "$60",
} as const;
