import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../api/lib/db';
import { Tool } from '../api/models/Tool';
import { BlogPost } from '../api/models/BlogPost';
import { NewsPost } from '../api/models/NewsPost';
import { Category } from '../api/models/Category';

export const dynamic = 'force-dynamic';

function determineFrontendUrl(req: NextRequest): string {
    let frontendUrl = process.env.FRONTEND_URL;
    
    if (!frontendUrl) {
        const host = req.headers.get('host');
        const protocol = req.headers.get('x-forwarded-proto') || 'https';
        const referer = req.headers.get('referer');
        
        if (referer) {
            try {
                const refererUrl = new URL(referer);
                frontendUrl = `${refererUrl.protocol}//${refererUrl.host}`;
            } catch (e) {
                console.warn('Invalid referer URL:', referer);
            }
        }
        
        if (host) {
            if (host.includes('aitoolfind.co') || host.includes('netlify') || host.includes('vercel')) {
                frontendUrl = `${protocol}://${host}`;
            } else {
                frontendUrl = `${protocol}://${host.replace(':3005', '')}`;
            }
        }
        
        frontendUrl = frontendUrl || 'http://localhost:8080';
    }
    
    return frontendUrl;
}

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        
        const frontendUrl = determineFrontendUrl(req);
        
        const [tools, blogPosts, newsPosts, categories] = await Promise.all([
            Tool.find({ status: { $in: ['published', 'approved'] } }).select('slug updatedAt createdAt').sort({ updatedAt: -1 }),
            BlogPost.find({ status: 'published' }).select('slug updatedAt date').sort({ updatedAt: -1 }),
            NewsPost.find({ status: 'published' }).select('slug updatedAt date').sort({ updatedAt: -1 }),
            Category.find({ isActive: { $ne: false } }).select('slug name updatedAt toolCount').sort({ toolCount: -1 }),
        ]);

        const staticPages = [
            { url: '', priority: '1.0', changefreq: 'daily' },
            { url: '/latest-launches', priority: '0.8', changefreq: 'daily' },
            { url: '/top-products', priority: '0.8', changefreq: 'daily' },
            { url: '/upcoming', priority: '0.7', changefreq: 'daily' },
            { url: '/categories', priority: '0.8', changefreq: 'weekly' },
            { url: '/trending', priority: '0.7', changefreq: 'daily' },
            { url: '/blog', priority: '0.7', changefreq: 'daily' },
            { url: '/latest-news', priority: '0.7', changefreq: 'daily' },
            { url: '/news', priority: '0.7', changefreq: 'daily' },
            { url: '/about', priority: '0.5', changefreq: 'monthly' },
            { url: '/guides', priority: '0.6', changefreq: 'weekly' },
            { url: '/faq', priority: '0.5', changefreq: 'monthly' },
            { url: '/advertise', priority: '0.5', changefreq: 'monthly' },
            { url: '/privacy', priority: '0.3', changefreq: 'yearly' },
            { url: '/terms', priority: '0.3', changefreq: 'yearly' }
        ];

        let sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`;

        staticPages.forEach(page => {
            sitemap += `
  <url>
    <loc>${frontendUrl}${page.url}</loc>
    <lastmod>${new Date().toISOString()}</lastmod>
    <changefreq>${page.changefreq}</changefreq>
    <priority>${page.priority}</priority>
  </url>`;
        });

        // Category pages — 678 in production. Prioritised 0.8 since they're
        // the long-tail SEO opportunity for the directory.
        const categorySlug = (cat: { slug?: string; name: string }) =>
            cat.slug || encodeURIComponent(cat.name.toLowerCase());
        categories.forEach(cat => {
            const lastmod = (cat as { updatedAt?: Date }).updatedAt || new Date();
            sitemap += `
  <url>
    <loc>${frontendUrl}/category/${categorySlug(cat)}</loc>
    <lastmod>${lastmod.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.8</priority>
  </url>`;
        });

        tools.forEach(tool => {
            const lastmod = tool.updatedAt || tool.createdAt;
            sitemap += `
  <url>
    <loc>${frontendUrl}/ai-tools/${tool.slug}</loc>
    <lastmod>${lastmod.toISOString()}</lastmod>
    <changefreq>weekly</changefreq>
    <priority>0.6</priority>
  </url>`;
        });

        blogPosts.forEach(post => {
            const lastmod = post.updatedAt || new Date(post.date);
            sitemap += `
  <url>
    <loc>${frontendUrl}/blog/${post.slug}</loc>
    <lastmod>${lastmod.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
        });

        newsPosts.forEach(post => {
            const lastmod = post.updatedAt || new Date(post.date);
            sitemap += `
  <url>
    <loc>${frontendUrl}/news/${post.slug}</loc>
    <lastmod>${lastmod.toISOString()}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.6</priority>
  </url>`;
        });

        sitemap += `
</urlset>`;

        return new NextResponse(sitemap, {
            headers: {
                'Content-Type': 'application/xml',
                'Cache-Control': 'public, max-age=3600'
            }
        });
    } catch (error: unknown) {
        console.error('Error serving root sitemap:', error);
        return NextResponse.json({ error: 'Error generating sitemap' }, { status: 500 });
    }
}

