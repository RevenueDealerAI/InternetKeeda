/**
 * Category audit — proposes merge groups for the 1,380 seeded categories
 * so the user can consolidate to 40–80 canonical names.
 *
 * READ-ONLY. Writes only to scripts/category-audit.json — never to MongoDB.
 *
 * Method (3-pass):
 *   1. Normalize each category name (lowercase, strip "AI [for] X" prefix,
 *      strip "Tools/Software/Apps/etc" suffix, depluralize tokens).
 *   2. Exact-form match against a hand-curated synonym map →
 *      MEDIUM confidence (a "for-sure" merge after eyeballing).
 *   3. Token-overlap match against bucket keywords → LOW confidence
 *      (broad fold-ins like "interior design" → Design Tools).
 *   4. Anything left over groups by normalized form → HIGH confidence
 *      (only case / plural / "AI X" variants share a key).
 *
 * Confidence guide:
 *   - high   = same normalized key — almost certainly safe to merge.
 *   - medium = exact synonym map match — review canonical name.
 *   - low    = keyword overlap — explicitly review members; may need split.
 *
 * Usage:
 *   npm run audit:categories
 */

import { writeFileSync } from 'node:fs';
import path from 'node:path';
import { config as loadEnv } from 'dotenv';
import mongoose from 'mongoose';

loadEnv({ path: '.env.local' });
loadEnv();

import { Category } from '../src/app/api/models/Category';
import { Tool } from '../src/app/api/models/Tool';

// ---------------------------------------------------------------------------
// Canonical buckets — ORDERED most-specific first. Each bucket has:
//   exact:    normalized strings that match this bucket exactly.
//   keywords: token substrings — if any appears in a category's tokens it
//             folds into this bucket at LOW confidence.
//   The first bucket to match in iteration order wins (so put specifics first).
// ---------------------------------------------------------------------------

type Bucket = { canonical: string; exact: string[]; keywords: string[] };

