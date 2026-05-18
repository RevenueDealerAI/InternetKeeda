
import { NextResponse } from 'next/server';
import { scrapeNewTools } from '@/lib/scraper';

// This route can be called by a cron job service (like Vercel Cron, GitHub Actions, or manually)
// GET /api/cron/scrape?key=YOUR_SECRET_KEY
export async function GET(req: Request) {
    try {
        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');

        // Simple security check (replace 'admin_secret' with an env var in production)
        if (key !== process.env.CRON_SECRET && key !== 'admin_secret') {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await scrapeNewTools();

        return NextResponse.json(result);

    } catch (error: any) {
        console.error('Cron job error:', error);
        return NextResponse.json(
            { error: 'Scraping failed', details: error.message },
            { status: 500 }
        );
    }
}
