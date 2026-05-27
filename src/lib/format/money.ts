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
