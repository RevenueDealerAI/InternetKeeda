import { NextResponse, type NextRequest } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { connectDB } from '@/app/api/lib/db';
import { Tool } from '@/app/api/models/Tool';
import { StoreProduct } from '@/features/store/models/StoreProduct';
import { formatTool } from '@/app/api/lib/formatTool';
import { whatsappLink } from '@/lib/brand';
import { incrementDailyCounter, addDailyTokens } from '@/lib/ratelimit';
import {
  SERVER_MAX_TOKENS,
  SEARCH_MAX_TOKENS,
  FALLBACK_COUNTER_KEY,
  CANDIDATE_LIMIT,
  CANDIDATE_MIN,
  CANDIDATE_DESC_CHARS,
  SKIP_MIN_RESULTS,
  SKIP_MIN_TOP_SCORE,
  SKIP_SCORE_MARGIN,
  SKIP_ABS_TOP_SCORE,
} from '@/lib/ratelimit/config';
import {
  guardOnly,
  enforceRateOnly,
  enforceHitCeiling,
  CHAT_SCOPE,
  SEARCH_SCOPE,
} from '@/lib/ratelimit/enforce';
import { getAiCache, setAiCache } from './queryCache';

/**
 * Shared AI tool-search core for both routes, tuned for minimum spend:
 *   1. Result cache (queryCache) — checked by serveToolSearch BEFORE the
 *      limiter; a hit returns instantly with zero Anthropic call.
 *   2. $text prefilter → top CANDIDATE_LIMIT (was 500) with rating
 *      top-up, trimmed to name/desc/tags — ~2-3k prompt tokens, not ~65k.
 *   3. SEARCH only: skip Claude when the text match is confident.
 *   4. Cheapest model; prompt caching on the STABLE system prompt only
 *      (the catalog varies per query, so it is not cached).
 * On any upstream error it degrades to keyword search, LOUDLY (real
 * error logged + fallback:global:day counter).
 */

const WA_URL = whatsappLink();
const MODEL = 'claude-haiku-4-5';
const PUBLIC = { status: { $in: ['published', 'approved'] } };

export const CHAT_SYSTEM_PROMPT = `You are Riley, the concierge for Internet Keeda — a hand-curated atlas of the AI internet (5,000+ tools). Operated by Revenue Dealer MarTech Pvt Ltd; domain internetkeeda.com. You ALSO concierge the "Keeda Labs" store at /store (published n8n workflows + automation packs).

# Job
1. TASK/TOOL queries → pick the 3–8 most relevant tools from the catalog, ranked by fit; optionally 1–2 nav links.
2. NAVIGATION/WORKFLOW queries → nav links; tools may be empty.
3. HYBRID → both.

# Site map (hrefs literal)
/  /#pricing (any pricing/cost question)  /categories  /category/<slug>  /ai-tools/<slug>  /latest-launches  /recently-added  /trending  /top-products  /reviews  /blog  /guides  /faq  /advertise  /submit-tool  /sign-in  /sign-up  /dashboard  /about  /store  /store/<slug>  /store/my-downloads

# Recipes
- pricing → [{label:"See pricing",href:"/#pricing"}]
- list/submit → [{label:"See pricing",href:"/#pricing"},{label:"Submit your tool",href:"/submit-tool"}]
- advertise → [{label:"See pricing",href:"/#pricing"},{label:"Advertise overview",href:"/advertise"}]
- workflows/n8n/automation to buy → [{label:"Browse Keeda Labs",href:"/store"}] + store_indices
- human/billing help → WhatsApp: label "Chat on WhatsApp", href "${WA_URL}"

# Pricing
Monthly Listing $10/mo (base). Boost·Category $12/7d. Boost·Home $30/7d. Featured Badge $60/30d. PayPal (USD) / Cashfree (INR ~₹830).

# Voice
Opinionated, dense, anti-corporate. No emoji, no preamble, no apologies. One short sentence, under 25 words.

# Output
Structured only. tool_indices are 1-based into the tool catalog; store_indices 1-based into the Keeda Labs catalog (only for deployable workflows); links {label,href} literal, max 4.`;

