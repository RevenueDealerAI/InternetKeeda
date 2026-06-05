/**
 * Keeda Labs add-ons configuration.
 *
 * One file = the catalog of optional add-ons a buyer can toggle on at
 * checkout. Each add-on is priced in both USD and INR minor units
 * (cents / paise) so the existing dual-PSP checkout (Cashfree INR +
 * PayPal USD) can apply the right amount without runtime conversion.
 *
 * To ship a new add-on:
 *   1. Append an entry to STORE_ADDONS below.
 *   2. (Optional) Set highlight:true for the upsell tile and a
 *      postPurchaseNote that the delivery email will surface.
 *
 * No code changes needed elsewhere — checkout, payment, mailer, and
 * the admin "needs follow-up" view all read from this list.
 *
 * Drop-in safety:
 *   - addOnIds passed from the client get validated against this set
 *     before pricing, so even a malicious client cannot add a $0 / $1m
 *     line item.
 *   - The price the server uses for the PSP call is sourced from THIS
 *     file, never trusted from the request body.
 */

export interface StoreAddOn {
  /** Stable kebab-case identifier. Persisted on StorePurchase.addOnIds
   *  so renames here would orphan history — treat as immutable. */
  id: string;
  /** Display name shown on the toggle tile and in the order summary. */
  name: string;
  /** One-sentence description shown under the name when the tile is
   *  highlighted (or always, for non-highlighted tiles). */
  description: string;
  /** Price in cents — used when the buyer pays in USD via PayPal. */
  priceUsdMinor: number;
  /** Price in paise — used when the buyer pays in INR via Cashfree. */
  priceInrMinor: number;
  /** Pre-selected when the buyer first lands on the product page. */
  defaultOn: boolean;
  /** Visual emphasis on the toggle tile — accent border, gradient,
   *  larger description. Use sparingly (max one per product). */
  highlight?: boolean;
  /** Operational tag used in the admin "needs follow-up" view +
   *  embedded in the delivery email body. e.g. "needs-setup". */
  followUpTag?: string;
  /** Sentence the delivery email surfaces when this add-on is
   *  purchased. Plain prose — no HTML required. */
  postPurchaseNote?: string;
}

export const STORE_ADDONS: StoreAddOn[] = [
  {
    id: 'implementation-support',
    name: 'Implementation Support',
    description:
      'Our team sets up this workflow in your n8n instance for you — credentials wired, tested, and activated. ~30 minute screenshare, done same week.',
    priceUsdMinor: 9900, // $99.00
    priceInrMinor: 799900, // ₹7,999
    defaultOn: false,
    highlight: true,
    followUpTag: 'needs-setup',
    postPurchaseNote:
      "You've added Implementation Support. Our team will reach out within 24 hours to schedule the setup screenshare — keep an eye on this inbox or reply with your availability.",
  },
];

/* ───────────────────────── helpers ───────────────────────── */

const ADDON_BY_ID: Map<string, StoreAddOn> = new Map(
  STORE_ADDONS.map((a) => [a.id, a])
);

/** Returns the add-on if the id is in the canonical list; undefined
 *  otherwise. Use anywhere you need server-side validation. */
export function getAddOn(id: string): StoreAddOn | undefined {
  return ADDON_BY_ID.get(id);
}

/** Filter an arbitrary string[] (e.g. body.addOnIds from the client)
 *  down to the canonical add-ons, in canonical order, deduplicated.
 *  Safe to pass straight through to pricing + persistence. */
export function pickAddOnsFromIds(rawIds: unknown): StoreAddOn[] {
  if (!Array.isArray(rawIds)) return [];
  const seen = new Set<string>();
  const out: StoreAddOn[] = [];
  for (const raw of rawIds) {
    if (typeof raw !== 'string') continue;
    if (seen.has(raw)) continue;
    const addon = ADDON_BY_ID.get(raw);
    if (!addon) continue;
    seen.add(raw);
    out.push(addon);
  }
  return out;
}

/** Sum prices in the given currency. */
export function sumAddOnUsdMinor(addons: StoreAddOn[]): number {
  return addons.reduce((acc, a) => acc + a.priceUsdMinor, 0);
}
export function sumAddOnInrMinor(addons: StoreAddOn[]): number {
  return addons.reduce((acc, a) => acc + a.priceInrMinor, 0);
}
