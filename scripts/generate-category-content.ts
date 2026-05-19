/**
 * AI-generate intro paragraph + meta description for every Category.
 *
 * Model: gpt-4o-mini (cheap, fine for short-form copy)
 * Batch: 20, 1s delay between batches.
 * Idempotent — skips categories that already have BOTH fields populated.
 *
 * Budget hard cap: $5. Logs running spend; aborts if it crosses.
 *
 * Usage:  npm run gen:categories
 */

import { config as loadEnv } from 'dotenv';
import mongoose from 'mongoose';

loadEnv({ path: '.env.local' });
loadEnv();

import { Category } from '../src/app/api/models/Category';
import { Tool } from '../src/app/api/models/Tool';

const MODEL = 'gpt-4o-mini';
const BATCH_SIZE = 20;
const BATCH_DELAY_MS = 1000;
const BUDGET_USD = 5.0;
// gpt-4o-mini pricing (per 1M tokens): input $0.150, output $0.600
const INPUT_COST_PER_TOKEN = 0.150 / 1_000_000;
const OUTPUT_COST_PER_TOKEN = 0.600 / 1_000_000;

interface OpenAIResponse {
  choices?: { message?: { content?: string } }[];
  usage?: { prompt_tokens?: number; completion_tokens?: number };
  error?: { message?: string };
}

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

function buildPrompt(name: string, sampleToolNames: string[]): string {
  const memberList = sampleToolNames.length
    ? sampleToolNames.slice(0, 5).join(', ')
    : '(no specific members listed)';
  return `Write an SEO intro for the AI tools category "${name}" on InternetKeeda, a directory of 5,000+ AI tools.

Output ONLY valid JSON with this exact shape:
{
  "meta_description": "<150-160 char SEO description ending with a call to explore, includes 'AI tools' and the category name>",
  "intro": "<80-100 word paragraph: what this category covers, 2-3 specific use cases, who it's for, no buzzwords like revolutionary/cutting-edge/game-changing>"
}

Members in this category include: ${memberList}`;
}

async function callOpenAI(prompt: string, apiKey: string): Promise<{ data: { meta_description: string; intro: string } | null; promptTokens: number; completionTokens: number; }> {
  const res = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: MODEL,
      messages: [
        { role: 'system', content: 'You are a precise SEO copywriter. Output strict JSON only — no preamble, no explanations.' },
        { role: 'user', content: prompt },
      ],
      response_format: { type: 'json_object' },
      temperature: 0.6,
      max_tokens: 350,
    }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(`OpenAI ${res.status}: ${text.slice(0, 200)}`);
  }

  const json = (await res.json()) as OpenAIResponse;
  if (json.error) throw new Error(json.error.message || 'OpenAI error');
  const content = json.choices?.[0]?.message?.content || '';
  const promptTokens = json.usage?.prompt_tokens ?? 0;
  const completionTokens = json.usage?.completion_tokens ?? 0;

  try {
    const parsed = JSON.parse(content);
    if (typeof parsed.meta_description !== 'string' || typeof parsed.intro !== 'string') {
      return { data: null, promptTokens, completionTokens };
    }
    return {
      data: {
        meta_description: parsed.meta_description.slice(0, 200),
        intro: parsed.intro.trim(),
      },
      promptTokens,
      completionTokens,
    };
  } catch {
    return { data: null, promptTokens, completionTokens };
  }
}

async function main() {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    console.error('❌ OPENAI_API_KEY missing in .env.local');
    process.exit(1);
  }
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error('❌ MONGODB_URI missing in .env.local');
    process.exit(1);
  }

  console.log('▶  Connecting to MongoDB…');
  await mongoose.connect(uri);

  // Pull only categories that don't have both fields yet (idempotent)
  const pending = await Category.find({
    $or: [
      { meta_description: { $in: [null, ''] } },
      { intro: { $in: [null, ''] } },
      { meta_description: { $exists: false } },
      { intro: { $exists: false } },
    ],
  })
    .select('name slug')
    .sort({ toolCount: -1 })
    .lean();

  console.log(`▶  ${pending.length} categories need content generation.`);
  if (pending.length === 0) {
    console.log('✅ All categories already populated. Exiting.');
    await mongoose.disconnect();
    return;
  }

  let totalCost = 0;
  let totalPromptTokens = 0;
  let totalCompletionTokens = 0;
  let ok = 0;
  let failed = 0;
  const failures: { name: string; reason: string }[] = [];

  for (let i = 0; i < pending.length; i += BATCH_SIZE) {
    const batch = pending.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    const totalBatches = Math.ceil(pending.length / BATCH_SIZE);

    const results = await Promise.all(
      batch.map(async (cat) => {
        try {
          // Sample 5 tool names for context
          const sampleTools = await Tool.find({ category: cat.name })
            .select('name')
            .limit(5)
            .lean();
          const sampleNames = sampleTools.map((t) => t.name);

          const prompt = buildPrompt(cat.name, sampleNames);
          const { data, promptTokens, completionTokens } = await callOpenAI(prompt, apiKey);
          totalPromptTokens += promptTokens;
          totalCompletionTokens += completionTokens;

          if (!data) {
            return { cat, ok: false, reason: 'malformed JSON response' };
          }

          await Category.updateOne(
            { _id: cat._id },
            { $set: { meta_description: data.meta_description, intro: data.intro } },
          );
          return { cat, ok: true };
        } catch (err) {
          const msg = err instanceof Error ? err.message : String(err);
          return { cat, ok: false, reason: msg.slice(0, 120) };
        }
      }),
    );

    for (const r of results) {
      if (r.ok) ok++;
      else {
        failed++;
        failures.push({ name: r.cat.name, reason: r.reason || 'unknown' });
      }
    }

    totalCost =
      totalPromptTokens * INPUT_COST_PER_TOKEN +
      totalCompletionTokens * OUTPUT_COST_PER_TOKEN;

    console.log(
      `   batch ${batchNum}/${totalBatches}  ` +
        `done=${ok}  failed=${failed}  ` +
        `tokens=${totalPromptTokens + totalCompletionTokens}  ` +
        `cost=$${totalCost.toFixed(4)}`,
    );

    if (totalCost > BUDGET_USD) {
      console.warn(`⚠️  Budget cap $${BUDGET_USD} crossed at $${totalCost.toFixed(4)}. Stopping.`);
      break;
    }

    if (i + BATCH_SIZE < pending.length) {
      await sleep(BATCH_DELAY_MS);
    }
  }

  console.log('\n──────────── SUMMARY ────────────');
  console.log(`  Categories processed: ${ok + failed}`);
  console.log(`    successful:         ${ok}`);
  console.log(`    failed:             ${failed}`);
  console.log(`  Tokens — prompt:      ${totalPromptTokens.toLocaleString()}`);
  console.log(`         — completion:  ${totalCompletionTokens.toLocaleString()}`);
  console.log(`  Total cost (USD):     $${totalCost.toFixed(4)}`);
  if (failures.length > 0) {
    console.log('  First 5 failures:');
    failures.slice(0, 5).forEach((f) => console.log(`    - ${f.name}: ${f.reason}`));
  }

  await mongoose.disconnect();
}

main().catch((e) => {
  console.error('❌ Script failed:', e);
  process.exit(1);
});
