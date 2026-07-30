import type { Metadata } from 'next';
import Link from 'next/link';
import { BRAND } from '@/lib/brand';
import { AFFILIATE_DISCLOSURE } from '@/lib/affiliate/links';

export const metadata: Metadata = {
  title: `How we review — ${BRAND.name}`,
  description:
    'Our review methodology: desk research from vendor documentation and pricing pages, pricing verified on a stated date, tools not independently lab-tested, affiliate relationships disclosed.',
  alternates: { canonical: '/how-we-review' },
  openGraph: { url: '/how-we-review', title: `How we review — ${BRAND.name}`, type: 'article' },
  robots: { index: true, follow: true },
};

const P = { color: 'var(--ink-2)' } as const;

export default function HowWeReviewPage() {
  return (
    <main style={{ background: 'var(--bg)', color: 'var(--ink)' }}>
      <article className="mx-auto w-full max-w-[760px] px-7 py-14">
        <div
          className="text-[10px] uppercase tracking-[0.24em] mb-3"
          style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
        >
          § Methodology
        </div>
        <h1
          className="m-0 text-[36px] leading-[1.1] font-medium"
          style={{ color: 'var(--ink)', letterSpacing: '-0.03em', fontFamily: 'var(--sans)' }}
        >
          How we review
        </h1>

        <p className="mt-6 text-[16px] leading-[1.7]" style={P}>
          Our tool reviews are written by {BRAND.name} Editorial. They are
          <strong> desk research</strong>, not hands-on lab tests. We do not
          claim to have independently run or benchmarked every product, and you
          will not find first-person &quot;we tested it&quot; anecdotes in our
          reviews, because that would not be true.
        </p>

        <h2 className="mt-8 text-[19px] font-semibold" style={{ color: 'var(--ink)' }}>
          Where the facts come from
        </h2>
        <p className="mt-2 text-[16px] leading-[1.7]" style={P}>
          Pricing, limits, and capabilities are taken from primary sources — the
          vendor&apos;s own pricing pages, documentation, and changelogs, plus
          official model cards or technical reports where relevant. Every review
          lists the source URLs it draws from. Anything we could not confirm from
          a primary source is left out rather than guessed.
        </p>

        <h2 className="mt-8 text-[19px] font-semibold" style={{ color: 'var(--ink)' }}>
          Pricing is a snapshot
        </h2>
        <p className="mt-2 text-[16px] leading-[1.7]" style={P}>
          Prices change often and vary by region, term length, and promotions.
          Each review shows the date its pricing was checked (&quot;Pricing
          checked&quot;). Treat figures as accurate as of that date and confirm
          the current price on the vendor&apos;s site before buying.
        </p>

        <h2 className="mt-8 text-[19px] font-semibold" style={{ color: 'var(--ink)' }}>
          No star ratings
        </h2>
        <p className="mt-2 text-[16px] leading-[1.7]" style={P}>
          We do not publish numeric or star scores. Our &quot;good fit / poor
          fit&quot; sections are analysis derived from the documented limits, so
          you can judge suitability for your own use case.
        </p>

        <h2 className="mt-8 text-[19px] font-semibold" style={{ color: 'var(--ink)' }}>
          Affiliate disclosure
        </h2>
        <p className="mt-2 text-[16px] leading-[1.7]" style={P}>
          Some outbound links to the tools we cover are affiliate links, marked
          with a disclosure on the page. {AFFILIATE_DISCLOSURE} Affiliate
          relationships do not change what a review says — pricing and limits are
          reported from the vendor&apos;s documentation either way.
        </p>

        <p className="mt-10 text-[14px]" style={{ color: 'var(--ink-soft)' }}>
          <Link href="/categories" style={{ color: 'var(--accent)' }}>
            Browse tool categories →
          </Link>
        </p>
      </article>
    </main>
  );
}
