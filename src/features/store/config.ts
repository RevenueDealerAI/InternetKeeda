/**
 * Single source of truth for the store's branding + display strings.
 *
 * Rename the store in one place by changing STORE_BRAND.name. All
 * surfaces (storefront hero, nav item, page titles, footer mentions)
 * derive from this constant — never hardcode the store name elsewhere.
 *
 * This module is the only file outside features/store imported by
 * shared surfaces (nav, homepage). Treat the shape as a stable
 * contract: don't remove fields, only add.
 */

export const STORE_BRAND = {
  /** Public display name of the store sub-brand. */
  name: 'Keeda Labs',
  /** Parent brand — Internet Keeda. */
  parentName: 'Internet Keeda',
  /** Public route prefix. Pages live under this path. */
  routeBase: '/store',
  /** Nav menu label shown on the main InternetKeeda nav. */
  navLabel: 'AI Automation Workflows',
  /** Short tagline for hero + meta. */
  tagline: 'Hand-built AI automations, ready to deploy.',
  /** Longer hero blurb. */
  blurb:
    'A small, opinionated library of n8n workflows and automation packs we actually use. No fluff, no marketplace bloat — each one is built, tested, and documented by humans.',
  /** Generic meta description used when a page doesn't override it. */
  defaultMetaDescription:
    'Keeda Labs — hand-built n8n workflows and AI automations from the Internet Keeda team. Buy, download, deploy.',
} as const;

/**
 * Product types stored in Payment.productType for store purchases.
 * Prefixed with `store-` so the PSP webhook handlers can dispatch
 * by prefix (anything starting with `store-` routes to store
 * handlers; everything else stays on the existing boost path).
 */
export const STORE_PRODUCT_TYPE = 'store-purchase' as const;
export type StoreProductType = typeof STORE_PRODUCT_TYPE;

/**
 * Supported currencies. Each one routes to a specific PSP — INR via
 * Cashfree, USD via PayPal — the same way boosts work today.
 */
export const STORE_CURRENCIES = ['INR', 'USD'] as const;
export type StoreCurrency = (typeof STORE_CURRENCIES)[number];