export const SEARCH_SYSTEM_PROMPT = `You are the tool-search ranker for Internet Keeda, a directory of AI tools. Given a user query and a numbered candidate list, return ONLY the 1-based indices of the best-matching tools (3–8), ranked best-fit first, via the structured output. No prose. Empty array if nothing fits.`;

interface ToolLean {
  _id: unknown;
  name: string;
  slug: string;
  description: string;
  category: string;
  tags?: string[];
  features?: string[];
  pricing?: { type?: string };
  rating?: number;
  views?: number;
}
interface StoreLean {
  _id: unknown;
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  category: string;
  priceUsdMinor: number;
  priceInrMinor: number;
  tags?: string[];
}
interface Candidate {
  doc: ToolLean;
  score: number;
}

export interface ToolSearchOutcome {
  reply?: string;
  tools: unknown[];
  storeProducts?: unknown[];
  links?: Array<{ label: string; href: string }>;
  usedFallback: boolean;
  skipped?: boolean;
}

/**
 * Prefilter the catalog to a small candidate pool via a Mongo $text
 * search (name+description text index), topped up with the highest-rated
 * published tools when the query matches too few. Cuts the prompt from
 * ~500 tools to CANDIDATE_LIMIT.
 */
async function fetchCandidates(query: string, includeStore: boolean): Promise<{ candidates: Candidate[]; store: StoreLean[] }> {
  await connectDB();
  let scored: Candidate[] = [];
  try {
    const docs = (await Tool.find(
      { ...PUBLIC, $text: { $search: query } },
      { score: { $meta: 'textScore' } },
    )
      .sort({ score: { $meta: 'textScore' } })
      .limit(CANDIDATE_LIMIT)
      .lean()) as Array<ToolLean & { score?: number }>;
    scored = docs.map((d) => ({ doc: d, score: d.score ?? 0 }));
  } catch {
    // No text index or a $text-hostile query → topup fills the pool.
    scored = [];
  }

  if (scored.length < CANDIDATE_MIN) {
    const haveIds = scored.map((s) => s.doc._id);
    const topup = (await Tool.find({ ...PUBLIC, _id: { $nin: haveIds } })
      .sort({ rating: -1, views: -1 })
      .limit(CANDIDATE_LIMIT - scored.length)
      .lean()) as ToolLean[];
    for (const d of topup) scored.push({ doc: d, score: 0 });
  }

  const store = includeStore
    ? ((await StoreProduct.find({ status: 'published' }).sort({ _id: 1 }).limit(60).lean()) as StoreLean[])
    : [];
  return { candidates: scored.slice(0, CANDIDATE_LIMIT), store };
}

function candidateText(candidates: Candidate[]): string {
  return candidates
    .map((c, i) => `${i + 1}. ${c.doc.name} — ${(c.doc.description || '').replace(/\s+/g, ' ').slice(0, CANDIDATE_DESC_CHARS)}. Tags: ${(c.doc.tags || []).slice(0, 5).join(', ')}.`)
    .join('\n');
}

function storeText(store: StoreLean[]): string {
  if (store.length === 0) return '(Keeda Labs has no published products yet — never populate store_indices.)';
  return store
    .map((s, i) => `${i + 1}. ${s.title} (${s.category}) [$${(s.priceUsdMinor / 100).toFixed(2)}] slug=${s.slug}: ${(s.shortDescription || s.description || '').slice(0, 140)}. Tags: ${(s.tags || []).slice(0, 5).join(', ')}.`)
    .join('\n');
}

