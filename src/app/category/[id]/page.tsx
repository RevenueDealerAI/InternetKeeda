import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { connectDB } from '@/app/api/lib/db';
import { Tool } from '@/app/api/models/Tool';
import { Category } from '@/app/api/models/Category';
import { BRAND } from '@/lib/brand';
import { PUBLIC_TOOL_FILTER } from '@/lib/seo/visibilityFilter';
import { BreadcrumbSSR } from '@/components/seo/BreadcrumbSSR';
import {
  CategoryToolGrid,
  CATEGORY_TOOLS_PER_PAGE,
} from '@/components/seo/CategoryToolGrid';
import { BrowseByCategory } from '@/components/seo/BrowseByCategory';
import { SITE_ORIGIN } from '@/lib/seo/siteOrigin';
import {
  wordCount,
  MIN_CATEGORY_TOOLS,
  MIN_CATEGORY_INTRO_WORDS,
} from '@/lib/seo/wave';

interface RouteParams {
  params: Promise<{ id: string }>;
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

export async function generateMetadata({
  params,
  searchParams,
}: RouteParams): Promise<Metadata> {
  const { id } = await params;
  const sp = await searchParams;
  const pageParam = sp?.page;
  const pageRaw = Array.isArray(pageParam) ? pageParam[0] : pageParam;
  const page = Math.max(1, Number.parseInt(String(pageRaw || '1'), 10) || 1);

  // Each paginated page SELF-canonicals: page 2 → /category/x?page=2,
  // NOT back to page 1. Canonicalising every page to page 1 tells Google
  // pages 2..N are duplicates of page 1 and drops the tools that only
  // appear on later pages from discovery. Page 1 has no ?page query.
  const path = page > 1 ? `/category/${id}?page=${page}` : `/category/${id}`;

  let title: string = `${id} — AI tools on ${BRAND.name}`;
  let description: string = `AI tools in the ${id} category on ${BRAND.name}.`;
  // Category indexability mirrors indexableCategories(): a real inventory
  // (>= MIN_CATEGORY_TOOLS) AND its own written intro (>= MIN_CATEGORY_
  // INTRO_WORDS). Doorway categories (thin, no intro) go noindex,follow —
  // dropped from the index but still crawled so the tools they link
  // aren't orphaned. Default false until we can confirm both.
  let indexable = false;
  try {
    await connectDB();
    const cat = await Category.findOne({ slug: id })
      .select('name description')
      .lean();
    if (cat) {
      title = `${cat.name} — AI tools on ${BRAND.name}`;
      const intro = (cat as { description?: string }).description;
      description = intro || `AI tools in the ${cat.name} category on ${BRAND.name}.`;
      const count = await Tool.countDocuments({
        ...PUBLIC_TOOL_FILTER,
        $or: [{ category: cat.name }, { category: id }],
      });
      indexable =
        count >= MIN_CATEGORY_TOOLS && wordCount(intro) >= MIN_CATEGORY_INTRO_WORDS;
    }
  } catch (e) {
    console.warn('[category/[id]] generateMetadata DB error:', e);
  }
  // Reflect the page number in the title of paginated pages so page 2+
  // isn't a duplicate <title> of page 1.
  if (page > 1) title = `${title} — page ${page}`;
  return {
    // `absolute` bypasses the root layout's `%s · Internet Keeda`
    // template — the title already ends in "on Internet Keeda", so the
    // template would duplicate the brand.
    title: { absolute: title },
    description,
    alternates: { canonical: path },
    openGraph: { url: path, title, description, type: 'website' },
    twitter: { card: 'summary_large_image', title, description },
    robots: indexable
      ? { index: true, follow: true }
      : { index: false, follow: true },
  };
}

interface ToolListItem {
  slug: string;
  name: string;
  category: string;
  description?: string;
  logo?: string;
}

/**
 * /category/{slug} is now SSR-first. The previous implementation
 * shipped an empty "Loading…" shell, called `useTools({ limit: 1000 })`
 * after hydration, and filtered client-side — so Googlebot landed on
 * the page and saw zero <a href="/ai-tools/..."> links, leaving
 * thousands of tool pages "Discovered – not indexed."
 *
 * The previous client component (CategoryDetailClient → theme-routed
 * /themes/theme-one/pages/category/[id].tsx) is intentionally NOT
 * rendered here. Replacing it eliminates the SSR-then-CSR double-
 * content risk you flagged: if both rendered, the page would show
 * the SSR grid first, then the client re-fetch would render a second
 * grid below it (or replace it in a flicker). Google would see
 * duplicated content; humans would see a layout jump. One grid only
 * — server-rendered, paginated with real anchor tags — solves both.
 *
 * Interactive features the old ClientView had (sort/filter, upvote
 * from the card) live on the tool detail page itself; users can
 * still vote/save after clicking through. The category page becomes
 * a directory: its job is "let humans + Googlebot scan the list and
 * click through". No double rendering, no JS dependency, no flicker.
 */
export default async function CategoryDetailPage({
  params,
  searchParams,
}: RouteParams) {
  const { id } = await params;
  const sp = await searchParams;
  const pageParam = sp?.page;
  const pageRaw = Array.isArray(pageParam) ? pageParam[0] : pageParam;
  const page = Math.max(1, Number.parseInt(String(pageRaw || '1'), 10) || 1);

  await connectDB();

  // Look up the canonical category row by slug. We need both the
  // display name (to render the heading + match Tool.category) and
  // a confirmed-real category to avoid serving content for arbitrary
  // URL strings.
  const category = (await Category.findOne({ slug: id })
    .select('name slug description')
    .lean()) as { name: string; slug: string; description?: string } | null;

  if (!category) {
    notFound();
  }

  // Tool.category historically stored EITHER the canonical name
  // ("Image Generation") OR the slug form ("image-generation"). The
  // legacy client view handled both with a `nameSlug()` normalisation
  // step. We replicate that by issuing a single $or query — both
  // forms are indexed via toolSchema.index({ category: 1, ... }).
  const filter = {
    ...PUBLIC_TOOL_FILTER,
    $or: [{ category: category.name }, { category: id }],
  };

  const [tools, totalCount, otherCategories] = await Promise.all([
    Tool.find(filter)
      .sort({ rating: -1, views: -1, createdAt: -1 })
      .skip((page - 1) * CATEGORY_TOOLS_PER_PAGE)
      .limit(CATEGORY_TOOLS_PER_PAGE)
      .select('slug name category description logo')
      .lean() as Promise<ToolListItem[]>,
    Tool.countDocuments(filter),
    Category.find({ isActive: { $ne: false }, slug: { $ne: id } })
      .select('slug name')
      .sort({ name: 1 })
      .limit(24)
      .lean() as Promise<Array<{ slug: string; name: string }>>,
  ]);

  // CollectionPage + ItemList JSON-LD. Emitted in the initial HTML so
  // Google (and JS-blind AI crawlers) understand this is a curated
  // list page and see the ordered set of tool URLs it links to —
  // reinforcing discovery of the programmatic /ai-tools/{slug} pages
  // from their category hub. Positions are absolute across pagination.
  const collectionLd = {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: `${category.name} — AI tools on ${BRAND.name}`,
    url: `${SITE_ORIGIN}/category/${id}`,
    ...(category.description ? { description: category.description } : {}),
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: totalCount,
      itemListElement: tools.map((t, i) => ({
        '@type': 'ListItem',
        position: (page - 1) * CATEGORY_TOOLS_PER_PAGE + i + 1,
        url: `${SITE_ORIGIN}/ai-tools/${t.slug}`,
        name: t.name,
      })),
    },
  };

  return (
    <main style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(collectionLd) }}
      />
      <BreadcrumbSSR
        items={[
          { label: 'Internet Keeda', href: '/' },
          { label: 'Categories', href: '/categories' },
          { label: category.name },
        ]}
      />
      <CategoryToolGrid
        tools={tools}
        categoryName={category.name}
        categorySlug={id}
        page={page}
        totalCount={totalCount}
      />
      <BrowseByCategory
        categories={otherCategories}
        heading="Browse other categories"
      />
    </main>
  );
}
