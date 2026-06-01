import { NextResponse } from 'next/server';
import { connectDB } from '../api/lib/db';
import { Tool } from '../api/models/Tool';
import { BlogPost } from '../api/models/BlogPost';
import { NewsPost } from '../api/models/NewsPost';
import { Category } from '../api/models/Category';

export const dynamic = 'force-dynamic';

/**
 * Hardened canonical base URL.
 *
 * Resolution order:
 *   1. process.env.NEXT_PUBLIC_SITE_URL (trailing slash stripped)
 *   2. fixed string "https://internetkeeda.com"
 *
 * Deliberately NO fallback to req.headers.host, vercel.app preview
 * domains, or localhost. The sitemap is a search-engine artifact;
 * it must always advertise the canonical production domain even
 * when a crawler accidentally reaches a preview deploy, otherwise
 * Google indexes a non-canonical host and Search Console flags
 * mismatched canonicals.
 */
const BASE_URL =
  process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/$/, '') ||
  'https://internetkeeda.com';

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

    // Tool visibility filter mirrors the same gate /api/tools uses for
    // public reads: published/approved status only, never soft-deleted,
    // never in an unpaid-pending or unpaid-hidden listing state. A tool
    // that wouldn't render publicly should not be in the sitemap.
    const [tools, blogPosts, newsPosts, categories] = await Promise.all([
      Tool.find({
        status: { $in: ['published', 'approved'] },
        deletedAt: null,
        listingStatus: { $nin: ['unpaid-pending', 'unpaid-hidden'] },
      })
        .select('slug updatedAt createdAt')
        .sort({ updatedAt: -1 })
        .lean(),
      BlogPost.find({ status: 'published' })
        .select('slug updatedAt date')
        .sort({ updatedAt: -1 })
        .lean(),
      NewsPost.find({ status: 'published' })
        .select('slug updatedAt date')
        .sort({ updatedAt: -1 })
        .lean(),
      Category.find({ isActive: { $ne: false } })
        .select('slug name updatedAt')
        .lean(),
    ]);

    const now = new Date().toISOString();
    const urls: SitemapUrl[] = [];

    // Static pages — use current time as lastmod (cheap; the page bodies
    // are dynamic on every request anyway).
    for (const p of STATIC_PAGES) {
      urls.push({
        loc: `${BASE_URL}${p.url}`,
        lastmod: now,
        changefreq: p.changefreq,
        priority: p.priority,
      });
    }

    // Categories — long-tail SEO surface (678+ in production). Skip
    // any without a slug (shouldn't happen, but defensive).
    for (const cat of categories) {
      const slug = cat.slug;
      if (!slug) continue;
      const updated =
        (cat as { updatedAt?: Date }).updatedAt instanceof Date
          ? (cat as { updatedAt: Date }).updatedAt.toISOString()
          : now;
      urls.push({
        loc: `${BASE_URL}/category/${slug}`,
        lastmod: updated,
        changefreq: 'weekly',
        priority: '0.8',
      });
    }

    // Tool detail pages — the bulk of indexable content.
    for (const tool of tools) {
      if (!tool.slug) continue;
      const updated = tool.updatedAt || tool.createdAt;
      urls.push({
        loc: `${BASE_URL}/ai-tools/${tool.slug}`,
        lastmod: (updated instanceof Date ? updated : new Date(updated)).toISOString(),
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
        loc: `${BASE_URL}/blog/${post.slug}`,
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
        loc: `${BASE_URL}/reviews/${post.slug}`,
        lastmod: updated.toISOString(),
        changefreq: 'monthly',
        priority: '0.6',
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