const BUCKETS: Bucket[] = [
  // ---- IMAGE / VIDEO / AUDIO (specific first) ----
  {
    canonical: 'Background Removal',
    exact: ['background remover', 'background removal', 'remove background'],
    keywords: ['background remov', 'remove background'],
  },
  {
    canonical: 'Image Upscaling',
    exact: ['image upscaler', 'upscaler', 'image upscaling', 'photo upscaler', 'upscaling'],
    keywords: ['upscal'],
  },
  {
    canonical: 'Logo & Branding',
    exact: ['logo', 'logo generator', 'logo maker', 'logo design', 'branding', 'brand identity'],
    keywords: ['logo', 'brand'],
  },
  {
    canonical: 'Avatar & Character Generation',
    exact: ['avatar', 'avatar generator', 'character', 'character generator', 'digital human', 'professional avatar'],
    keywords: ['avatar', 'character generat', 'digital human'],
  },
  {
    canonical: 'Face Editing & Swap',
    exact: ['face swap', 'face editing', 'deepfake'],
    keywords: ['face swap', 'face edit', 'deepfake'],
  },
  {
    canonical: 'Image Editing',
    exact: ['image editing', 'photo editing', 'photo editor', 'image editor',
            'image enhancement', 'photo enhancement', 'photo restoration'],
    keywords: ['photo edit', 'image edit', 'photo enhance', 'image enhance', 'photo restor'],
  },
  {
    canonical: 'Image Generation',
    exact: ['image generation', 'image generator', 'text to image', 'art',
            'art generator', 'generative art', 'image creation', 'picture generator',
            'ai art', 'image', 'product image', 'stock image'],
    keywords: ['image generat', 'art generat', 'text to image', 'image creat', 'picture'],
  },
  {
    canonical: 'Video Editing',
    exact: ['video editing', 'video editor'],
    keywords: ['video edit'],
  },
  {
    canonical: 'Video Generation',
    exact: ['video generation', 'video generator', 'text to video',
            'video creation', 'video', 'short video', 'youtube video'],
    keywords: ['video generat', 'text to video', 'video creat', 'short video'],
  },
  {
    canonical: 'Music Generation',
    exact: ['music', 'music generation', 'music generator', 'song generator',
            'songwriting', 'music creation'],
    keywords: ['music', 'song'],
  },
  {
    canonical: 'Voice & Speech',
    exact: ['voice', 'voice cloning', 'voice generator', 'voice changer',
            'text to speech', 'tts', 'speech to text', 'speech recognition',
            'voice recognition', 'speech', 'voice synthesis', 'voice generation'],
    keywords: ['voice', 'speech', 'tts'],
  },
  {
    canonical: 'Audio Generation & Editing',
    exact: ['audio', 'audio generation', 'audio editing', 'audio enhancement',
            'sound generation', 'audio creation', 'audio transcription'],
    keywords: ['audio'],
  },

  // ---- DESIGN / 3D / ANIMATION ----
  {
    canonical: '3D & Modeling',
    exact: ['3d', '3d model', '3d generation', '3d modeling', 'modeling'],
    keywords: ['3d'],
  },
  {
    canonical: 'Animation',
    exact: ['animation', 'animated', 'motion graphics'],
    keywords: ['animat', 'motion graphic'],
  },
  {
    canonical: 'Interior & Architectural Design',
    exact: ['interior design', 'architecture'],
    keywords: ['interior design', 'architect'],
  },
  {
    canonical: 'Design Tools',
    exact: ['design', 'graphic design', 'design tool', 'ui design', 'ux design', 'ui ux'],
    keywords: ['ui design', 'ux design', 'graphic design'],
  },

  // ---- WRITING / CONTENT ----
  {
    canonical: 'Grammar & Proofreading',
    exact: ['grammar', 'proofreading', 'grammar checker', 'spell check', 'paraphrasing'],
    keywords: ['grammar', 'proofread', 'paraphras', 'spell check'],
  },
  {
    canonical: 'Translation & Languages',
    exact: ['translation', 'translator', 'language translation', 'language',
            'languages', 'language learning'],
    keywords: ['translat', 'language learn'],
  },
  {
    canonical: 'Storytelling & Fiction',
    exact: ["children s story", 'story', 'storytelling', 'fiction', 'novel writing', 'story writing'],
    keywords: ['story', 'fiction', 'novel'],
  },
  {
    canonical: 'Writing & Copywriting',
    exact: ['writing', 'writer', 'copywriting', 'copywriter', 'content writing',
            'writing assistant', 'ai writer', 'article writing', 'blog writing'],
    keywords: ['writing', 'copywrit', 'writer'],
  },
  {
    canonical: 'Summarization & Q&A',
    exact: ['summary', 'summarization', 'meeting summary', 'youtube summary',
            'document q a', 'q a', 'question answer'],
    keywords: ['summar', 'q a', 'question answer'],
  },
  {
    canonical: 'Content Creation',
    exact: ['content creation', 'content generation', 'content generator', 'content'],
    keywords: ['content creat', 'content generat'],
  },

  // ---- PRODUCTIVITY / OFFICE ----
  {
    canonical: 'Note-Taking & Knowledge',
    exact: ['note', 'note taking', 'note-taking', 'knowledge',
            'knowledge management', 'second brain', 'wiki'],
    keywords: ['note tak', 'note-tak', 'knowledge manag', 'second brain'],
  },
  {
    canonical: 'Meetings & Transcription',
    exact: ['meeting', 'meeting assistant', 'transcription',
            'meeting transcription', 'meeting note', 'meeting summary'],
    keywords: ['meeting', 'transcript'],
  },
  {
    canonical: 'Document & PDF',
    exact: ['pdf', 'document', 'document processing', 'pdf editor', 'pdf tool', 'documentation'],
    keywords: ['pdf', 'document'],
  },
  {
    canonical: 'Spreadsheets & Data Entry',
    exact: ['spreadsheet', 'excel', 'google sheet'],
    keywords: ['spreadsheet', 'excel'],
  },
  {
    canonical: 'Presentations',
    exact: ['presentation', 'slide', 'slides', 'powerpoint', 'pitch deck'],
    keywords: ['presentation', 'slide', 'pitch deck', 'powerpoint'],
  },
  {
    canonical: 'Project Management',
    exact: ['project management', 'project manager'],
    keywords: ['project manag'],
  },
  {
    canonical: 'Productivity',
    exact: ['productivity', 'task management', 'task automation', 'todo',
            'to do list', 'time management', 'focus', 'time tracking'],
    keywords: ['productiv', 'task manag', 'time manag', 'time track'],
  },

  // ---- DEV / TECHNICAL ----
  {
    canonical: 'Code & Developer Tools',
    exact: ['code', 'code assistant', 'coding assistant', 'code generation',
            'code completion', 'developer tool', 'developer', 'programming',
            'coding', 'code generator', 'sql query', 'devops'],
    keywords: ['cod', 'developer', 'programming', 'sql', 'devops'],
  },
  {
    canonical: 'No-Code & Automation',
    exact: ['no code', 'low code', 'automation', 'workflow', 'workflow automation'],
    keywords: ['no code', 'low code', 'automation', 'workflow'],
  },
  {
    canonical: 'AI Agents',
    exact: ['agent', 'autonomous agent'],
    keywords: ['ai agent', 'autonomous agent'],
  },
  {
    canonical: 'Prompt Engineering',
    exact: ['prompt', 'prompt engineering', 'prompt generator'],
    keywords: ['prompt'],
  },
  {
    canonical: 'OCR & Text Extraction',
    exact: ['ocr', 'optical character recognition', 'text extraction'],
    keywords: ['ocr', 'text extract'],
  },
  {
    canonical: 'Chrome & Browser Extensions',
    exact: ['chrome extension', 'browser extension', 'extension'],
    keywords: ['chrome extension', 'browser extension'],
  },
  {
    canonical: 'Cybersecurity',
    exact: ['security', 'cybersecurity'],
    keywords: ['cybersecur', 'security'],
  },
  {
    canonical: 'Website Builders',
    exact: ['website building', 'website builder', 'web design'],
    keywords: ['website build', 'web design'],
  },
  {
    canonical: 'AI Content Detection',
    exact: ['ai content detection', 'ai detector', 'plagiarism'],
    keywords: ['content detect', 'ai detect', 'plagiar'],
  },
  {
    canonical: 'Search Engines',
    exact: ['search engine', 'search', 'ai search'],
    keywords: ['search engine', 'ai search'],
  },
  {
    canonical: 'Recommendation Engines',
    exact: ['recommendation', 'recommender'],
    keywords: ['recommend'],
  },

  // ---- AUDIENCE / DOMAINS ----
  {
    canonical: 'AI Chatbots & Assistants',
    exact: ['chatbot', 'chat bot', 'conversational ai', 'assistant',
            'virtual assistant', 'chat assistant', 'chatbots and assistant',
            'ai assistant', 'ai chatbot', 'chat', 'chatting'],
    keywords: ['chatbot', 'chat bot', 'conversational', 'assistant'],
  },
  {
    canonical: 'ChatGPT Variants & Integrations',
    exact: ['chatgpt', 'chatgpt for chrome', 'chatgpt for whatsapp', 'chatgpt for slack'],
    keywords: ['chatgpt'],
  },
  {
    canonical: 'SEO',
    exact: ['seo', 'search engine optimization', 'seo tool', 'seo content'],
    keywords: ['seo'],
  },
  {
    canonical: 'Email & Newsletters',
    exact: ['email', 'email marketing', 'email automation', 'newsletter', 'email writing'],
    keywords: ['email', 'newsletter'],
  },
  {
    canonical: 'Social Media',
    exact: ['social media', 'social media marketing', 'social media management',
            'social', 'social media post'],
    keywords: ['social media'],
  },
  {
    canonical: 'Advertising & Ads',
    exact: ['advertising', 'ad', 'ads', 'ad copy', 'ad creative'],
    keywords: ['advertis', 'ad creative', 'ad copy'],
  },
  {
    canonical: 'Sales & CRM',
    exact: ['sales', 'crm', 'lead generation', 'sales automation', 'lead gen'],
    keywords: ['sales', 'crm', 'lead gen'],
  },
  {
    canonical: 'Customer Support',
    exact: ['customer support', 'customer service', 'helpdesk', 'support', 'customer engagement'],
    keywords: ['customer support', 'customer service', 'helpdesk', 'customer engage'],
  },
  {
    canonical: 'Marketing',
    exact: ['marketing', 'marketing automation', 'digital marketing'],
    keywords: ['marketing'],
  },
  {
    canonical: 'E-commerce',
    exact: ['ecommerce', 'e commerce', 'online store', 'shopify', 'shopping',
            'shopping assistance'],
    keywords: ['ecommerce', 'e-commerce', 'shopify', 'shopping'],
  },

  // ---- CAREER / EDUCATION ----
  {
    canonical: 'Resume & Cover Letters',
    exact: ['resume', 'resume builder', 'cv', 'cover letter'],
    keywords: ['resume', 'cover letter'],
  },
  {
    canonical: 'Career & Job Search',
    exact: ['career', 'job search', 'job application', 'interview',
            'interview preparation', 'interview prep', 'job recruitment'],
    keywords: ['career', 'job search', 'interview', 'job application'],
  },
  {
    canonical: 'Recruiting & HR',
    exact: ['hr', 'human resource', 'recruiting', 'recruitment',
            'hiring', 'talent acquisition'],
    keywords: ['recruit', 'hiring', 'human resource'],
  },
  {
    canonical: 'Education & Learning',
    exact: ['education', 'learning', 'edtech', 'tutoring', 'tutor',
            'studying', 'online learning', 'study', 'quiz', 'flashcard'],
    keywords: ['education', 'tutor', 'edtech', 'studying', 'quiz', 'flashcard', 'learn'],
  },
  {
    canonical: 'Research',
    exact: ['research', 'academic research', 'academic'],
    keywords: ['research', 'academic'],
  },
  {
    canonical: 'Data & Analytics',
    exact: ['data analytic', 'analytic', 'data analysis', 'business intelligence',
            'bi', 'data science', 'data visualization', 'dashboard', 'stock market analysi'],
    keywords: ['analytic', 'data scien', 'business intelligence', 'stock market'],
  },

  // ---- VERTICAL / NICHE ----
  {
    canonical: 'Photography',
    exact: ['photo', 'photography'],
    keywords: ['photography'],
  },
  {
    canonical: 'Game Development & Gaming',
    exact: ['game', 'gaming', 'game development', 'game dev'],
    keywords: ['game', 'gaming'],
  },
  {
    canonical: 'Finance & Investing',
    exact: ['finance', 'fintech', 'investing', 'trading', 'investment',
            'stock', 'crypto', 'cryptocurrency'],
    keywords: ['finance', 'fintech', 'investing', 'trading', 'crypto'],
  },
  {
    canonical: 'Legal',
    exact: ['legal', 'law', 'lawyer', 'legal tech', 'legal advice'],
    keywords: ['legal', 'lawyer'],
  },
  {
    canonical: 'Real Estate',
    exact: ['real estate', 'property', 'realtor'],
    keywords: ['real estate', 'realtor'],
  },
  {
    canonical: 'Healthcare & Wellness',
    exact: ['health', 'healthcare', 'medical', 'fitness', 'wellness',
            'mental health', 'nutrition', 'mental wellness'],
    keywords: ['health', 'medical', 'fitness', 'wellness', 'mental', 'nutrition'],
  },
  {
    canonical: 'Travel',
    exact: ['travel', 'trip planning', 'itinerary', 'travel itineraries'],
    keywords: ['travel', 'itinerar', 'trip plan'],
  },
  {
    canonical: 'Food & Recipes',
    exact: ['food', 'recipe', 'cooking'],
    keywords: ['recipe', 'cooking'],
  },
  {
    canonical: 'Dating & Relationships',
    exact: ['dating', 'relationship'],
    keywords: ['dating', 'relationship'],
  },
  {
    canonical: 'Self-Improvement & Inspiration',
    exact: ['self improvement', 'personal development', 'inspiration',
            'self help', 'meditation'],
    keywords: ['self-improvement', 'self improvement', 'personal develop', 'inspirat', 'meditat', 'self help'],
  },
  {
    canonical: 'Gift Ideas & Lifestyle',
    exact: ['gift', 'gift idea', 'lifestyle'],
    keywords: ['gift', 'lifestyle'],
  },
];

