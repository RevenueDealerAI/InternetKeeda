/**
 * Canonical category name → URL slug.
 *
 * Tool.category in MongoDB stores the canonical DISPLAY name
 * ("Image Generation"). URLs use the slug form ("image-generation").
 * Sitemap, category page filters, and the existing client filter all
 * normalize through the same transform — keep them in lock-step here.
 */
export function slugifyCategoryName(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}
