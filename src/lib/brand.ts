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
 * The DOMAIN is always "internetkeeda.com" (URL form, never
 * spaced) — kept here so consumers don't reach for a literal
 * string with the wrong casing.
 *
 * Things this constant does NOT replace:
 *   - env var names (NEXT_PUBLIC_SITE_URL, etc.) — those are
 *     identifiers, not display copy
 *   - Mongo DB name "internetkeeda" — DB-level identifier
 *   - Vercel project name "internet-keeda" — vendor-level
 *   - File / variable / class names in code
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
  /** Legal entity name for footer / terms / privacy. */
  legalEntity: "Viom Global Inc",
  /** Support / contact email — used in CTAs and error states. */
  supportEmail: "hello@internetkeeda.com",
} as const;