// ---------------------------------------------------------------------------
// Normalization
// ---------------------------------------------------------------------------

const STOPWORDS = new Set(['and', 'or', 'the', 'a', 'an', 'of', 'with', 'in', 'on']);
// Strip "AI"/"Best" prefix WITH optional "for", and strip noisy suffixes.
const PREFIX_NOISE = /^(best|top|the|ai|smart)(?:\s+for)?\s+/i;
const SUFFIX_NOISE = /\s+(tools?|software|apps?|platforms?|services?|solutions?|generators?|generator|ai|app)$/i;

function depluralizeToken(t: string): string {
  if (t.length <= 3) return t;
  // Words that aren't plural even though they end in 's'
  if (/(?:ss|us|is|ics|ous|ess|ness|asis|esis|osis|usus)$/i.test(t)) return t;
  // consonant + "ies" → "y"   (categories → category, cities → city)
  if (/[bcdfghjklmnpqrstvwxz]ies$/i.test(t)) return t.slice(0, -3) + 'y';
  // "(ch|sh|x|z|ss)es" → strip "es"   (boxes → box, dishes → dish, classes → class)
  if (/(?:ches|shes|xes|zes|sses)$/i.test(t)) return t.slice(0, -2);
  // Plain trailing "s" → drop it    (images → image, cars → car)
  if (/[^s]s$/i.test(t)) return t.slice(0, -1);
  return t;
}

