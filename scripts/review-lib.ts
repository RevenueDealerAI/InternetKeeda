/**
 * Shared parsing + validation for content/reviews/*.md.
 * Imported by validate-review.ts and backfill-original-content.ts.
 * Lives in scripts/ (excluded from the app tsc build) and runs via tsx.
 */
import { readFileSync } from 'node:fs';

export interface ReviewFrontmatter {
  slug: string;
  author: string;
  reviewedAt: string;
  pricingCheckedAt: string;
  sources: string[];
}

export interface ParsedReview {
  frontmatter: ReviewFrontmatter;
  /** Body WITHOUT the trailing "## Sources" section — this is what gets
   *  stored + word-counted + rendered. */
  bodyMain: string;
  /** Full body including the Sources section (for reference). */
  bodyFull: string;
}

/** Minimal, format-specific frontmatter parser (no YAML dep). */
export function parseReviewMarkdown(raw: string): ParsedReview {
  const m = raw.match(/^---\s*\n([\s\S]*?)\n---\s*\n?([\s\S]*)$/);
  if (!m) throw new Error('Missing frontmatter block');
  const [, fmRaw, body] = m;

  const fm: any = { sources: [] };
  const lines = fmRaw.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    const kv = line.match(/^([A-Za-z_]+):\s*(.*)$/);
    if (!kv) continue;
    const [, key, val] = kv;
    if (key === 'sources') {
      // Collect following "  - <url>" lines.
      for (let j = i + 1; j < lines.length; j++) {
        const item = lines[j].match(/^\s*-\s+(.*\S)\s*$/);
        if (!item) break;
        fm.sources.push(item[1].trim());
        i = j;
      }
    } else {
      fm[key] = val.trim();
    }
  }

  const bodyMain = body.split(/^##\s+Sources\s*$/m)[0].trim();
  return { frontmatter: fm as ReviewFrontmatter, bodyMain, bodyFull: body.trim() };
}

export function readReview(path: string): ParsedReview {
  return parseReviewMarkdown(readFileSync(path, 'utf8'));
}

export function wordCount(s: string): number {
  return s.trim().split(/\s+/).filter(Boolean).length;
}

const FIRST_PERSON =
  /\b(I|I['’]m|I['’]ve|my|mine|myself|we tested|we tried|we used|in my experience|when I used|hands[- ]on|I tested|I tried|I found|I used|our team tested)\b/;
const PLACEHOLDER = /\b(TODO|FIXME|TBD|PLACEHOLDER|LOREM IPSUM|XXX)\b|\{\{|\}\}/i;
const NUMERIC_PRICING = /\$\s?\d/;

function normalize(s: string): string {
  return s.toLowerCase().replace(/\s+/g, ' ').trim();
}

/**
 * Longest run of consecutive characters (normalized) from `sourceText`
 * that also appears in `bodyText`. Used to catch copying from the DB's
 * scraped description / description_ai.
 */
function plagiarismHit(bodyText: string, sourceText: string, window = 40): string | null {
  const b = normalize(bodyText);
  const s = normalize(sourceText);
  if (s.length < window) return null;
  for (let i = 0; i + window <= s.length; i++) {
    const chunk = s.slice(i, i + window);
    if (b.includes(chunk)) return chunk;
  }
  return null;
}

export interface ValidateInput {
  bodyMain: string;
  sources: string[];
  /** From the Tool doc — the OFF-LIMITS scraped fields, passed ONLY so
   *  we can prove the review did not copy them. */
  description?: string;
  description_ai?: string;
}

/** Returns [] when the review passes; otherwise a list of failure reasons. */
export function validateReview(input: ValidateInput): string[] {
  const errors: string[] = [];
  const words = wordCount(input.bodyMain);
  if (words < 120) errors.push(`body is ${words} words (<120)`);
  if (!Array.isArray(input.sources) || input.sources.length < 3)
    errors.push(`only ${input.sources?.length || 0} source URLs (<3)`);
  if (!NUMERIC_PRICING.test(input.bodyMain))
    errors.push('no numeric pricing fact (expected a $<number>)');
  const fp = input.bodyMain.match(FIRST_PERSON);
  if (fp) errors.push(`first-person phrase: "${fp[0]}"`);
  const ph = input.bodyMain.match(PLACEHOLDER);
  if (ph) errors.push(`placeholder/TODO: "${ph[0]}"`);
  for (const [label, text] of [
    ['description', input.description],
    ['description_ai', input.description_ai],
  ] as const) {
    if (!text) continue;
    const hit = plagiarismHit(input.bodyMain, text);
    if (hit) errors.push(`plagiarism vs ${label}: "${hit}"`);
  }
  return errors;
}
