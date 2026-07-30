import Link from 'next/link';
import {
  outboundRel,
  isAffiliateSlug,
  AFFILIATE_DISCLOSURE,
} from '@/lib/affiliate/links';

/**
 * Server-rendered ORIGINAL review. This is the indexable content for a
 * reviewed tool — it ships in the initial HTML in place of the scraped
 * description, carries a visible byline + "Pricing checked" date + the
 * sources list + affiliate disclosure, and links to /how-we-review.
 *
 * Rules of the content itself (enforced by scripts/validate-review.ts):
 * original desk research, no first-person claims, primary sources only.
 */

export interface ReviewData {
  author: string;
  reviewedAt: string | Date;
  pricingCheckedAt: string | Date;
  /** When set, replaces "Pricing checked <date>" — used when pricing
   *  came from a dated source other than the live pricing page. */
  pricingNote?: string;
  sources: string[];
  body: string;
}

const MONTHS = [
  'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
  'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

function fmtDate(d: string | Date): string {
  const date = d instanceof Date ? d : new Date(d);
  if (Number.isNaN(date.getTime())) return String(d);
  // UTC + fixed month names → deterministic, locale-independent output.
  return `${MONTHS[date.getUTCMonth()]} ${date.getUTCDate()}, ${date.getUTCFullYear()}`;
}

/** Render the controlled markdown body (## headings, paragraphs, and
 *  "- " lists — no raw HTML) into elements. */
function renderBody(body: string): React.ReactNode[] {
  const out: React.ReactNode[] = [];
  const lines = body.split(/\r?\n/);
  let list: string[] = [];
  const flushList = (key: number) => {
    if (!list.length) return;
    out.push(
      <ul key={`ul-${key}`} className="my-3 list-disc pl-5 text-[15px] leading-[1.7]" style={{ color: 'var(--ink-2)' }}>
        {list.map((li, i) => (
          <li key={i}>{li}</li>
        ))}
      </ul>,
    );
    list = [];
  };
  lines.forEach((raw, i) => {
    const line = raw.trim();
    if (!line) {
      flushList(i);
      return;
    }
    if (line.startsWith('## ')) {
      flushList(i);
      out.push(
        <h2
          key={i}
          className="mt-7 mb-2 text-[19px] font-semibold"
          style={{ color: 'var(--ink)', letterSpacing: '-0.01em', fontFamily: 'var(--sans)' }}
        >
          {line.slice(3).trim()}
        </h2>,
      );
      return;
    }
    if (line.startsWith('- ')) {
      list.push(line.slice(2).trim());
      return;
    }
    flushList(i);
    out.push(
      <p key={i} className="my-2 text-[15px] leading-[1.7]" style={{ color: 'var(--ink-2)' }}>
        {line}
      </p>,
    );
  });
  flushList(lines.length);
  return out;
}

export function ReviewSSR({
  tool,
  review,
}: {
  tool: { name: string; slug: string; websiteUrl?: string };
  review: ReviewData;
}) {
  return (
    <article className="mx-auto w-full max-w-[760px] px-7 py-10">
      <div
        className="text-[10px] uppercase tracking-[0.24em] mb-3"
        style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
      >
        § Review
      </div>
      <h1
        className="m-0 text-[32px] leading-[1.1] font-medium"
        style={{ color: 'var(--ink)', letterSpacing: '-0.03em', fontFamily: 'var(--sans)' }}
      >
        {tool.name} review
      </h1>

      {/* Byline + pricing-checked date */}
      <div
        className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 text-[13px]"
        style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
      >
        <span>By {review.author}</span>
        <span aria-hidden="true">·</span>
        <span>Reviewed {fmtDate(review.reviewedAt)}</span>
        <span aria-hidden="true">·</span>
        <span>{review.pricingNote || `Pricing checked ${fmtDate(review.pricingCheckedAt)}`}</span>
        <span aria-hidden="true">·</span>
        <Link href="/how-we-review" style={{ color: 'var(--accent)' }}>
          How we review
        </Link>
      </div>

      <div className="mt-6">{renderBody(review.body)}</div>

      {tool.websiteUrl && (
        <p className="mt-8">
          <a
            href={tool.websiteUrl}
            target="_blank"
            rel={outboundRel(tool.slug)}
            className="inline-flex items-center gap-2 rounded-lg px-5 py-3 text-sm font-medium"
            style={{ background: 'var(--accent)', color: 'var(--on-accent)' }}
          >
            Visit {tool.name} →
          </a>
        </p>
      )}

      {isAffiliateSlug(tool.slug) && (
        <p className="mt-3 text-xs leading-relaxed" style={{ color: 'var(--ink-soft)' }}>
          {AFFILIATE_DISCLOSURE}
        </p>
      )}

      {review.sources.length > 0 && (
        <section className="mt-8">
          <h2
            className="mb-2 text-[13px] uppercase tracking-[0.16em]"
            style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
          >
            Sources
          </h2>
          <ul className="list-none p-0 text-[13px] leading-[1.7]" style={{ color: 'var(--ink-soft)' }}>
            {review.sources.map((s) => (
              <li key={s} className="truncate">
                <a href={s} target="_blank" rel="nofollow noopener noreferrer" style={{ color: 'var(--ink-2)' }}>
                  {s}
                </a>
              </li>
            ))}
          </ul>
          <p className="mt-3 text-xs" style={{ color: 'var(--ink-soft)' }}>
            {review.pricingNote
              ? `${review.pricingNote}. `
              : `Pricing and limits are from vendor documentation, verified on ${fmtDate(
                  review.pricingCheckedAt,
                )}. `}
            This is desk research, not an independent lab test — see{' '}
            <Link href="/how-we-review" style={{ color: 'var(--accent)' }}>
              how we review
            </Link>
            .
          </p>
        </section>
      )}
    </article>
  );
}