/** SEARCH only: is the text prefilter confident enough to skip Claude? */
function strongMatch(candidates: Candidate[]): boolean {
  if (candidates.length < SKIP_MIN_RESULTS) return false;
  const top = candidates[0].score;
  // Very high absolute score → confident literal match, skip regardless
  // of margin.
  if (top >= SKIP_ABS_TOP_SCORE) return true;
  const nth = candidates[SKIP_MIN_RESULTS - 1].score;
  return top >= SKIP_MIN_TOP_SCORE && top >= SKIP_SCORE_MARGIN * (nth || 0.0001);
}

/** Rank by text score then rating and format the top n. */
function rankTop(candidates: Candidate[], n: number): unknown[] {
  return [...candidates]
    .sort((a, b) => b.score - a.score || (b.doc.rating || 0) - (a.doc.rating || 0))
    .slice(0, n)
    .map((c) => formatTool(c.doc as never));
}

function storeCard(p: StoreLean) {
  return {
    _id: String(p._id),
    title: p.title,
    slug: p.slug,
    shortDescription: p.shortDescription || p.description?.slice(0, 200) || '',
    category: p.category,
    priceUsdMinor: p.priceUsdMinor,
    priceInrMinor: p.priceInrMinor,
    tags: p.tags || [],
  };
}

interface UsageLike {
  input_tokens?: number;
  output_tokens?: number;
  cache_creation_input_tokens?: number | null;
  cache_read_input_tokens?: number | null;
}
function logUsage(scope: 'chat' | 'search', usage: UsageLike | undefined) {
  const input = usage?.input_tokens ?? 0;
  const output = usage?.output_tokens ?? 0;
  const cacheCreate = usage?.cache_creation_input_tokens ?? 0;
  const cacheRead = usage?.cache_read_input_tokens ?? 0;
  if (process.env.RL_DEBUG_UPSTREAM === '1') {
    console.log('[ai-usage][debug] scope=%s input_tokens=%d cache_creation_input_tokens=%d cache_read_input_tokens=%d output_tokens=%d', scope, input, cacheCreate, cacheRead, output);
  }
  void addDailyTokens(scope, { input, output, cacheRead });
}

/** Run the AI tool search (no cache here — serveToolSearch owns caching).
 *  Never throws — degrades to keyword search on any upstream error. */
