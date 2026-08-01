import { NextRequest } from 'next/server';
import { serveToolSearch } from '@/lib/ai/toolSearch';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';
export const maxDuration = 30;

/**
 * POST /api/tools/ai-search — Riley, the conversational concierge
 * (KeedaChat). Chat scope: chat limits, chat:global:day breaker, always
 * uses Claude on a cache miss, returns reply + tools + storeProducts +
 * links. Result cache, abuse guards, and the limiter are all handled in
 * serveToolSearch (cache checked before the limiter; a HIT is free).
 */
export async function POST(req: NextRequest) {
  return serveToolSearch(req, 'chat');
}
