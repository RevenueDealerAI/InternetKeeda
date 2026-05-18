import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { Tool } from '../../models/Tool';
import { BlogPost } from '../../models/BlogPost';
import { NewsPost } from '../../models/NewsPost';

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
      } catch {
        // ignore invalid referer, fall back to host
      }
    }

    if (host) {
      if (host.includes('aitoolfind.co') || host.includes('netlify') || host.includes('vercel')) {
        frontendUrl = `${protocol}://${host}`;
      } else {
        frontendUrl = `${protocol}://${host.replace(':3005', '')}`;
      }
    }

    frontendUrl = frontendUrl || 'http://localhost:3000';
  }

  return frontendUrl;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const [toolsCount, blogPostsCount, newsPostsCount] = await Promise.all([
      Tool.countDocuments({ status: { $in: ['published', 'approved'] } }),
      BlogPost.countDocuments({ status: 'published' }),
      NewsPost.countDocuments({ status: 'published' }),
    ]);

    const staticPagesCount = 15;
    const totalUrls = staticPagesCount + toolsCount + blogPostsCount + newsPostsCount;

    const frontendUrl = determineFrontendUrl(req);

    const sitemapData = {
      totalUrls,
      breakdown: {
        staticPages: staticPagesCount,
        tools: toolsCount,
        blogPosts: blogPostsCount,
        newsPosts: newsPostsCount,
      },
      lastGenerated: new Date().toISOString(),
      sitemapUrl: `${frontendUrl}/sitemap.xml`,
    };

    return NextResponse.json({
      success: true,
      message: 'Sitemap generated successfully',
      data: sitemapData,
    });
  } catch (error) {
    console.error('Error generating sitemap metadata:', error);
    return NextResponse.json(
      {
        success: false,
        message: 'Failed to generate sitemap',
      },
      { status: 500 },
    );
  }
}





