import { NextRequest, NextResponse } from 'next/server';
import Anthropic from '@anthropic-ai/sdk';
import { connectDB } from '../../lib/db';
import { errorResponse } from '../../lib/auth';
import { formatTool } from '../../lib/formatTool';
import { Tool } from '../../models/Tool';

export const dynamic = 'force-dynamic';

// POST /api/tools/ai-search
// Input:  { query: string }
// Output: { reply: string, tools: FormattedTool[], links: NavLink[] }
//
// Maya — Internet Keeda's concierge. Routes free-text user queries
// across the published tool catalog AND the site's information
// architecture. Uses Claude (Haiku 4.5 — fast and cheap, the catalog
// is the heavy lifting, not the reasoning) with structured outputs
// to return:
//   - reply:        one short conversational sentence
//   - tool_indices: 1-based indices of recommended tools (3–8)
//   - links:        navigation suggestions (about, pricing, submit, etc.)
// The catalog + project context are cached with cache_control so
// subsequent requests within the 5-minute TTL only pay ~10% for the
// prefix.
//
// Falls back to a Mongo regex/text search if ANTHROPIC_API_KEY is unset
// or the model call fails — never returns an error to the chat UI.

interface ToolSummary {
  _id: string;
  name: string;
  slug: string;
  description: string;
  category: string;
  tags: string[];
  features: string[];
  pricing: { type: string };
  rating: number;
  views: number;
}

const SYSTEM_PROMPT = `You are Riley, the concierge for Internet Keeda — a hand-curated atlas of the AI internet (5,000+ tools across writing, design, code, audio, video, research, agents, automation, voice, vision, 3D, marketing, and more). Internet Keeda is operated by Revenue Dealer MarTech Pvt Ltd. The domain is internetkeeda.com.

# Your job
You help users find AI tools AND navigate the site. Three kinds of requests:

1. TASK / TOOL queries ("best image generator", "code companion", "lip sync for podcasts")
   → Pick the 3–8 most relevant tools from the indexed catalog below, ranked by fit.
   → Surface 1–2 navigation links if a category page or "best of" list is a natural follow-up.

2. NAVIGATION / WORKFLOW queries ("how do I list my tool?", "where's the pricing?", "do you have a blog?")
   → Return relevant navigation links. Tools may be empty.
   → Reply explains what each link covers in one sentence.

3. HYBRID ("I want to advertise my video tool, what does it cost?")
   → Both tools (a few examples from the category) AND links (Advertise + Pricing).

# Site map (use these hrefs literally — do not invent slugs)
- /                          Home — hero, launches, agent, pricing
- /categories                All 42+ categories grid
- /category/<slug>           Tools in a category. Real slugs include /category/image-generation, /category/code-and-developer-tools, /category/ai-chatbots-and-assistants, /category/writing-and-copywriting, /category/voice-and-speech, /category/video-generation, /category/content-creation, /category/research-and-academic-tools, /category/no-code-and-automation, /category/productivity, /category/customer-support
- /ai-tools/<slug>           Individual tool detail page
- /latest-launches           Newest tools added to the index
- /recently-added            Same idea, ordered by createdAt
- /trending                  Tools ranked by upvotes + views
- /top-products              Highest-rated catalog-wide
- /latest-news               AI industry news
- /news                      Full news archive
- /blog                      Long-form posts
- /guides                    How-to guides
- /events                    AI events calendar
- /discussions               Community discussions
- /faq                       Frequently asked questions
- /advertise                 For tool creators — sponsored placement explainer
- /submit-tool               Submit a new tool to the index (requires sign-in)
- /sign-in, /sign-up         Auth flows (Clerk)
- /dashboard                 Logged-in dashboard (My tools, billing)
- /subscription              Manage subscription
- /about, /privacy, /terms, /refunds   Legal + company

# Contact / support
- Primary support channel: WhatsApp at https://wa.me/internetkeeda
- If a user asks for human help, billing help, complains about a missing tool, or wants to talk to the team, surface the WhatsApp link in the \`links\` array with label "Chat on WhatsApp" and href "https://wa.me/internetkeeda".
- Reminder: external URLs are allowed in the \`links\` array — the WhatsApp URL is one of them.

# Pricing — there is exactly ONE plan (memorize this; do not invent boost or featured tiers)
- Monthly Listing — $10/month, recurring. The only plan available.
  - Public listing on internetkeeda.com
  - Category placement + search index
  - Real-time analytics dashboard
  - Editorial review on submission
  - Soft-delete safety net for missed payments
  - Cancel anytime from the dashboard
- Payment provider: Cashfree (USD-anchored, ~₹830/month at checkout for Indian buyers).
- There are NO Boost (Category/Home) tiers and NO Featured Badge tier in the current product. If a user asks about boosts, featured placement, or promotion: tell them honestly that those tiers aren't live right now — only the $10/month Monthly Listing is purchasable.

# Voice
Opinionated, dense, anti-corporate. Lower-case section labels, sentence-case headlines. No emoji. No preamble. No apologies. No "I'd be happy to help". One short sentence — under 25 words. Examples:
- "Here's the stack I'd reach for this week:"
- "Pricing lives on the home page — $10/month for a listing, boosts on top. Here's the page:"
- "Stable Diffusion covers the core; the rest are flavor:"
- "To list your tool: sign in, submit it, $10/month after approval. Here's the submit page:"
- "Nothing matched cleanly — try naming the output instead of the workflow?"

# Output rules
- Always respond via the structured output format.
- tool_indices are 1-based into the catalog below. Empty array if the query is purely navigational.
- links are objects { label, href }. Use the literal hrefs from the site map. Empty array if the query is purely a tool lookup with no useful follow-up. Max 4 links.
- If query is irrelevant to AI tools or the site (small talk, weather, random facts), still reply in one line and gently redirect: "I'm here for AI-tool routing and site navigation — anything in that lane I can help with?"`;

