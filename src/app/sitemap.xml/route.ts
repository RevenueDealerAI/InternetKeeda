import { NextResponse } from 'next/server';
import { connectDB } from '../api/lib/db';
import { BlogPost } from '../api/models/BlogPost';
import { NewsPost } from '../api/models/NewsPost';
import { StoreProduct } from '@/features/store/models/StoreProduct';
import { canonical, indexableWave, indexableCategories, WAVE_SIZE } from '@/lib/seo/wave';

/**
 * ISR revalidation window. We re-render at most once an hour and serve
 * a static cached XML to every crawler in between. Google polls
 * sitemaps far less frequently than that; faster regeneration just
 * burns serverless function time and risks a cold-start timeout when
 * Googlebot hits us in a burst (we scan ~5,000+ tools + 678
 * categories + posts per render).
 *
 * Previously `dynamic = 'force-dynamic'` ran the full DB scan on
 * every fetch, which on Vercel's 10s function limit was a latent
 * timeout for the largest sitemaps.
 */
export const revalidate = 3600;

interface SitemapUrl {
  loc: string;
  lastmod: string;
  changefreq:
    | 'always'
    | 'hourly'
    | 'daily'
    | 'weekly'
    | 'monthly'
    | 'yearly'
    | 'never';
  priority: string;
}

