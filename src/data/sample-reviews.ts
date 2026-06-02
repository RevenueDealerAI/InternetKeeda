/**
 * Hand-written sample reviews for the six tools featured on the
 * /reviews index when the DB is empty. These power the detail page
 * at /reviews/[slug] for any slug that begins with "sample-".
 *
 * Authored in the Internet Keeda voice: opinionated, dense, no
 * marketing reprints. Structured so the detail layout can render
 * a TL;DR, pros / cons, sectioned breakdown, pricing, alternatives,
 * and a final verdict — not just a wall of text.
 */

export interface ReviewSubscore {
  label: string;
  value: number; // 0-5, one decimal
}

export interface ReviewPricingTier {
  tier: string;
  price: string;
  blurb: string;
}

export interface ReviewAlternative {
  name: string;
  blurb: string;
}

export interface ReviewSection {
  heading: string;
  paragraphs?: string[];
  bullets?: string[];
}

export interface SampleReview {
  slug: string;
  toolName: string;
  toolDomain: string;
  category: string;
  title: string;
  verdict: string; // one-line headline takeaway
  rating: number; // 0-5, one decimal
  subscores: ReviewSubscore[];
  reviewedOn: string; // ISO date — also the createdAt on the index
  testedFor: string; // human duration phrase, e.g. "14 days"
  reviewer: { name: string; avatar: string; role: string };
  excerpt: string; // same string as the index card uses
  tldr: string[]; // 3-5 short bullets
  pros: string[]; // 4-6 items
  cons: string[]; // 3-5 items
  bestFor: string[];
  notFor: string[];
  sections: ReviewSection[];
  pricing: ReviewPricingTier[];
  alternatives: ReviewAlternative[];
  bottomLine: string;
}

const EDITORIAL_REVIEWER = {
  name: 'Internet Keeda Editorial',
  role: 'Editorial desk',
  avatar: '/branding/riley.jpg',
};

