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
 * Pricing source of truth.
 *
 * MONTHLY_LISTING is USD (Cashfree PROD plan monthly-listing-10,
 * $10/month with $50 max headroom).
 *
 * BOOST tiers moved to src/lib/pricing/boost.ts so they're shared
 * with the PayPal flow. The PRICING.BOOST_* / getBoostPricing /
 * boostSlotFor / BoostProductType exports here are thin compat
 * shims so older import sites (admin tables, the Cashfree boost-
 * create route) keep working — flip them over when convenient.
 */
import {
  BOOST_TIERS,
  getBoostTier,
  boostSlotForProduct,
  type BoostProductType as PricingBoostProductType,
  type BoostSlot,
} from "./pricing/boost";

export const PRICING = {
  MONTHLY_LISTING: {
    planId: "monthly-listing-10",
    amountMinorUnit: 1000, // $10.00 in cents
    maxAmountMinorUnit: 5000, // $50.00 cap — Cashfree plan_max_amount
    currency: "USD",
    displayPrice: "$10/mo",
    interval: "month",
  },
  // Compat re-exports — derived from BOOST_TIERS so price changes
  // happen in exactly one place.
  BOOST_CATEGORY_TOP: {
    paise: getBoostTier("boost-category-top").priceInrMinor,
    days: getBoostTier("boost-category-top").durationDays,
  },
  BOOST_HOME_ROTATION: {
    paise: getBoostTier("boost-home-rotation").priceInrMinor,
    days: getBoostTier("boost-home-rotation").durationDays,
  },
  BOOST_FEATURED_BADGE: {
    paise: getBoostTier("boost-featured-badge").priceInrMinor,
    days: getBoostTier("boost-featured-badge").durationDays,
  },
} as const;

export type BoostProductType = PricingBoostProductType;

export function getBoostPricing(productType: BoostProductType): {
  paise: number;
  days: number;
} {
  const t = getBoostTier(productType);
  return { paise: t.priceInrMinor, days: t.durationDays };
}

export function boostSlotFor(productType: BoostProductType): BoostSlot {
  return boostSlotForProduct(productType);
}

export { BOOST_TIERS };
