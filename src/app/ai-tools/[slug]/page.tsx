import type { Metadata } from 'next';
import { connectDB } from '@/app/api/lib/db';
import { Tool } from '@/app/api/models/Tool';
import { Category } from '@/app/api/models/Category';
import { BRAND } from '@/lib/brand';
import { PUBLIC_TOOL_FILTER } from '@/lib/seo/visibilityFilter';
import { slugifyCategoryName } from '@/lib/seo/slugify';
import { BreadcrumbSSR } from '@/components/seo/BreadcrumbSSR';
import { RelatedToolsRail } from '@/components/seo/RelatedToolsRail';
import { BrowseByCategory } from '@/components/seo/BrowseByCategory';
import AIToolDetailClient from './ClientView';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

/**
 * Per-tool metadata + canonical URL. Reads the tool name/description
 * from Mongo at request time so each tool detail page emits a unique
 * <title>, <meta description>, and self-referencing canonical
 * pointing at /ai-tools/<slug>. Gracefully degrades to a generic
 * title if the slug doesn't resolve — Next still renders the page
 * (the client view fetches its own data and shows a 404 inline if
 * the API returns nothing).
 */
export async function generateMetadata({ params }: RouteParams): Promise<Metadata> {
  const { slug } = await params;
  let title: string = `AI tool · ${BRAND.name}`;
  let description: string = BRAND.defaultMetaDescription;
  try {
    await connectDB();
    const tool = await Tool.findOne({
      slug,
      ...PUBLIC_TOOL_FILTER,
    })
      .select('name description description_ai category')
      .lean();
    if (tool) {
      title = `${tool.name} — ${tool.category} on ${BRAND.name}`;
      const rawDesc = (tool.description_ai || tool.description || '').replace(
        /\s+/g,
        ' ',
      );
      description = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}…` : rawDesc;
    }
  } catch (e) {
    // Don't let a metadata DB blip 500 the route — the page itself
    // will render and re-attempt the fetch client-side.
    console.warn('[ai-tools/[slug]] generateMetadata DB error:', e);
  }
  return {
    title,
    description,
    alternates: { canonical: `/ai-tools/${slug}` },
    openGraph: { url: `/ai-tools/${slug}`, title, description, type: 'article' },
    twitter: { card: 'summary_large_image', title, description },
  };
}

interface ToolForSeo {
  _id: unknown;
  slug: string;
  name: string;
  category: string;
  description?: string;
  logo?: string;
}

/**
 * The page is now an async server component. The interactive UI
 * (upvote / save / share / review / theme switching) STAYS in the
 * legacy AIToolDetailClient — we don't touch it. What we add are
 * three new SSR sections that ship in the initial HTML so Googlebot
 * gets real anchor tags before any JavaScript runs:
 *
 *   1. <BreadcrumbSSR /> at the top — back-links to Home and the
 *      parent category page + emits BreadcrumbList JSON-LD.
 *   2. <RelatedToolsRail /> at the bottom — 6-10 real
 *      <a href="/ai-tools/{slug}"> to siblings in the same category.
 *      Picks "best" siblings by rating, then views, then most recent.
 *   3. <BrowseByCategory /> below the rail — 24 category chips so
 *      crawl budget can reach OTHER categories from any tool page
 *      without going back through home.
 *
 * No content duplication with the ClientView: the new sections are
 * pure navigation chrome (breadcrumb / related / browse). The
 * ClientView remains the source of truth for the tool's own
 * description, features, screenshots, reviews, etc.
 */
export default async function AIToolDetailPage({ params }: RouteParams) {
  const { slug } = await params;

  let tool: ToolForSeo | null = null;
  let related: ToolForSeo[] = [];
  let popularCategories: Array<{ slug: string; name: string }> = [];

  try {
    await connectDB();
    tool = (await Tool.findOne({ slug, ...PUBLIC_TOOL_FILTER })
      .select('slug name category description logo')
      .lean()) as ToolForSeo | null;

    if (tool) {
      // Same-category siblings, "best" first. 10 is the upper bound
      // we expose to Google (sweet spot for anchor budget per page).
      related = (await Tool.find({
        ...PUBLIC_TOOL_FILTER,
        category: tool.category,
        slug: { $ne: tool.slug },
      })
        .sort({ rating: -1, views: -1, createdAt: -1 })
        .limit(10)
        .select('slug name category description logo')
        .lean()) as ToolForSeo[];
    }

    // 24 categories for the "Browse by category" chip cloud. Sort
    // alphabetically — stable, deterministic, easy for the cache to
    // hit, and consistent across every page that renders the block.
    popularCategories = (await Category.find({ isActive: { $ne: false } })
      .select('slug name')
      .sort({ name: 1 })
      .limit(24)
      .lean()) as Array<{ slug: string; name: string }>;
  } catch (e) {
    console.warn('[ai-tools/[slug]] SSR fetch failed:', e);
  }

  const categorySlug = tool ? slugifyCategoryName(tool.category) : '';

  return (
    <>
      {tool && (
        <BreadcrumbSSR
          items={[
            { label: 'Internet Keeda', href: '/' },
            { label: tool.category, href: `/category/${categorySlug}` },
            { label: tool.name },
          ]}
        />
      )}

      {/* The legacy client view stays unchanged — it owns the
          interactive tool detail (upvote, save, share, reviews,
          theme switching). */}
      <AIToolDetailClient slug={slug} />

      {tool && related.length > 0 && (
        <RelatedToolsRail
          tools={related.map(toCardData)}
          currentCategoryName={tool.category}
          currentCategorySlug={categorySlug}
        />
      )}

      <BrowseByCategory categories={popularCategories} />
    </>
  );
}

function toCardData(t: ToolForSeo) {
  return {
    slug: t.slug,
    name: t.name,
    category: t.category,
    description: t.description,
    logo: t.logo,
  };
}