const STATIC_PAGES: Array<Omit<SitemapUrl, 'loc' | 'lastmod'> & { url: string }> = [
  // Highest priority — the entry point.
  { url: '', priority: '1.0', changefreq: 'daily' },

  // Discovery surfaces — refreshed often, primary navigation paths.
  { url: '/categories', priority: '0.9', changefreq: 'weekly' },
  { url: '/trending', priority: '0.8', changefreq: 'daily' },
  { url: '/top-products', priority: '0.8', changefreq: 'daily' },
  { url: '/latest-launches', priority: '0.8', changefreq: 'daily' },
  { url: '/recently-added', priority: '0.7', changefreq: 'daily' },

  // Editorial.
  { url: '/reviews', priority: '0.8', changefreq: 'weekly' },
  { url: '/blog', priority: '0.7', changefreq: 'weekly' },
  { url: '/guides', priority: '0.6', changefreq: 'weekly' },

  // Conversion + onboarding.
  { url: '/submit-tool', priority: '0.7', changefreq: 'monthly' },
  { url: '/pricing', priority: '0.7', changefreq: 'monthly' },
  { url: '/advertise', priority: '0.6', changefreq: 'monthly' },

  // Brand / info.
  { url: '/about', priority: '0.5', changefreq: 'monthly' },
  { url: '/faq', priority: '0.5', changefreq: 'monthly' },

  // Programmatic SEO landing pages — "best X" buyer-intent surfaces.
  // These are hand-built pages with their own metadata + canonical;
  // they're not linked from the public nav, so the sitemap is their
  // primary discovery path. Without listing them here they remain
  // orphaned and never enter the index.
  { url: '/best-ai-meeting-tools', priority: '0.6', changefreq: 'monthly' },
  { url: '/best-ai-note-taking-software', priority: '0.6', changefreq: 'monthly' },
  { url: '/best-ai-email-management-tools', priority: '0.6', changefreq: 'monthly' },
  { url: '/best-ai-daily-planning-software', priority: '0.6', changefreq: 'monthly' },
  { url: '/best-crm-software-for-teams', priority: '0.6', changefreq: 'monthly' },
  { url: '/best-productivity-tools-for-adhd', priority: '0.6', changefreq: 'monthly' },
  { url: '/best-project-management-tools', priority: '0.6', changefreq: 'monthly' },

  // Keeda Labs storefront — public catalog root.
  { url: '/store', priority: '0.6', changefreq: 'weekly' },

  // Legal — low priority, change rarely.
  { url: '/terms', priority: '0.3', changefreq: 'yearly' },
  { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
  { url: '/refund', priority: '0.3', changefreq: 'yearly' },
  { url: '/shipping-delivery', priority: '0.3', changefreq: 'yearly' },

  // NOTE: NOT included (auth-gated, private, or non-indexable):
  //   /dashboard, /admin/*, /sign-in, /sign-up, /sign-out,
  //   /verify-email, /sso-callback, /api/*, /subscription/*,
  //   /payment/*, /submit-tool/*
  // Also excluded: /latest-news, /news, /news/[slug] — these
  // 308-redirect to /reviews and /reviews/[slug] per
  // next.config.js redirects(), so we list the canonical /reviews
  // URLs only.
];

function escapeXml(s: string): string {
  return s
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

function urlBlock(u: SitemapUrl): string {
  return `  <url>
    <loc>${escapeXml(u.loc)}</loc>
    <lastmod>${u.lastmod}</lastmod>
    <changefreq>${u.changefreq}</changefreq>
    <priority>${u.priority}</priority>
  </url>`;
}

export async function GET() {
  try {
    await connectDB();

    // WAVE STRATEGY (the fix for 5,703 "Discovered – not indexed"):
    // the sitemap no longer dumps all ~5,000 tools + 678 categories.
    // It advertises only the current indexing WAVE — the top WAVE_SIZE
    // tools by score and the categories that clear a 3-tool floor — so
    // Google gets a bounded, high-quality priority set it can actually
    // keep pace with. Indexable tools outside the wave stay index:true
    // and are still discovered through their category hub pages; they
    // just aren't force-fed here until the wave proves out. Widen by
    // raising WAVE_SIZE in src/lib/seo/wave.ts.
    const [tools, categories, blogPosts, newsPosts, storeProducts] = await Promise.all([
      indexableWave(WAVE_SIZE),
      indexableCategories(),
      BlogPost.find({ status: 'published' })
        .select('slug updatedAt date')
        .sort({ updatedAt: -1 })
        .lean(),
      NewsPost.find({ status: 'published' })
        .select('slug updatedAt date')
        .sort({ updatedAt: -1 })
        .lean(),
      // Keeda Labs store — only PUBLISHED products are buyable and
      // crawlable; drafts/archived must stay out of the sitemap.
      StoreProduct.find({ status: 'published' })
        .select('slug updatedAt createdAt')
        .sort({ updatedAt: -1 })
        .lean(),
    ]);

    const now = new Date().toISOString();
    const urls: SitemapUrl[] = [];

    // Static pages — use current time as lastmod (cheap; the page bodies
    // are dynamic on every request anyway).
    for (const p of STATIC_PAGES) {
      urls.push({
        // canonical('') → `${SITE}/` (root keeps its trailing slash to
        // match the served URL + the homepage canonical tag; every
        // other path has none). This is what fixes the reported
        // sitemap↔canonical mismatch on the home URL.
        loc: canonical(p.url || '/'),
        lastmod: now,
        changefreq: p.changefreq,
        priority: p.priority,
      });
    }

    // Categories — only those clearing the 3-tool floor (thin/singleton
    // categories are excluded so we don't seed low-value hubs).
    for (const cat of categories) {
      if (!cat.slug) continue;
      const updated =
        cat.updatedAt instanceof Date ? cat.updatedAt.toISOString() : now;
      urls.push({
        loc: canonical(`/category/${cat.slug}`),
        lastmod: updated,
        changefreq: 'weekly',
        priority: '0.8',
      });
    }

    // Tool detail pages — the current wave only (top WAVE_SIZE by score).
    for (const tool of tools) {
      if (!tool.slug) continue;
      const updated = tool.updatedAt || tool.createdAt;
      urls.push({
        loc: canonical(`/ai-tools/${tool.slug}`),
        lastmod: (updated instanceof Date
          ? updated
          : new Date(updated || now)
        ).toISOString(),
        changefreq: 'weekly',
        priority: '0.6',
      });
    }

    // Blog posts.
    for (const post of blogPosts) {
      if (!post.slug) continue;
      const updated =
        post.updatedAt instanceof Date ? post.updatedAt : new Date(post.date);
      urls.push({
        loc: canonical(`/blog/${post.slug}`),
        lastmod: updated.toISOString(),
        changefreq: 'monthly',
        priority: '0.6',
      });
    }

    // Review posts. NewsPost is the underlying Mongo model name; the
    // public URL is /reviews/<slug> after the news → reviews rename
    // shipped with the canonical-URL refactor.
    for (const post of newsPosts) {
      if (!post.slug) continue;
      const updated =
        post.updatedAt instanceof Date ? post.updatedAt : new Date(post.date);
      urls.push({
        loc: canonical(`/reviews/${post.slug}`),
        lastmod: updated.toISOString(),
        changefreq: 'monthly',
        priority: '0.6',
      });
    }

    // Keeda Labs store product pages — each published workflow has its
    // own server-rendered, crawlable /store/<slug> page.
    for (const product of storeProducts) {
      if (!product.slug) continue;
      const updated =
        (product as { updatedAt?: Date }).updatedAt ||
        (product as { createdAt?: Date }).createdAt;
      urls.push({
        loc: canonical(`/store/${product.slug}`),
        lastmod: (updated instanceof Date
          ? updated
          : new Date(updated || now)
        ).toISOString(),
        changefreq: 'weekly',
        priority: '0.7',
      });
    }

    const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map(urlBlock).join('\n')}
</urlset>`;

    return new NextResponse(xml, {
      headers: {
        'Content-Type': 'application/xml',
        // 1 hour edge cache. Search-engine crawlers don't poll faster
        // than this in practice; tighter caching just bills compute.
        'Cache-Control': 'public, max-age=3600',
      },
    });
  } catch (error) {
    console.error('Error serving sitemap:', error);
    return NextResponse.json({ error: 'Error generating sitemap' }, { status: 500 });
  }
}