export async function POST(req: NextRequest) {
  try {
    await connectDB();

    const { query } = await req.json();
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const apiKey = process.env.ANTHROPIC_API_KEY;
    if (!apiKey) {
      return await semanticSearchFallback(query);
    }

    const tools = await Tool.find({
      status: { $in: ['published', 'approved'] },
    }).limit(500);

    if (tools.length === 0) {
      return NextResponse.json({ reply: "The catalog hasn't been indexed yet — check back in a minute.", tools: [] });
    }

    const summaries: ToolSummary[] = tools.map((t) => ({
      _id: String(t._id),
      name: t.name,
      slug: t.slug,
      description: t.description,
      category: t.category,
      tags: t.tags || [],
      features: t.features || [],
      pricing: { type: t.pricing?.type || 'free' },
      rating: t.rating || 0,
      views: t.views || 0,
    }));

    const catalog = summaries
      .map(
        (s, i) =>
          `${i + 1}. ${s.name} (${s.category}) [${s.pricing.type}]: ${s.description}. Tags: ${s.tags.slice(0, 5).join(', ')}.`,
      )
      .join('\n');

    const client = new Anthropic({ apiKey });
    const response = await client.messages.create({
      model: 'claude-haiku-4-5',
      max_tokens: 1024,
      system: [
        {
          type: 'text',
          text: SYSTEM_PROMPT,
        },
        {
          type: 'text',
          text: `# Indexed tool catalog\n\n${catalog}`,
          cache_control: { type: 'ephemeral' },
        },
      ],
      messages: [
        {
          role: 'user',
          content: `User query: "${query.trim()}"\n\nPick the best-matching tools from the catalog and write a one-line reply.`,
        },
      ],
      output_config: {
        format: {
          type: 'json_schema',
          schema: {
            type: 'object',
            properties: {
              reply: {
                type: 'string',
                description: 'One short conversational sentence (under 25 words) introducing the picks.',
              },
              tool_indices: {
                type: 'array',
                items: { type: 'integer' },
                description: '1-based indices of recommended tools, ranked best-fit first. Empty array if nothing fits.',
              },
              links: {
                type: 'array',
                description:
                  'Up to 4 navigation suggestions. Each link should help the user take the next step (a category page, pricing, /advertise, /submit-tool, /faq, the WhatsApp support link, etc.). Empty array if nothing useful applies.',
                items: {
                  type: 'object',
                  properties: {
                    label: { type: 'string', description: 'Short label, max 4 words.' },
                    href: {
                      type: 'string',
                      description:
                        'A literal href from the site map (starts with /) OR the WhatsApp link "https://wa.me/internetkeeda". No other external URLs.',
                    },
                  },
                  required: ['label', 'href'],
                  additionalProperties: false,
                },
              },
            },
            required: ['reply', 'tool_indices', 'links'],
            additionalProperties: false,
          },
        },
      },
    });

    const textBlock = response.content.find((b): b is Anthropic.TextBlock => b.type === 'text');
    if (!textBlock) {
      return await semanticSearchFallback(query);
    }

    let parsed: {
      reply: string;
      tool_indices: number[];
      links?: Array<{ label: string; href: string }>;
    };
    try {
      parsed = JSON.parse(textBlock.text);
    } catch {
      return await semanticSearchFallback(query);
    }

    const picked = (parsed.tool_indices || [])
      .map((idx) => tools[idx - 1])
      .filter(Boolean)
      .slice(0, 8);

    const links = (parsed.links || [])
      .filter(
        (l) =>
          l &&
          typeof l.label === 'string' &&
          typeof l.href === 'string' &&
          (l.href.startsWith('/') || l.href === 'https://wa.me/internetkeeda'),
      )
      .slice(0, 4);

    return NextResponse.json({
      reply: parsed.reply || 'Here are the closest matches in the index:',
      tools: picked.map(formatTool),
      links,
    });
  } catch (error: unknown) {
    console.error('AI search error:', error);
    try {
      const body = await req.json().catch(() => ({ query: '' }));
      if (body?.query) return await semanticSearchFallback(body.query);
    } catch {
      /* ignore */
    }
    return errorResponse('Failed to search tools', 500);
  }
}

async function semanticSearchFallback(query: string) {
  try {
    await connectDB();
    const terms = query.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
    const tools = await Tool.find({
      status: { $in: ['published', 'approved'] },
      $or: [
        { name: { $regex: query, $options: 'i' } },
        { description: { $regex: query, $options: 'i' } },
        { category: { $regex: query, $options: 'i' } },
        { tags: { $in: terms } },
        { features: { $in: terms } },
      ],
    })
      .sort({ rating: -1, views: -1 })
      .limit(8);

    return NextResponse.json({
      reply:
        tools.length > 0
          ? "Here's what matched on a keyword pass — the AI router is offline:"
          : 'No matches on a keyword search. Try fewer or more specific words?',
      tools: tools.map(formatTool),
    });
  } catch (err) {
    console.error('Fallback search error:', err);
    return NextResponse.json({ reply: 'Search is down right now — try again in a minute.', tools: [] });
  }
}
