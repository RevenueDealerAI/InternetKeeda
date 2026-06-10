/**
 * Canonical Tool visibility filter for ALL public surfaces.
 *
 * Mirrors the filter the sitemap uses (src/app/sitemap.xml/route.ts).
 * Any tool that wouldn't render in /sitemap.xml MUST NOT be linked to
 * from any public page, otherwise Google walks a sitemap-linked URL
 * and lands on a 404/empty state — exactly the symptom this branch
 * is trying to fix.
 *
 * Use as: `Tool.find({ ...PUBLIC_TOOL_FILTER, category: name })`.
 */
export const PUBLIC_TOOL_FILTER = {
  status: { $in: ['published', 'approved'] },
  deletedAt: null,
  listingStatus: { $nin: ['unpaid-pending', 'unpaid-hidden'] },
} as const;
