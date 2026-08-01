import { NextRequest } from 'next/server';
import { serveToolSearch } from '@/lib/ai/toolSearch';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/tools/search — browsing/directory search (homepage + hero
 * boxes). Search scope: generous search limits, its OWN search:global:day
 * breaker (never touches chat), no reply. On a cache miss it $text-
 * prefilters and may skip Claude entirely on a confident match; returns
 * { tools } only. Cache/guards/limiter handled in serveToolSearch.
 */
export async function POST(req: NextRequest) {
  return serveToolSearch(req, 'search');
}
