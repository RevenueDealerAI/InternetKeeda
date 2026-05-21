/**
 * Cashfree SDK wrapper. The cashfree-pg v6 SDK is auto-generated from
 * the OpenAPI spec — the client is constructed positionally
 * (env, clientId, secret). One instance covers both PG (one-time
 * orders) and Subs (subscriptions) APIs.
 *
 * Always go through `getCashfreeClient()` so future env changes
 * (key rotation, mode flip) land in one place.
 */

import { Cashfree, CFEnvironment } from "cashfree-pg";

let cached: Cashfree | null = null;

function readMode(): CFEnvironment {
  const raw = (process.env.CASHFREE_MODE || "TEST").toUpperCase();
  return raw === "PROD" || raw === "PRODUCTION"
    ? CFEnvironment.PRODUCTION
    : CFEnvironment.SANDBOX;
}

export const CASHFREE_API_VERSION = "2026-01-01";

export function getCashfreeClient(): Cashfree {
  if (cached) return cached;

  const appId = process.env.CASHFREE_APP_ID;
  const secret = process.env.CASHFREE_SECRET_KEY;
  if (!appId || !secret) {
    throw new Error(
      "Cashfree not configured — set CASHFREE_APP_ID and CASHFREE_SECRET_KEY in env.",
    );
  }

  cached = new Cashfree(readMode(), appId, secret);
  // The SDK exposes XApiVersion as a public field; pinning it avoids
  // the SDK's default drifting underneath us when they ship a new
  // OpenAPI rev. Update CASHFREE_API_VERSION here when intentionally
  // upgrading.
  cached.XApiVersion = CASHFREE_API_VERSION;
  return cached;
}

export const CASHFREE_MODE_LABEL = (): "TEST" | "PROD" =>
  readMode() === CFEnvironment.PRODUCTION ? "PROD" : "TEST";

/**
 * Pricing source of truth. Amounts in **paise** (INR × 100). Display
 * layer divides by 100. Keep this aligned with whatever the admin
 * communicates to merchants.
 */
export const PRICING = {
  // Recurring
  MONTHLY_LISTING_PAISE: 49900, // ₹499 / month
  // One-time boosts (paise + duration in days)
  BOOST_CATEGORY_TOP: { paise: 99900, days: 7 },
  BOOST_HOME_ROTATION: { paise: 249900, days: 7 },
  BOOST_FEATURED_BADGE: { paise: 499900, days: 30 },
} as const;

export type BoostProductType =
  | "boost-category-top"
  | "boost-home-rotation"
  | "boost-featured-badge";

export function getBoostPricing(productType: BoostProductType): {
  paise: number;
  days: number;
} {
  switch (productType) {
    case "boost-category-top":
      return PRICING.BOOST_CATEGORY_TOP;
    case "boost-home-rotation":
      return PRICING.BOOST_HOME_ROTATION;
    case "boost-featured-badge":
      return PRICING.BOOST_FEATURED_BADGE;
  }
}

/** Map our internal product type to the Tool.activeBoosts string. */
export function boostSlotFor(productType: BoostProductType):
  | "category-top"
  | "home-rotation"
  | "featured-badge" {
  return productType.replace(/^boost-/, "") as
    | "category-top"
    | "home-rotation"
    | "featured-badge";
}
