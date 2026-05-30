/**
 * Single source of truth for brand-display strings.
 *
 * Two distinct forms:
 *   - `BRAND.name`        — "Internet Keeda" (two words). Use in
 *                            all USER-FACING display copy: page
 *                            titles, headings, footer, og tags,
 *                            legal pages, marketing.
 *   - `BRAND.nameCompact` — "InternetKeeda" (one word, no space).
 *                            Use only where a space would break
 *                            things: URL-derived contexts,
 *                            slug-like identifiers, log prefixes.
 *
 * Merchant of record varies by currency / gateway:
 *   - INR (Cashfree)   → Revenue Dealer MarTech Pvt Ltd (India)
 *   - USD (PayPal)     → Viom Global Inc (Delaware, USA)
 *   - UK corporate ref → Revenue Dealer Limited (London) — used in
 *                        About + Privacy DPO references only
 *
 * Legal pages (Terms, Privacy, Refund, Shipping, Pricing) consume
 * the structured `LEGAL_ENTITIES` block below. The legacy single
 * `legalEntity` string is kept for back-compat with surfaces that
 * haven't been updated to the dual-entity model yet (footer
 * copyright pre-2026-05-30, etc.).
 */
export const BRAND = {
  /** User-facing display name. Two words. Use everywhere except the contexts listed below. */
  name: "Internet Keeda",
  /** No-space variant for contexts where the space would break things (URL slugs, log prefixes). Prefer `name` unless the consuming surface actively requires this form. */
  nameCompact: "InternetKeeda",
  /** Bare domain — no protocol, no trailing slash. */
  domain: "internetkeeda.com",
  /** Lower-cased domain for email composition / cookie scoping. */
  domainLower: "internetkeeda.com",
  /** Default tagline. Override per-page where it earns it. */
  tagline: "Every AI tool, in one place",
  /** Default meta description for surfaces that don't set their own. */
  defaultMetaDescription:
    "Internet Keeda — the directory of AI tools that actually ship. 5,000+ tools, ranked and reviewed.",
  /** Legacy single-entity name. Prefer LEGAL_ENTITIES for new copy. */
  legalEntity: "Revenue Dealer MarTech Pvt Ltd",
  /** Legal entity short form for tight surfaces (mobile footer, copyright line). */
  legalEntityShort: "Revenue Dealer MarTech",
  /** Registered jurisdiction — used in legacy legal-page boilerplate. */
  jurisdiction: "India",
  /** Corporate inbox. Used ONLY for the Data Protection Officer
   *  line in the Privacy Policy — regulators require an email
   *  contact for DPDP / GDPR rights exercise. Every other support
   *  touchpoint routes through WhatsAppSupportButton. */
  corpEmail: "info@revenuedealer.com",
} as const;

export const LEGAL_ENTITIES = {
  inr: {
    name: "Revenue Dealer MarTech Pvt Ltd",
    address:
      "Plot No. D-107, Sector 2, Noida, Gautam Buddha Nagar, Uttar Pradesh 201301, India",
    addressLines: [
      "Plot No. D-107, Sector 2",
      "Noida, Gautam Buddha Nagar",
      "Uttar Pradesh 201301, India",
    ],
    country: "India",
    /** Cashfree settles charges to this entity. */
    gateway: "Cashfree (INR)",
  },
  usd: {
    name: "Viom Global Inc",
    address: "8 The Green Ste 10231, Dover, DE 19901, United States",
    addressLines: [
      "8 The Green Ste 10231",
      "Dover, DE 19901",
      "United States",
    ],
    country: "United States",
    /** PayPal settles charges to this entity. */
    gateway: "PayPal (USD)",
  },
  /** UK corporate reference — not a merchant of record. Used in About
   *  and Privacy DPO sections only. */
  uk: {
    name: "Revenue Dealer Limited",
    address: "71-75 Shelton Street, Covent Garden, London, WC2H 9JQ, UK",
    addressLines: [
      "71-75 Shelton Street",
      "Covent Garden",
      "London, WC2H 9JQ, UK",
    ],
    country: "United Kingdom",
  },
} as const;

export const LEGAL_JURISDICTION = {
  /** Indian customers — courts of Gautam Buddha Nagar, UP. */
  india: "courts of Gautam Buddha Nagar, Uttar Pradesh, India",
  /** International (non-Indian) customers — Delaware, USA. */
  international: "the State of Delaware, United States of America",
} as const;
