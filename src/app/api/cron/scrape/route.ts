import { NextResponse } from 'next/server';
import { scrapeNewTools } from '@/lib/scraper';

// GET /api/cron/scrape?key=<CRON_SECRET>
//
// CRON_SECRET must be set in the deployment environment. The route 401s
// unconditionally if the env var is missing, if it's an empty string, or
// if the supplied `key` doesn't match it exactly. No hard-coded fallback.
export async function GET(req: Request) {
    try {
        const expected = process.env.CRON_SECRET;
        if (!expected) {
            console.error('CRON_SECRET env var is not set; refusing scrape trigger.');
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const { searchParams } = new URL(req.url);
        const key = searchParams.get('key');
        if (!key || key !== expected) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const result = await scrapeNewTools();
        return NextResponse.json(result);
    } catch (error: unknown) {
        const message = error instanceof Error ? error.message : 'Unknown error';
        console.error('Cron job error:', error);
        return NextResponse.json(
            { error: 'Scraping failed', details: message },
            { status: 500 }
        );
    }
}