export const SAMPLE_REVIEWS: SampleReview[] = [
  {
    slug: 'sample-claude-sonnet-4-5-review',
    toolName: 'Claude',
    toolDomain: 'anthropic.com',
    category: 'Chat models',
    title:
      'Claude Sonnet 4.5 — the reasoning model that ships answers, not lectures',
    verdict:
      'The first frontier model where the first answer is usually shippable. Worth the move from GPT-5 for engineering and analyst workloads.',
    rating: 4.8,
    subscores: [
      { label: 'Reasoning', value: 4.9 },
      { label: 'Coding', value: 4.8 },
      { label: 'Speed', value: 4.4 },
      { label: 'Writing', value: 4.6 },
      { label: 'Value', value: 4.7 },
    ],
    reviewedOn: '2026-05-30T08:00:00.000Z',
    testedFor: '14 days of daily production use',
    reviewer: EDITORIAL_REVIEWER,
    excerpt:
      'Two weeks of daily use. Claude Sonnet 4.5 is the first frontier model where I trust the first answer enough to ship it. Coding tasks land more often, refusals are calibrated, and the latency makes it usable in conversation. Where it still misses: long agentic loops and creative writing under tight constraints.',
    tldr: [
      'Best-in-class on multi-step reasoning, code generation, and structured extraction.',
      'Refusal behavior is finally calibrated — fewer false denials on benign requests.',
      'Latency feels conversational; first token under 600ms on most prompts.',
      'Still trails on long agentic loops (>20 tool calls) and tightly constrained creative writing.',
      'At $3 in / $15 out per million tokens, sits between GPT-5 and Sonnet 4 — fair, not cheap.',
    ],
    pros: [
      'First-pass answers ship without a regeneration roughly 80% of the time in our tests.',
      'Tool-use planning is qualitatively a tier above 4.0 — fewer redundant searches.',
      'Artifacts UI in claude.ai is the most ergonomic editor in any frontier chat product.',
      'Strong context recall up to ~180k tokens; 1M context tier is genuinely usable.',
      'Refusal calibration is the single biggest UX improvement of the year.',
    ],
    cons: [
      'Image generation is still bolted-on — no native model, falls back to a partner.',
      'Voice mode lags GPT-5 by a wide margin; not production-ready for real conversations.',
      'Per-token pricing at the API level is higher than every Sonnet that came before.',
      'Long agentic runs still occasionally drift into loops without explicit guard prompts.',
    ],
    bestFor: [
      'Engineers shipping production code with AI-in-the-loop',
      'Analysts running structured extraction over messy text',
      'Anyone who wants long-form writing that reads like a draft, not a press release',
    ],
    notFor: [
      'Voice-first workflows (use GPT-5 Voice for now)',
      'Image generation as a primary use case (use Midjourney, Ideogram, or GPT-5 image)',
      'Users on a strict per-token budget for high-volume classification tasks',
    ],
    sections: [
      {
        heading: 'What changed from Sonnet 4',
        paragraphs: [
          'Sonnet 4 was the first model in the 4.x family that we were comfortable putting in front of customer-facing workflows. 4.5 takes the same recipe and tightens it: better tool-use planning, lower refusal rate on benign prompts, and a noticeable jump on long-context recall. Anthropic ships these as point releases, but the delta from 4 to 4.5 is closer to what other labs would call a major version.',
          'The most visible change is in coding. On our internal pass-rate evals (200 real engineering tickets across Next.js, Python, and Go), 4.5 ships a working first answer on 78% of tickets versus 64% for 4.0 and 71% for GPT-5. The gap on multi-file refactors is even larger.',
        ],
      },
      {
        heading: 'How it handles real work',
        bullets: [
          'Coding: solves multi-file refactors that previous frontier models stalled on. Handles "rewrite this React 18 hook into a Next.js 15 server action" cleanly.',
          'Research: citations are accurate and the model now declines to invent sources when none are in context. A quiet but huge reliability win.',
          'Writing: drafts long-form content that reads like a first pass by a competent writer, not a press release. Loses some sparkle when you over-constrain the prompt.',
          'Extraction: structured-data extraction with JSON schema is now boringly reliable. We replaced a tuned GPT-4o pipeline with Sonnet 4.5 and saw fewer schema violations.',
        ],
      },
      {
        heading: 'Where it still misses',
        paragraphs: [
          'Long agentic loops are the remaining frontier. Past 20 sequential tool calls, the model occasionally repeats steps or forgets earlier decisions. Adding a "decision log" tool that it appends to between calls almost entirely fixes this — but you have to remember to add it.',
          'Voice mode is not in the same league as GPT-5\'s. Latency, interruption handling, and prosody all trail. If your product needs voice-first AI, this is not the model for you in May 2026.',
          'Image generation is still routed to a partner model rather than being native. The Artifacts experience smooths it over, but the output quality lags Midjourney v7 and the GPT-5 image model badly.',
        ],
      },
    ],
    pricing: [
      {
        tier: 'Pro',
        price: '$20 / month',
        blurb:
          'Individual plan. Sonnet 4.5 + limited Opus 4.7 access. The default starting point for most readers.',
      },
      {
        tier: 'Max',
        price: '$100–$200 / month',
        blurb:
          'Power-user plan with 5–20× the message quota. Worth it the moment you spend 3+ hours/day in Claude.',
      },
      {
        tier: 'API',
        price: '$3 in / $15 out per 1M tokens',
        blurb:
          'Pay-as-you-go for builders. Prompt caching cuts effective cost by 40–60% on real workloads.',
      },
    ],
    alternatives: [
      {
        name: 'GPT-5 (OpenAI)',
        blurb:
          'Closer on reasoning than any prior OpenAI model. Pick GPT-5 if voice or image generation matters more than coding.',
      },
      {
        name: 'Gemini 2.5 Pro (Google)',
        blurb:
          'Strongest at very-long-context (>500k tokens) and multimodal video understanding. Trails on tool use.',
      },
      {
        name: 'Opus 4.7 (Anthropic)',
        blurb:
          'Same family, two tiers up. Use Opus only for the hardest reasoning — for daily work, Sonnet 4.5 is the better trade-off.',
      },
    ],
    bottomLine:
      'Sonnet 4.5 is the model we have set as the default in every internal tool at Internet Keeda. It is not a step change in capability — it is a step change in trust. When the first answer is right four times out of five, the workflow stops being "ask, edit, regenerate" and starts being "ask, ship." That is the bar a frontier model has to clear to be worth a subscription, and 4.5 clears it.',
  },
  {
    slug: 'sample-chatgpt-gpt-5-review',
    toolName: 'ChatGPT',
    toolDomain: 'openai.com',
    category: 'Chat models',
    title:
      'ChatGPT (GPT-5) — the universal entry point, still the most polished',
    verdict:
      'The smoothest end-user experience in AI. Reasoning has caught up to Claude; voice and image still set the bar.',
    rating: 4.7,
    subscores: [
      { label: 'Reasoning', value: 4.7 },
      { label: 'Voice', value: 5.0 },
      { label: 'Image', value: 4.8 },
      { label: 'Ecosystem', value: 4.9 },
      { label: 'Value', value: 4.8 },
    ],
    reviewedOn: '2026-05-28T08:00:00.000Z',
    testedFor: '21 days across Plus, Team, and the API',
    reviewer: EDITORIAL_REVIEWER,
    excerpt:
      'GPT-5 narrows the gap on reasoning that Claude opened in 4.5, while keeping the smoothest end-user UX of any frontier chat product. Voice mode is uncanny, Custom GPTs are mature, the canvas finally feels production-ready. The $20/mo plan remains the easiest defensible upgrade in AI.',
    tldr: [
      'GPT-5 closes most of the reasoning gap Claude opened in Sonnet 4.5.',
      'Voice mode is the single best AI experience shipping right now — full stop.',
      'Custom GPTs, canvas, and memory now feel like a coherent product, not bolt-ons.',
      'Per-token API pricing is the most aggressive of any frontier lab at the same quality.',
      '$20/mo Plus tier remains the highest-ROI subscription in tech.',
    ],
    pros: [
      'Voice mode latency under 300ms makes it feel like a phone call, not a chat.',
      'Native image generation is now sharp enough to use for production marketing assets.',
      'Memory across conversations is opt-in, transparent, and finally useful.',
      'Custom GPTs are a real platform — third-party GPTs are now genuinely indispensable.',
      'API pricing of $1.50 in / $10 out per 1M tokens undercuts every peer at this tier.',
    ],
    cons: [
      'Reasoning trails Claude Sonnet 4.5 on long multi-file coding tasks.',
      'Quality is noticeably inconsistent — same prompt, different days, different depth.',
      'Canvas still has rough edges around versioning and resetting state.',
      'Free tier is heavily downgraded; the gap between free and Plus is large.',
    ],
    bestFor: [
      'Anyone new to AI — this is still the default recommendation',
      'Voice-first interfaces and customer support',
      'Marketing, social, and design teams that need image generation in the loop',
    ],
    notFor: [
      'Heavy multi-file engineering work (Claude or Cursor are better fits)',
      'Long-context document analysis above 200k tokens (Gemini wins here)',
      'Teams with strict EU data residency needs without an enterprise contract',
    ],
    sections: [
      {
        heading: 'The polish gap',
        paragraphs: [
          'Reasoning benchmarks tell one story, but day-to-day product polish tells another. GPT-5 keeps OpenAI\'s lead in every dimension except raw reasoning: latency, voice, image, multimodality, third-party integrations, mobile apps, and onboarding for non-technical users. None of those make it onto a benchmark — but all of them decide whether people stay subscribed.',
          'For non-technical users, GPT-5 is still the right default. The new "Smart" mode auto-routes between the fast and reasoning variants without you having to think about it, which is a small but meaningful UX win compared to Claude\'s explicit model picker.',
        ],
      },
      {
        heading: 'Voice mode is the killer feature',
        paragraphs: [
          'After three weeks of using Voice mode daily, it has replaced 80% of our short-form AI use. Latency is under 300ms, interruption handling is natural, and the model can hold three- to five-minute conversations without losing the thread. We have used it for brainstorming sessions, code rubber-ducking, and as a tutor for a new framework — and in all three contexts, it is meaningfully better than typing.',
          'No other voice product is close. Anthropic does not ship native voice. Google\'s Gemini Live is real but lower quality. ElevenLabs is the only platform with comparable voice fidelity, and they do not own a frontier model. If voice is your product, this is the only realistic choice.',
        ],
      },
      {
        heading: 'Where coding sits in May 2026',
        bullets: [
          'Single-file code: GPT-5 and Claude Sonnet 4.5 are roughly tied.',
          'Multi-file refactors: Claude wins by a meaningful margin.',
          'Code review and explanation: GPT-5 is more pedagogical; Claude is more concise.',
          'IDE integrations: Cursor and Cline both let you swap between models — use both.',
        ],
      },
    ],
    pricing: [
      {
        tier: 'Free',
        price: '$0',
        blurb:
          'Limited GPT-5 access; falls back to a smaller model under load. Fine for casual use.',
      },
      {
        tier: 'Plus',
        price: '$20 / month',
        blurb:
          'The default tier. Full GPT-5, Voice, Image, and memory. Highest-ROI subscription in tech.',
      },
      {
        tier: 'Pro',
        price: '$200 / month',
        blurb:
          'Higher quotas, longer-context reasoning, priority routing. Worth it for power users only.',
      },
      {
        tier: 'API',
        price: '$1.50 in / $10 out per 1M tokens',
        blurb:
          'Aggressively priced at the frontier tier. Batch pricing is half that.',
      },
    ],
    alternatives: [
      {
        name: 'Claude (Anthropic)',
        blurb:
          'Pick Claude if engineering is your primary use case. Pick ChatGPT if you need voice, image, or a non-technical team to use it.',
      },
      {
        name: 'Gemini 2.5 Pro (Google)',
        blurb:
          'Best long-context model on the market. Excellent for very-large-document workflows.',
      },
      {
        name: 'Perplexity Pro',
        blurb:
          'Pick Perplexity if your AI needs to be search-first with citations rather than chat-first.',
      },
    ],
    bottomLine:
      'GPT-5 is the most well-rounded frontier product in 2026. It is no longer the best at any single thing — Claude beats it on reasoning, Gemini on long context, Perplexity on search — but it is in the top two on every dimension that matters to a real user. For the price, that is still the strongest argument in AI. If you can only afford one AI subscription, this is the one to buy.',
  },
  {
    slug: 'sample-cursor-review',
    toolName: 'Cursor',
    toolDomain: 'cursor.com',
    category: 'AI coding',
    title:
      'Cursor — the AI IDE that finally feels like a teammate, not autocomplete',
    verdict:
      'The first AI IDE that genuinely changes how you code. Not perfect, but the workflow is irreversible.',
    rating: 4.6,
    subscores: [
      { label: 'Completions', value: 4.9 },
      { label: 'Agent / Composer', value: 4.6 },
      { label: 'Speed', value: 4.7 },
      { label: 'Stability', value: 4.2 },
      { label: 'Value', value: 4.3 },
    ],
    reviewedOn: '2026-05-25T08:00:00.000Z',
    testedFor: '30 days shipping a production Next.js + Convex app',
    reviewer: EDITORIAL_REVIEWER,
    excerpt:
      'After 30 days of shipping a production Next.js app inside Cursor, the verdict: Composer + Cmd-K + agents form a workflow you cannot get back to vanilla VS Code from. The Tab completions are eerily good. Still hiccups on >5-file refactors and the pricing tier above $20/mo is hard to justify for solo devs.',
    tldr: [
      'Tab completions read intent across the file — meaningfully better than Copilot.',
      'Composer (multi-file edits) is the killer feature. Cmd-K is a close second.',
      'Background agents now ship correct PRs for well-scoped tickets ~60% of the time.',
      'Stability dips noticeably on refactors that touch more than 5 files at once.',
      '$20/mo is a fair price. The $40/mo tier is hard to justify unless you ship daily.',
    ],
    pros: [
      'Tab completions intuit the next 5–10 lines from surrounding context with surprising accuracy.',
      'Composer lets you edit 3–5 files coherently in a single prompt — no other IDE does this well.',
      'Cmd-K for inline edits is the fastest way to refactor a function in any editor, period.',
      'Model picker lets you route between Claude Sonnet 4.5, GPT-5, and Cursor\'s own small model.',
      'Forks VS Code, so every extension you already use still works.',
    ],
    cons: [
      'On 5+ file refactors, the agent occasionally loses track and ships partial changes.',
      'The Pro+ tier ($40/mo) is hard to justify for solo devs; quotas burn fast.',
      'Sync between Cursor and VS Code settings is still flaky on Windows.',
      'Privacy mode disables some agent features — the trade-off is not made obvious.',
    ],
    bestFor: [
      'Working engineers shipping production code with AI-in-the-loop',
      'Frontend and full-stack devs in TypeScript / React / Next.js',
      'Anyone who switches between Claude and GPT-5 and wants both in one IDE',
    ],
    notFor: [
      'Strictly hobbyist coding — the free tier is too thin to learn on',
      'Languages where the agent has weak training signal (Elixir, Crystal, Nim)',
      'Teams with strict on-prem code requirements without an enterprise tier',
    ],
    sections: [
      {
        heading: 'The three features that earn the price',
        bullets: [
          'Tab completions: predict the next block of code, not just the next token. Acceptance rate north of 40% on our codebase.',
          'Cmd-K inline edit: select a function, describe the change, get a diff. The fastest refactor primitive in any IDE.',
          'Composer: multi-file edit with a chat history that survives between sessions. This is the feature that makes Cursor irreversible.',
        ],
      },
      {
        heading: 'Why it beats Copilot',
        paragraphs: [
          'GitHub Copilot is still the most-deployed AI coding tool in the world, and it has been steadily improving. But Cursor leapfrogs it in two places that matter: model choice and multi-file editing. Copilot is locked to OpenAI-family models. Cursor lets you switch between Claude Sonnet 4.5, GPT-5, and a fast in-house model on the same keystroke — which means you can route reasoning-heavy refactors to Claude and routine completion to the fast model.',
          'The multi-file editing gap is starker. Copilot Workspaces ships, but it does not feel native to the IDE the way Composer does. After 30 days, the muscle memory of "highlight, Cmd-K, describe" is what makes the tool feel like a teammate rather than a faster keyboard.',
        ],
      },
      {
        heading: 'The agent: not ready to ship unsupervised, ready to draft',
        paragraphs: [
          'Cursor\'s background agent (the one that takes a ticket and produces a PR) is the feature with the most upside and the most variance. On well-scoped tickets — "add a sort-by-date toggle to this list view, make sure tests still pass" — it produces a correct, mergeable PR roughly 60% of the time. On larger or ambiguous tickets, it confidently produces something that compiles but is wrong, which is worse than failing loudly.',
          'Our recommendation: use the agent for parallel drafts on small tickets. Pair it with Composer for the actual finish work. The agent saves time when it is right and rarely wastes more than 10 minutes when it is wrong.',
        ],
      },
    ],
    pricing: [
      {
        tier: 'Free',
        price: '$0',
        blurb:
          '2,000 completions + 50 slow premium requests / month. Enough to try, not enough to commit.',
      },
      {
        tier: 'Pro',
        price: '$20 / month',
        blurb:
          'The sweet spot. 500 fast premium requests + unlimited slow. Right for almost every solo dev.',
      },
      {
        tier: 'Pro+ / Business',
        price: '$40+ / month',
        blurb:
          'Bigger quotas and team admin. Only worth it if you ship multiple PRs / day or run a team.',
      },
    ],
    alternatives: [
      {
        name: 'GitHub Copilot',
        blurb:
          'Cheaper, more entrenched, weaker on multi-file editing. The right pick if your org is GitHub-first.',
      },
      {
        name: 'Cline (VS Code extension)',
        blurb:
          'Open-source agent that runs in vanilla VS Code. Pick this if you cannot leave VS Code or you want the bring-your-own-key billing model.',
      },
      {
        name: 'Zed',
        blurb:
          'The performance-first editor with built-in AI. Beautiful, fast, and less mature on the AI side than Cursor.',
      },
    ],
    bottomLine:
      'Cursor is the first AI coding tool that has changed how we structure our actual day. Composer for the chunky changes, Cmd-K for the surgical ones, Tab for the rest. After 30 days, opening a vanilla VS Code window feels like coding with one hand tied behind your back. That is the bar a developer tool has to clear — and Cursor clears it.',
  },
  {
    slug: 'sample-midjourney-v7-review',
    toolName: 'Midjourney',
    toolDomain: 'midjourney.com',
    category: 'Image generation',
    title:
      'Midjourney v7 — character consistency that finally holds across a project',
    verdict:
      'The first MJ release where you can ship a multi-panel project without re-rolling for hours. Still the highest-quality output in the field.',
    rating: 4.5,
    subscores: [
      { label: 'Aesthetic quality', value: 5.0 },
      { label: 'Consistency', value: 4.5 },
      { label: 'Prompt control', value: 4.2 },
      { label: 'Text rendering', value: 3.4 },
      { label: 'Value', value: 4.4 },
    ],
    reviewedOn: '2026-05-22T08:00:00.000Z',
    testedFor: '10 days, ~600 generations, two real client projects',
    reviewer: EDITORIAL_REVIEWER,
    excerpt:
      'v7 is the first release where keeping a character recognizable across panels, aspect ratios, and lighting changes Just Works. Style references compose cleanly. The web app caught up to Discord. Where v7 still trails: photorealistic hands, text rendering above 8 characters, and any prompt over 60 words.',
    tldr: [
      'Character reference (--cref) holds identity across panels and aspect ratios.',
      'Style reference (--sref) finally composes cleanly with character ref.',
      'The web app is now the primary surface — Discord is no longer required.',
      'Text rendering inside images still breaks above ~8 characters.',
      'Pricing is unchanged. Still expensive but defensible if you ship visual work.',
    ],
    pros: [
      'Aesthetic quality is unmatched — no other model produces output this striking by default.',
      'Character consistency with --cref is reliably good across 10+ panels in our tests.',
      'Style reference + character reference compose without one cannibalizing the other.',
      'Web UI now has gallery, folders, history, and a real prompt editor.',
      'New "Moodboards" feature is the first MJ workflow built for actual creative direction.',
    ],
    cons: [
      'Long prompts (60+ words) get visibly truncated in output.',
      'Hands and complex anatomy still fail more often than in OpenAI or Ideogram models.',
      'Text in images is unreliable past about 8 characters and breaks completely past 15.',
      'No native API. If you need automation, you go through a third party.',
      'Content policy is more restrictive than peers — sometimes surprisingly so.',
    ],
    bestFor: [
      'Designers and art directors generating concept art and mood boards',
      'Indie creators building visual IP that needs to feel hand-crafted, not generic',
      'Marketing teams needing high-end imagery without commissioning a photoshoot',
    ],
    notFor: [
      'Anyone needing text inside images (posters, packaging, UI mocks — use Ideogram)',
      'Workflows that require an API (no native API exists)',
      'Strict photorealism for product photography (Flux Pro or Imagen do this better)',
    ],
    sections: [
      {
        heading: 'Why v7 matters',
        paragraphs: [
          'Every Midjourney release adds incremental polish. v7 is the first one in two years that meaningfully changes what you can do with the tool. The headline feature — character reference that holds across aspect ratios, lighting, and clothing changes — is the missing piece for using MJ on real projects, where you need the same character on a homepage banner, an instagram square, and a print spread.',
          'We tested this with a 14-panel storyboard for a client project. v7 produced a usable storyboard in roughly 90 minutes. v6 on the same prompt took us 4+ hours of re-rolling, and the final character still drifted between panels. This is the kind of capability gain that moves Midjourney from "nice-to-have inspiration tool" to "actually a production pipeline."',
        ],
      },
      {
        heading: 'The aesthetic gap',
        paragraphs: [
          'Side-by-side with GPT-5\'s image model and Flux Pro, Midjourney still wins on aesthetic out of the box. Lighting reads as more intentional, compositions are more confident, and the default style is closer to "art direction" than "stock photo." When other models match MJ on a specific prompt, they usually do it by leaning heavily on a style preset; MJ gets there with shorter prompts.',
          'Where it loses is precision. If you need the bottle in the image to say "GUAVA SODA" in exactly that typography, you do not pick Midjourney. You pick Ideogram or Recraft. MJ is for the brief, the cover, the mood — not the final asset that needs to read correctly.',
        ],
      },
      {
        heading: 'How to use it well in 2026',
        bullets: [
          'Build a moodboard first. v7\'s moodboards feature genuinely speeds up iteration.',
          'Lock in --cref early. Generate one character you like, then reuse the URL for every downstream image.',
          'Keep prompts under 60 words. Longer prompts visibly degrade output quality.',
          'For typography, send the MJ output to a designer or to a text-renderer like Ideogram for the overlay.',
        ],
      },
    ],
    pricing: [
      {
        tier: 'Basic',
        price: '$10 / month',
        blurb:
          '~200 generations / month. Just enough to evaluate. Not enough for real work.',
      },
      {
        tier: 'Standard',
        price: '$30 / month',
        blurb:
          '15h Fast hours + unlimited Relax. The default for most paying users.',
      },
      {
        tier: 'Pro',
        price: '$60 / month',
        blurb:
          '30h Fast + stealth mode (private generations). Worth it if you generate daily for clients.',
      },
      {
        tier: 'Mega',
        price: '$120 / month',
        blurb:
          '60h Fast + maximum concurrent jobs. Only for studios.',
      },
    ],
    alternatives: [
      {
        name: 'Ideogram',
        blurb:
          'The text-rendering champion. Pick Ideogram if your image must contain readable copy.',
      },
      {
        name: 'Flux Pro (Black Forest Labs)',
        blurb:
          'Open-weight model with a paid hosted tier. Best photorealism and the best choice for API automation.',
      },
      {
        name: 'GPT-5 Image / DALL·E',
        blurb:
          'Best integration with chat workflows. Picks up nuance from a long conversation better than MJ.',
      },
    ],
    bottomLine:
      'Midjourney v7 has not won every battle — text rendering and API access are still real losses — but on the dimension that matters most for working visual creators, character consistency across a project, it is the only model that gets out of your way. If you make visual work for a living, this is still the subscription to keep. If you want one image that says exactly "GUAVA SODA" in italic Helvetica, look elsewhere.',
  },
  {
    slug: 'sample-perplexity-pro-review',
    toolName: 'Perplexity',
    toolDomain: 'perplexity.ai',
    category: 'AI search',
    title:
      'Perplexity Pro — when "search with citations" actually replaces a tab',
    verdict:
      'The first AI-search product that genuinely sits between you and Google. Comet (the browser) is the real reason to pay.',
    rating: 4.4,
    subscores: [
      { label: 'Citation accuracy', value: 4.9 },
      { label: 'Result quality', value: 4.6 },
      { label: 'Comet browser', value: 4.5 },
      { label: 'Breaking news', value: 3.4 },
      { label: 'Value', value: 4.4 },
    ],
    reviewedOn: '2026-05-20T08:00:00.000Z',
    testedFor: '30 days as our primary research surface',
    reviewer: EDITORIAL_REVIEWER,
    excerpt:
      'Perplexity Pro is the first paid AI-search subscription where the math works for daily use. Comet (the browser) ships agent loops that get research done while you watch. Citations are accurate to the source, not hallucinated. Still weak at very recent breaking news (under 6 hours) and structured data queries.',
    tldr: [
      'Citation accuracy is now at the level where you can quote Perplexity directly in research notes.',
      'Comet (the browser) is the first AI-native browser worth using — and the killer feature on Pro.',
      'Spaces (saved research contexts) make follow-up queries 3× faster than ChatGPT.',
      'Weakest on breaking news under 6 hours old; the index lags real-time products.',
      'At $20/mo, the value is real if you research for a living. Otherwise overlaps with ChatGPT Plus.',
    ],
    pros: [
      'Citations are sourced, not invented — clickable, footnoted, and almost never fabricated.',
      'Comet browser runs agent loops in the background ("monitor this site for X").',
      'Spaces lets you keep a research context alive across many sessions — far better than chat history.',
      'Model picker lets you choose Sonnet 4.5, GPT-5, Grok, or the in-house Sonar model.',
      'File and PDF upload flows are smoother than ChatGPT or Claude.',
    ],
    cons: [
      'On breaking news, Perplexity is typically 1–6 hours behind dedicated news products.',
      'Pages (the long-form output feature) is still rough; better used as a starting point than a final doc.',
      'Free tier is heavily restricted; Pro is essentially the product.',
      'Some structured queries ("compare these three SaaS plans") return narrative instead of tables.',
    ],
    bestFor: [
      'Researchers, analysts, and writers who need cite-able answers',
      'Founders and investors doing daily diligence',
      'Anyone who lives in their browser and wants AI baked into navigation',
    ],
    notFor: [
      'Real-time breaking news (use a dedicated news app)',
      'Coding (use Claude, GPT-5, or Cursor)',
      'Anyone happy with ChatGPT\'s built-in browsing — Perplexity\'s edge is depth, not novelty',
    ],
    sections: [
      {
        heading: 'How it replaces a Google tab',
        paragraphs: [
          'The bar for an AI-search product is no longer "do you give a summary." Every chat product does that now. The bar is whether you can stop opening a Google tab to verify the summary. After 30 days as our primary research surface, Perplexity clears that bar more often than not. Citations are clickable, accurate to the source, and only very rarely fabricated — and "rarely" is the operative word. Six months ago this was "occasionally." A year ago it was "regularly."',
          'The thing that pushes Perplexity past ChatGPT for research specifically is Spaces. A Space is a saved research context — a topic, a set of follow-up files, and the full thread of queries you have already run. Asking a follow-up six days later picks up exactly where you left off. ChatGPT\'s memory works for personal preferences; Spaces work for actual projects.',
        ],
      },
      {
        heading: 'Comet is the killer feature',
        paragraphs: [
          'Comet, the Perplexity-native browser, is the part of Pro that makes the subscription defensible. It runs AI in the address bar, so "summarize this page" or "extract every email on this page" is a single keystroke. More importantly, it runs agents in the background: tell it to "monitor reddit /r/cscareerquestions for any thread mentioning Internet Keeda this week" and it will check on a schedule and surface results in a sidebar.',
          'It is not the only AI browser shipping in 2026 — Arc, Dia, and the relaunched Brave all have versions of this — but Comet ships with the most usable agent UI and the deepest integration with Perplexity\'s search. If you spend more than four hours a day in a browser, this alone justifies the $20.',
        ],
      },
      {
        heading: 'Where it loses',
        bullets: [
          'Breaking news: dedicated news products beat Perplexity by 1–6 hours on novel stories.',
          'Tabular comparison: "compare X, Y, Z" still returns narrative more often than tables.',
          'Local results: restaurants, store hours, etc. — Google still wins here.',
          'Long-form writing: Pages is a fine outline tool but not yet a finished doc.',
        ],
      },
    ],
    pricing: [
      {
        tier: 'Free',
        price: '$0',
        blurb:
          '5 Pro searches / day, no Comet. Enough to evaluate, not enough to commit.',
      },
      {
        tier: 'Pro',
        price: '$20 / month',
        blurb:
          'The real product. Unlimited Pro searches, Comet, file uploads, model picker. Default for everyone.',
      },
      {
        tier: 'Enterprise Pro',
        price: '$40+ / seat / month',
        blurb:
          'SSO, admin, data retention controls. Worth it for teams doing diligence at scale.',
      },
    ],
    alternatives: [
      {
        name: 'ChatGPT (with browsing)',
        blurb:
          'If you only need one subscription and you already pay for Plus, ChatGPT\'s search is "good enough" for casual research.',
      },
      {
        name: 'You.com',
        blurb:
          'The other AI search product. Less polished than Perplexity, but cheaper and more customizable.',
      },
      {
        name: 'Kagi',
        blurb:
          'Not AI-first, but the best paid traditional search. Pair it with Claude or ChatGPT for an alternative stack.',
      },
    ],
    bottomLine:
      'Perplexity Pro is a tab replacement, not a chat replacement. If you do research for a living, the $20 pays itself back in the first week from Comet alone. If you mostly chat with AI to brainstorm or draft, you are probably already paying for ChatGPT — and Perplexity will not feel essential. Buy it for the browser, stay for Spaces, and keep ChatGPT or Claude open in another window for everything else.',
  },
  {
    slug: 'sample-elevenlabs-v3-review',
    toolName: 'ElevenLabs',
    toolDomain: 'elevenlabs.io',
    category: 'AI voice',
    title:
      'ElevenLabs v3 — voice cloning that crosses the uncanny threshold',
    verdict:
      'The first voice model casual listeners stop noticing. Production-ready for podcasts, narration, and most agents — watch the per-minute pricing.',
    rating: 4.6,
    subscores: [
      { label: 'Voice fidelity', value: 5.0 },
      { label: 'Conversational AI', value: 4.6 },
      { label: 'API', value: 4.7 },
      { label: 'Multilingual', value: 4.5 },
      { label: 'Value', value: 4.1 },
    ],
    reviewedOn: '2026-05-18T08:00:00.000Z',
    testedFor: '14 days across podcast, narration, and a live IVR pilot',
    reviewer: EDITORIAL_REVIEWER,
    excerpt:
      'v3 is the first model where casual listeners stop noticing the clone. We tested it on podcasts, video narration, and a 200-call IVR — fidelity holds in all three. Conversational AI lets you ship a voice agent in a day. Watch for the per-minute pricing on the Creator plan: it adds up fast under real load.',
    tldr: [
      'Voice cloning at v3 quality fools blind listeners ~85% of the time in our A/B tests.',
      'Conversational AI (CAI) is the first commodity way to ship a real-time voice agent.',
      '32 languages with cross-lingual cloning — your English voice now speaks Hindi in your voice.',
      'API latency is real-time-grade: 250ms first audio chunk in our tests.',
      'Per-minute pricing scales fast under real load — the Creator plan can burn through in days.',
    ],
    pros: [
      'Voice fidelity is the best on the market by a clear margin — peers are not close.',
      'Cross-lingual cloning is the first version that preserves accent and prosody convincingly.',
      'Conversational AI lets you ship a usable voice agent in under a day.',
      'API is mature: streaming, websockets, batch generation all work as advertised.',
      'New "Director" controls let you steer emotion and pacing without re-recording.',
    ],
    cons: [
      'Per-minute pricing on the Creator and Pro plans is hard to predict under variable load.',
      'Voice rights and consent enforcement remains an industry-wide concern, not unique to ElevenLabs.',
      'Long-form (>30 min single take) still occasionally drifts in pacing.',
      'No frontier LLM of their own — Conversational AI relies on plugging in Claude, GPT, or Gemini.',
    ],
    bestFor: [
      'Podcasters, video creators, and audiobook narrators',
      'Customer support voice agents and IVR replacement',
      'Localization teams that need cross-lingual cloning at scale',
    ],
    notFor: [
      'Music or singing voice (use Suno or Udio)',
      'Workflows that need an integrated LLM provider (ElevenLabs is voice-only)',
      'Cost-sensitive bulk TTS without careful quota management',
    ],
    sections: [
      {
        heading: 'Why v3 is the threshold release',
        paragraphs: [
          'For three years, voice clones have been "good enough for a demo, obvious in production." v3 is the first model where, in our blind tests with 30 listeners, the clone was flagged as synthetic only 15% of the time on monologue clips and 22% on conversation clips. That is below the noise floor of human listener accuracy — meaning, in practice, listeners stop noticing.',
          'The thing that flipped is not raw fidelity (which has been close for a year). It is prosody under stress. v3 handles questions, interruptions, and emphatic stress patterns naturally, rather than reading them as flat declaratives. This is what every prior model gave away within seconds.',
        ],
      },
      {
        heading: 'Conversational AI is the platform move',
        paragraphs: [
          'ElevenLabs Conversational AI (CAI) is the bet that voice agents are about to be a category. CAI wraps voice synthesis, turn-taking, interruption handling, and an LLM (you bring your own — Claude, GPT-5, or Gemini) into a single product. We shipped a real customer-support pilot on it in two days: a 200-call IVR replacement that handled tier-one tickets at 70% deflection.',
          'No other voice provider is at this maturity. Cartesia and Play.ht have voice quality close to ElevenLabs, but neither has the full agent stack. OpenAI has the model integration but not the multi-voice production tooling. For now, if you want to ship a real voice agent, this is the only realistic vendor.',
        ],
      },
      {
        heading: 'Watch the bill',
        bullets: [
          'Creator plan ($22/mo) includes ~100k characters. Real podcasts blow through this fast.',
          'Pro plan ($99/mo) is the realistic starting point for any production use.',
          'Conversational AI is billed per minute of agent conversation — model the load carefully.',
          'Volume discounts kick in at Scale ($330/mo) and Business tiers. Negotiate.',
        ],
      },
    ],
    pricing: [
      {
        tier: 'Starter',
        price: '$5 / month',
        blurb:
          '30k characters. Fine for evaluation. Not enough to ship.',
      },
      {
        tier: 'Creator',
        price: '$22 / month',
        blurb:
          '100k characters + voice cloning. Right for solo creators who post weekly.',
      },
      {
        tier: 'Pro',
        price: '$99 / month',
        blurb:
          '500k characters + commercial use. The realistic starting point for production work.',
      },
      {
        tier: 'Scale & Business',
        price: '$330+ / month',
        blurb:
          'Higher quotas + volume API pricing. Most production deployments end up here.',
      },
    ],
    alternatives: [
      {
        name: 'Cartesia (Sonic)',
        blurb:
          'Closest competitor on raw voice quality. Cheaper per-minute pricing. Younger product, less mature tooling.',
      },
      {
        name: 'Play.ht',
        blurb:
          'Cheap, deep voice library, weaker on cloning fidelity. The right pick for high-volume TTS where fidelity is a nice-to-have.',
      },
      {
        name: 'OpenAI Voice (via GPT-5)',
        blurb:
          'Best when your product is already a ChatGPT-style voice assistant. Limited voices, no production cloning workflow.',
      },
    ],
    bottomLine:
      'ElevenLabs v3 is the first AI voice product that fully crosses from "novelty" to "infrastructure." If you make audio for a living, the question is no longer whether to use it — it is how to budget for it. The fidelity is unmatched, the API is mature, and Conversational AI puts a working voice agent in your hands in a day. Just price the per-minute meter carefully before you point production load at it.',
  },
];

export const SAMPLE_REVIEW_SLUGS = SAMPLE_REVIEWS.map((r) => r.slug);

export function getSampleReview(slug: string): SampleReview | undefined {
  return SAMPLE_REVIEWS.find((r) => r.slug === slug);
}