export async function runToolSearch(query: string, mode: 'chat' | 'search'): Promise<ToolSearchOutcome> {
  const isChat = mode === 'chat';
  const { candidates, store } = await fetchCandidates(query, isChat);

  if (candidates.length === 0) {
    return { tools: [], usedFallback: false, ...(isChat ? { reply: "The catalog hasn't been indexed yet — check back in a minute." } : {}) };
  }

  // SEARCH: skip Claude entirely on a confident text match.
  if (!isChat && strongMatch(candidates)) {
    void incrementDailyCounter('search:claude_skipped:day');
    console.log('[search] claude_skipped (strong text match, top=%s)', candidates[0].score.toFixed(2));
    return { tools: rankTop(candidates, 8), usedFallback: false, skipped: true };
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return keywordFallback(query, mode);
  if (!isChat) void incrementDailyCounter('search:claude_called:day');

  try {
    const client = new Anthropic({ apiKey });
    const catalog = candidateText(candidates);
    const prefixText = isChat
      ? `# Candidate tool catalog\n\n${catalog}\n\n# Keeda Labs catalog (PUBLISHED only)\n\n${storeText(store)}`
      : `# Candidate tool catalog\n\n${catalog}`;

    if (process.env.RL_DEBUG_UPSTREAM === '1') {
      console.log('[ai-search][debug] scope=%s upstream model=%s max_tokens=%d candidates=%d systemSource=SERVER_PROMPT (client model/system/max_tokens/temperature ignored)', mode, MODEL, isChat ? SERVER_MAX_TOKENS : SEARCH_MAX_TOKENS, candidates.length);
    }

    const schema = isChat
      ? {
          type: 'object',
          properties: {
            reply: { type: 'string', description: 'One short sentence (<25 words).' },
            tool_indices: { type: 'array', items: { type: 'integer' }, description: '1-based indices into the candidate tool catalog, best-fit first.' },
            store_indices: { type: 'array', items: { type: 'integer' }, description: '1-based indices into the Keeda Labs catalog.' },
            links: { type: 'array', items: { type: 'object', properties: { label: { type: 'string' }, href: { type: 'string' } }, required: ['label', 'href'], additionalProperties: false } },
          },
          required: ['reply', 'tool_indices', 'store_indices', 'links'],
          additionalProperties: false,
        }
      : {
          type: 'object',
          properties: { tool_indices: { type: 'array', items: { type: 'integer' }, description: '1-based indices into the candidate catalog, best-fit first.' } },
          required: ['tool_indices'],
          additionalProperties: false,
        };

    const response = await client.messages.create({
      model: MODEL,
      max_tokens: isChat ? SERVER_MAX_TOKENS : SEARCH_MAX_TOKENS,
      system: [
        // STABLE system prompt → cached. The catalog varies per query, so
        // it is a separate, uncached block after the breakpoint.
        { type: 'text', text: isChat ? CHAT_SYSTEM_PROMPT : SEARCH_SYSTEM_PROMPT, cache_control: { type: 'ephemeral' } },
        { type: 'text', text: prefixText },
      ],
      messages: [
        {
          role: 'user',
          content: isChat
            ? `User query: "${query}"\n\nPick the best-matching tools and write a one-line reply.`
            : `User query: "${query}"\n\nReturn the tool_indices of the best matches.`,
        },
      ],
      output_config: { format: { type: 'json_schema', schema } },
    });

    logUsage(mode, response.usage);
    if (response.stop_reason === 'max_tokens') {
      throw new Error(`response truncated (stop_reason=max_tokens, output_tokens=${response.usage?.output_tokens})`);
    }

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    if (!textBlock) throw new Error('no text block in response');
    const parsed = JSON.parse(textBlock.text) as { reply?: string; tool_indices?: number[]; store_indices?: number[]; links?: Array<{ label: string; href: string }> };

    const picked = (parsed.tool_indices || []).map((idx) => candidates[idx - 1]?.doc).filter(Boolean).slice(0, 8);

    if (!isChat) {
      return { tools: picked.map((t) => formatTool(t as never)), usedFallback: false };
    }

    const pickedStore = (parsed.store_indices || []).map((idx) => store[idx - 1]).filter(Boolean).slice(0, 6).map((p) => storeCard(p as StoreLean));
    const links = (parsed.links || []).filter((l) => l && typeof l.label === 'string' && typeof l.href === 'string' && (l.href.startsWith('/') || l.href === WA_URL)).slice(0, 4);
    return { reply: parsed.reply || 'Here are the closest matches in the index:', tools: picked.map((t) => formatTool(t as never)), storeProducts: pickedStore, links, usedFallback: false };
  } catch (err) {
    const e = err as { status?: number; message?: string; error?: { error?: { message?: string; type?: string } } };
    console.error(`[ai-search] upstream FAILED (mode=${mode}) — keyword fallback. status=${e?.status} type=${e?.error?.error?.type} message=${e?.error?.error?.message || e?.message}`);
    void incrementDailyCounter(FALLBACK_COUNTER_KEY).catch(() => {});
    return keywordFallback(query, mode);
  }
}

/** Mongo keyword/regex search — the fallback path (and the no-API-key path). */
async function keywordFallback(query: string, mode: 'chat' | 'search'): Promise<ToolSearchOutcome> {
  await connectDB();
  const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  const isChat = mode === 'chat';
  const toolQuery = {
    ...PUBLIC,
    $or: [
      { name: { $regex: query, $options: 'i' } },
      { description: { $regex: query, $options: 'i' } },
      { category: { $regex: query, $options: 'i' } },
      { tags: { $in: terms } },
      { features: { $in: terms } },
    ],
  };

  if (!isChat) {
    const tools = await Tool.find(toolQuery).sort({ rating: -1, views: -1 }).limit(8);
    return { tools: tools.map(formatTool), usedFallback: true };
  }

  const [tools, storeMatches] = await Promise.all([
    Tool.find(toolQuery).sort({ rating: -1, views: -1 }).limit(8),
    StoreProduct.find({
      status: 'published',
      $or: [
        { title: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { shortDescription: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { tags: { $in: terms } },
      ],
    })
      .sort({ salesCount: -1, createdAt: -1 })
      .limit(4)
      .lean() as Promise<StoreLean[]>,
  ]);

  const wantsStore = /\b(workflow|n8n|template|automation|automat|pack|recipe|download|buy|store|keeda\s*labs)\b/i.test(query);
  const links: Array<{ label: string; href: string }> = [];
  if ((storeMatches.length > 0 || wantsStore) && storeMatches.length < 4) links.push({ label: 'Browse Keeda Labs', href: '/store' });
  const total = tools.length + storeMatches.length;
  return {
    reply: total > 0 ? "Here's what matched on a keyword pass — the AI router is offline:" : 'No matches on a keyword search. Try fewer or more specific words?',
    tools: tools.map(formatTool),
    storeProducts: storeMatches.map(storeCard),
    links,
    usedFallback: true,
  };
}

/**
 * Full route handler for both scopes:
 *   guards → result-cache (HIT = free, no limiter) → rate limiter →
 *   runToolSearch → cache the result → respond with X-Cache.
 */
export async function serveToolSearch(req: NextRequest, scope: 'chat' | 'search'): Promise<NextResponse> {
  const cfg = scope === 'chat' ? CHAT_SCOPE : SEARCH_SCOPE;

  const g = await guardOnly(req);
  if (g.kind === 'reject') return g.response;
  const query = g.query;
  // contextHash folds any conversation history into the cache key (chat
  // cache safety) — undefined when the body is just { query }.
  const ctxHash = g.contextHash;

  // Result cache — AFTER abuse guards, BEFORE the tier limiter/breaker. A
  // HIT consumes no tier quota and no cost-breaker budget, but still must
  // clear the loose per-identity HIT ceiling so it can't be hammered.
  const cached = await getAiCache(scope, query, ctxHash);
  if (cached !== null) {
    const ceiling = await enforceHitCeiling(req, cfg);
    if (ceiling.kind === 'reject') return ceiling.response;
    void incrementDailyCounter(`cache:hit:${scope}:day`);
    return NextResponse.json(cached, { headers: { 'X-Cache': 'HIT', ...ceiling.headers } });
  }
  void incrementDailyCounter(`cache:miss:${scope}:day`);

  const gate = await enforceRateOnly(req, cfg);
  if (gate.kind === 'reject') return gate.response;

  let out: ToolSearchOutcome;
  try {
    out = await runToolSearch(query, scope);
  } catch (err) {
    console.error(`[${scope}] fatal:`, err);
    const p = scope === 'chat' ? { reply: 'Search is down right now — try again in a minute.', tools: [] } : { tools: [] };
    return NextResponse.json(p, { headers: { 'X-Cache': 'MISS', ...gate.headers } });
  }

  const payload =
    scope === 'chat'
      ? { reply: out.reply, tools: out.tools, storeProducts: out.storeProducts ?? [], links: out.links ?? [] }
      : { tools: out.tools };

  // Cache non-empty results. Skip caching the CHAT "router offline"
  // fallback (temporary) — but DO cache SEARCH keyword results, which are
  // legitimate. Real Claude / skip results are always cached.
  const hasContent = (Array.isArray(out.tools) && out.tools.length > 0) || !!out.reply;
  const cacheable = hasContent && (!out.usedFallback || scope === 'search');
  if (cacheable) void setAiCache(scope, query, payload, ctxHash);

  return NextResponse.json(payload, { headers: { 'X-Cache': 'MISS', ...gate.headers } });
}