function normalize(name: string): string {
  let s = name
    .toLowerCase()
    .replace(/&/g, ' and ')
    .replace(/[^\w\s-]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  // Strip prefix + suffix iteratively
  for (let i = 0; i < 4; i++) {
    const before = s;
    s = s.replace(PREFIX_NOISE, '');
    s = s.replace(SUFFIX_NOISE, '');
    if (s === before) break;
  }

  s = s.split(' ').filter(Boolean).map(depluralizeToken).join(' ');
  return s.trim();
}

function tokens(s: string): Set<string> {
  return new Set(s.split(/\s+/).filter((t) => t && !STOPWORDS.has(t)));
}

// ---------------------------------------------------------------------------
// Bucket-matching indices
// ---------------------------------------------------------------------------

function buildExactIndex(): Map<string, string> {
  const idx = new Map<string, string>();
  for (const b of BUCKETS) {
    idx.set(normalize(b.canonical), b.canonical);
    for (const e of b.exact) {
      const k = normalize(e);
      if (!idx.has(k)) idx.set(k, b.canonical);
    }
  }
  return idx;
}

function matchByKeyword(catTokens: Set<string>, normStr: string): string | null {
  for (const b of BUCKETS) {
    for (const kw of b.keywords) {
      const kwNorm = normalize(kw);
      // Substring match against the FULL normalized string (catches multi-word keywords)
      if (normStr.includes(kwNorm)) return b.canonical;
      // Token-level fallback
      const kwToks = kwNorm.split(/\s+/);
      if (kwToks.every((tok) => catTokens.has(tok))) return b.canonical;
    }
  }
  return null;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

type MemberEntry = { name: string; tools: number };
type Group = {
  canonical_name: string;
  source: 'exact' | 'keyword' | 'normalized';
  members: MemberEntry[];
  total_tools: number;
  confidence: 'high' | 'medium' | 'low';
  is_merge: boolean;
};

async function main() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI not set in .env.local');
    process.exit(1);
  }

  console.log('▶  Connecting to MongoDB…');
  await mongoose.connect(uri);

  console.log('▶  Counting tools per category (live aggregation)…');
  const live = await Tool.aggregate<{ _id: string; count: number }>([
    { $match: { status: { $in: ['published', 'approved'] } } },
    { $group: { _id: '$category', count: { $sum: 1 } } },
  ]);
  const countByName = new Map<string, number>();
  for (const row of live) {
    if (row._id) countByName.set(row._id, row.count);
  }

  console.log('▶  Folding in zero-tool Category docs…');
  const allCats = await Category.find().select('name toolCount').lean();
  for (const c of allCats) {
    if (!countByName.has(c.name)) countByName.set(c.name, c.toolCount || 0);
  }
  console.log(`   ${countByName.size} distinct category names.`);

  const exactIndex = buildExactIndex();
  const groups = new Map<string, Group>();

  for (const [name, count] of countByName.entries()) {
    const norm = normalize(name);
    if (!norm) continue;
    const catTokens = tokens(norm);

    // 1) Exact synonym match
    let bucketCanonical: string | null = exactIndex.get(norm) ?? null;
    let source: Group['source'] = 'exact';

    // 2) Keyword overlap
    if (!bucketCanonical) {
      bucketCanonical = matchByKeyword(catTokens, norm);
      if (bucketCanonical) source = 'keyword';
    }

    // 3) Normalized-form group (catches plurals / "AI X" within unmatched space)
    if (!bucketCanonical) {
      bucketCanonical = `__norm__:${norm}`;
      source = 'normalized';
    }

    if (!groups.has(bucketCanonical)) {
      groups.set(bucketCanonical, {
        canonical_name:
          source === 'normalized'
            ? name // overwritten below to most-popular member
            : bucketCanonical,
        source,
        members: [],
        total_tools: 0,
        confidence: 'high',
        is_merge: false,
      });
    }
    const g = groups.get(bucketCanonical)!;
    g.members.push({ name, tools: count });
    g.total_tools += count;
  }

  const output: Group[] = [];
  for (const g of groups.values()) {
    g.members.sort((a, b) => b.tools - a.tools);
    if (g.source === 'normalized') {
      g.canonical_name = g.members[0].name;
    }
    g.is_merge = g.members.length > 1;
    g.confidence =
      g.source === 'exact' ? 'medium' :
      g.source === 'keyword' ? 'low' :
      'high';
    output.push(g);
  }

  output.sort((a, b) => b.total_tools - a.total_tools);

  const totalSource = countByName.size;
  const totalProposed = output.length;
  const merges = output.filter((g) => g.is_merge).length;
  const totalToolsCovered = output.reduce((s, g) => s + g.total_tools, 0);
  const bySource = {
    exact: output.filter((g) => g.source === 'exact').length,
    keyword: output.filter((g) => g.source === 'keyword').length,
    normalized: output.filter((g) => g.source === 'normalized').length,
  };
  const byConfidence = {
    high: output.filter((g) => g.confidence === 'high').length,
    medium: output.filter((g) => g.confidence === 'medium').length,
    low: output.filter((g) => g.confidence === 'low').length,
  };

  const summary = {
    generated_at: new Date().toISOString(),
    source: {
      categories_in_db: totalSource,
      tools_attributed: totalToolsCovered,
    },
    proposal: {
      final_categories: totalProposed,
      merge_groups: merges,
      singletons: totalProposed - merges,
      target_range: '40–80',
      by_source: bySource,
      by_confidence: byConfidence,
    },
    confidence_guide: {
      high: 'Same normalized key — only case / plural / "AI X" prefix differences. Safe.',
      medium: 'Exact synonym map match — eyeball canonical name only.',
      low: 'Keyword overlap — REVIEW members carefully; may need to split.',
    },
    review_notes: [
      'Each group with is_merge=true is a proposed merge.',
      'Singletons (is_merge=false) need a manual decision: keep separate, or fold into a broader canonical bucket.',
      'Confidence "low" = keyword fold-in. Walk member lists; if any look misplaced, list them under "splits" when responding.',
      'After your review, I will write a follow-up apply-merges.ts script that runs the approved merges as a single transactional pass.',
      'No DB writes have been performed.',
    ],
    groups: output.map((g) => ({
      canonical_name: g.canonical_name,
      confidence: g.confidence,
      source: g.source,
      is_merge: g.is_merge,
      member_count: g.members.length,
      total_tools: g.total_tools,
      members: g.members.map((m) => `${m.name} (${m.tools})`),
    })),
  };

  const outPath = path.resolve(process.cwd(), 'scripts/category-audit.json');
  writeFileSync(outPath, JSON.stringify(summary, null, 2), 'utf8');

  console.log(`✅ Wrote ${outPath}`);
  console.log(`   Source categories:        ${totalSource}`);
  console.log(`   Proposed final:           ${totalProposed}`);
  console.log(`     • Merge groups:         ${merges}`);
  console.log(`     • Singletons:           ${totalProposed - merges}`);
  console.log(`   By source:                exact=${bySource.exact}, keyword=${bySource.keyword}, normalized=${bySource.normalized}`);
  console.log(`   By confidence:            high=${byConfidence.high}, medium=${byConfidence.medium}, low=${byConfidence.low}`);
  console.log(`   Tools attributed:         ${totalToolsCovered}`);

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('❌ Audit failed:', e);
  process.exit(1);
});
