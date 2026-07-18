/**
 * Per-product sales copy for the server-rendered product page.
 *
 * The StoreProduct model already carries title / shortDescription /
 * description / includes / price. This module adds the EXTRA, scannable
 * sales sections the marketing page wants (hook, before/after, benefit
 * bullets, who-it's-for, what-you-need-to-run-it) WITHOUT changing the
 * DB schema — keyed by product slug.
 *
 * A product without an entry here still renders fine: the SSR page
 * falls back to description + includes only. So this map is purely
 * additive sales enrichment for the 5 workflow-bundle products.
 *
 * Honest-framing rule (enforced by review, not code): every entry
 * describes an importable template the buyer connects to their own
 * accounts. No testimonials, no invented metrics, no "done-for-you"
 * claims — the Implementation Support add-on is the only paid setup.
 */

export interface WorkflowSalesContent {
  /** One-line hook — the painful problem, in plain words. */
  hook: string;
  /** The before/after the automation delivers, no jargon. */
  whatItAutomates: { before: string; after: string };
  /** 3-4 concrete benefits (time saved, money recovered, 24/7, no code). */
  benefits: string[];
  /** Who this is for. */
  whoFor: string[];
  /** What the buyer needs to run it — accounts, all free to start. */
  requirements: string[];
}

export const WORKFLOW_SALES_CONTENT: Record<string, WorkflowSalesContent> = {
  'n8n-lead-instant-reply': {
    hook: 'A lead that waits even ten minutes for a reply is usually gone — or already talking to whoever answered first.',
    whatItAutomates: {
      before:
        'Someone fills your form, the lead sits unseen in an inbox, and by the time you reach out they have cooled off or moved on.',
      after:
        'The moment a lead submits, it is saved to a Google Sheet, the lead gets a personalized text back in seconds, and you get an email to call while they are still warm.',
    },
    benefits: [
      'Replies in seconds, 24/7 — no one watching the inbox required',
      'Every lead saved to a Sheet first, so nothing is ever lost even if the text fails',
      'Owner alert by email (or Slack) so a human can close the loop fast',
      'No coding — connect your own accounts and paste one webhook URL into your form',
    ],
    whoFor: [
      'Local businesses running ads or a contact form',
      'Agencies and solo founders driving paid traffic to a landing page',
      'Anyone who loses leads to slow follow-up',
    ],
    requirements: [
      'n8n (cloud or self-hosted)',
      'A Twilio account with an SMS-capable number',
      'A Google account (Google Sheets + Gmail)',
    ],
  },
  'n8n-missed-call-text-back': {
    hook: 'A missed call is a customer who is, right now, dialing the next business on the list.',
    whatItAutomates: {
      before:
        'Calls you cannot pick up go to voicemail (which most people never leave) and you never even know who tried to reach you.',
      after:
        'Every unanswered call triggers an instant "sorry we missed you" text to the caller and logs the number to a follow-up list — a lost call becomes a captured lead.',
    },
    benefits: [
      'Recover calls you physically could not answer — automatically',
      'Exactly one text per missed call (answered calls are ignored, no duplicates)',
      'A running Google Sheet of every missed caller to follow up on',
      'The DIY version of a paid SaaS feature, on your own Twilio number',
    ],
    whoFor: [
      'Service businesses — clinics, salons, trades, repair, hospitality',
      'Any small team that cannot always reach the phone',
      'Owners who lose revenue to voicemail',
    ],
    requirements: [
      'n8n (cloud or self-hosted)',
      'A Twilio account with an SMS-capable number that takes your calls',
      'A Google account (Google Sheets; optional Gmail alert)',
    ],
  },
  'n8n-review-request-engine': {
    hook: 'Reviews drive your local ranking — but asking is awkward, easy to forget, and almost never happens at the right moment.',
    whatItAutomates: {
      before:
        'You mean to ask happy customers for a Google review, but you forget, or you ask days later when the moment has passed.',
      after:
        'When a job is marked complete, the workflow waits until the customer is happiest, then texts a warm ask with a one-tap review link — and never asks the same person twice.',
    },
    benefits: [
      'Perfectly-timed ask sent automatically a couple of hours after the job',
      'One-tap g.page review link that lands straight on the star box',
      'Append-or-update logging means no customer is ever asked twice',
      'More reviews → higher local ranking → more trust → more customers',
    ],
    whoFor: [
      'Local service businesses chasing Google reviews',
      'E-commerce sellers asking for post-purchase reviews',
      'Agencies managing reviews on behalf of clients',
    ],
    requirements: [
      'n8n (cloud or self-hosted)',
      'A Twilio account with an SMS-capable number',
      'A Google account + a Google Business Profile (for the review link)',
    ],
  },
  'n8n-content-repurposer': {
    hook: 'Writing the piece is half the work; reformatting it for Twitter, LinkedIn and the newsletter is the half nobody has time for.',
    whatItAutomates: {
      before:
        'You publish one good post, then spend an hour manually rewriting it into a thread, a few LinkedIn posts, and a newsletter blurb.',
      after:
        'Paste one URL, pick a tone, and get a Twitter/X thread, three distinct LinkedIn posts, and a newsletter blurb — saved to a Sheet you copy straight from.',
    },
    benefits: [
      'Hours of reformatting collapse into a single click',
      'Three channels from one source, in the tone you choose',
      'Your AI key stays in an n8n credential — never written into the file',
      'Provider-agnostic — a few lines swap Claude for OpenAI',
    ],
    whoFor: [
      'Creators and solo operators repurposing their own content',
      'Marketers and founders feeding multiple channels',
      'Small content teams that need leverage, not another hire',
    ],
    requirements: [
      'n8n (cloud or self-hosted)',
      'An Anthropic API key (a few cents per article on the default model)',
      'A Google account (Google Sheets for the output)',
    ],
  },
  'n8n-rss-ai-draft': {
    hook: 'AI blogging is fast — and dangerous, because unsupervised drafts can put something wrong, off-brand, or risky on your live site.',
    whatItAutomates: {
      before:
        'You either hand-write every post from scratch, or you risk an AI pipeline that publishes slop with no human in the loop.',
      after:
        'It watches your RSS feeds and, when something new appears, AI-drafts an original post into a review folder marked NEEDS REVIEW — and stops. A human approves and posts.',
    },
    benefits: [
      'The speed of AI drafting with a mandatory human approval gate',
      'Never auto-publishes — there is intentionally no publish node',
      'Two-layer dedupe so the same article is not drafted twice',
      'Drafts written in your voice, ready for a quick human eyeball',
    ],
    whoFor: [
      'Editors and blog operators who want a draft pipeline, not an autopilot',
      'Small content teams covering a fast-moving niche',
      'Anyone who wants AI leverage without the publish-it-live risk',
    ],
    requirements: [
      'n8n (cloud or self-hosted)',
      'An Anthropic API key (cost scales with feed volume; low on sonnet)',
      'A Google account (Google Sheets for the review folder)',
    ],
  },
  'n8n-seo-research-bot': {
    hook: 'Google ships updates faster than anyone can read about them — and the ones you miss are the ones that cost you traffic.',
    whatItAutomates: {
      before:
        'You skim a dozen SEO blogs when you remember to, miss the week Google changes something that matters, and find out from a rankings drop.',
      after:
        'Every week it reads the new articles from Google Search Central and reputable SEO news, and Claude emails you one sourced briefing: headline findings with links, plus what changed and why it matters.',
    },
    benefits: [
      'A Claude-written research briefing in your inbox weekly — zero manual reading',
      'Every finding cited to its source; official Google statements weighted above speculation',
      'Never repeats itself — persistent dedup means each article is analyzed exactly once',
      'Quiet weeks cost nothing: no new articles means no email and no API spend',
    ],
    whoFor: [
      'Site owners and founders who live or die by organic traffic',
      'SEO consultants and agencies briefing clients on what changed',
      'Content and dev teams who need to catch indexing changes early',
    ],
    requirements: [
      'n8n (cloud or self-hosted)',
      'An Anthropic API key with billing enabled (one call/week — a few cents on the default model)',
      'A Gmail account (sends the briefing to you)',
    ],
  },
};

/** Lookup helper — returns the sales content for a slug, or null when
 *  the product has no enriched copy (falls back to description-only). */
export function getWorkflowSalesContent(
  slug: string
): WorkflowSalesContent | null {
  return WORKFLOW_SALES_CONTENT[slug] ?? null;
}
