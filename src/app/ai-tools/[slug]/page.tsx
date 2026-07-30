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
import { ToolJsonLd, type ToolJsonLdInput } from '@/components/seo/ToolJsonLd';
import { ToolArticleSSR, type ToolArticleData } from '@/components/seo/ToolArticleSSR';
import { ReviewSSR, type ReviewData } from '@/components/seo/ReviewSSR';
import { ReviewJsonLd } from '@/components/seo/ReviewJsonLd';
import { isIndexable, indexableWave, WAVE_SIZE } from '@/lib/seo/wave';
import AIToolDetailClient from './ClientView';

interface RouteParams {
  params: Promise<{ slug: string }>;
}

// Pre-render the current indexing wave (top WAVE_SIZE tools) as static
// HTML at build time — these are the pages we're actively pushing into
// Google's index, so they get the fastest possible first-wave crawl.
// dynamicParams stays true (the default): tools outside the wave still
// render on demand (SSR) so nothing 404s. revalidate keeps the static
// shells fresh without a redeploy.
export const revalidate = 3600;

export async function generateStaticParams(): Promise<Array<{ slug: string }>> {
  try {
    const wave = await indexableWave(WAVE_SIZE);
    return wave.map((t) => ({ slug: t.slug }));
  } catch (e) {
    // Never fail the build on a DB blip — fall back to all-dynamic.
    console.warn('[ai-tools/[slug]] generateStaticParams DB error:', e);
    return [];
  }
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
  // Default to indexable; a resolved-but-thin tool flips this to false.
  // A slug that doesn't resolve keeps index:true (the client view will
  // 404 inline) — we only actively noindex tools we KNOW are thin.
  let indexable = true;
  try {
    await connectDB();
    const tool = await Tool.findOne({
      slug,
      ...PUBLIC_TOOL_FILTER,
    })
      .select('name description description_ai category features pricing originalContent review')
      .lean();
    if (tool) {
      title = `${tool.name} — ${tool.category} on ${BRAND.name}`;
      const rawDesc = (tool.description_ai || tool.description || '').replace(
        /\s+/g,
        ' ',
      );
      description = rawDesc.length > 160 ? `${rawDesc.slice(0, 157)}…` : rawDesc;
      indexable = isIndexable(tool as Parameters<typeof isIndexable>[0]);
    }
  } catch (e) {
    // Don't let a metadata DB blip 500 the route — the page itself
    // will render and re-attempt the fetch client-side.
    console.warn('[ai-tools/[slug]] generateMetadata DB error:', e);
  }
  return {
    // `absolute` bypasses the root layout's `%s · Internet Keeda`
    // template — the per-tool title already ends in "on Internet
    // Keeda", so the template would double the brand and push the
    // title past ~70 chars in SERP.
    title: { absolute: title },
    description,
    alternates: { canonical: `/ai-tools/${slug}` },
    openGraph: { url: `/ai-tools/${slug}`, title, description, type: 'article' },
    twitter: { card: 'summary_large_image', title, description },
    // Thin tools (below the isIndexable quality floor) are noindex but
    // STILL follow — Google drops them from the index yet keeps
    // crawling their in-page links, so a thin tool never dead-ends the
    // crawl graph. Indexable tools get the normal index/follow.
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

interface ToolForSeo {
  _id: unknown;
  slug: string;
  name: string;
  category: string;
  description?: string;
  description_ai?: string;
  logo?: string;
  websiteUrl?: string;
  pricing?: { type?: string; startingPrice?: number };
  rating?: number;
  reviews?: number;
  tags?: string[];
  features?: string[];
  review?: {
    author: string;
    reviewedAt: Date;
    pricingCheckedAt: Date;
    sources: string[];
    body: string;
  };
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
      .select(
        'slug name category description description_ai logo websiteUrl pricing rating reviews tags features review',
      )
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
  const hasReview = !!tool?.review?.body;

  return (
    <>
      {tool && <ToolJsonLd tool={tool as ToolJsonLdInput} />}
      {tool && hasReview && (
        <ReviewJsonLd
          tool={{
            slug: tool.slug,
            name: tool.name,
            category: tool.category,
            author: tool.review!.author,
            reviewedAt: tool.review!.reviewedAt,
            body: tool.review!.body,
          }}
        />
      )}

      {tool && (
        <BreadcrumbSSR
          items={[
            { label: 'Internet Keeda', href: '/' },
            { label: tool.category, href: `/category/${categorySlug}` },
            { label: tool.name },
          ]}
        />
      )}

      {/* The client view owns the interactive tool detail (upvote,
          save, share, reviews, theme switching). We hand it a
          server-rendered article as its loading fallback so the tool's
          real content ships in the INITIAL HTML (soft-404 fix) and is
          then swapped for the interactive UI on hydration — no empty
          shell for crawlers, no visible double-render for users. When
          the SSR fetch failed (tool null) it degrades to the spinner. */}
      {/* For a REVIEWED tool the original review is the SSR content shown
          in the initial HTML (in place of the scraped description); other
          tools keep the legacy article fallback. Either way the client
          view hydrates over it. */}
      <AIToolDetailClient
        slug={slug}
        fallback={
          tool && hasReview ? (
            <ReviewSSR
              tool={{ name: tool.name, slug: tool.slug, websiteUrl: tool.websiteUrl }}
              review={tool.review as ReviewData}
            />
          ) : tool ? (
            <ToolArticleSSR tool={tool as ToolArticleData} />
          ) : undefined
        }
      />

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
