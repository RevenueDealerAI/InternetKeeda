'use client';

import { LegalPage } from '@/components/nexus/LegalPage';
import { LegalEntityBlock } from '@/components/nexus/LegalEntityBlock';
import { BRAND } from '@/lib/brand';

const LAST_UPDATED = '2026-05-30';

// Values mirror src/lib/pricing/boost.ts (BOOST_TIERS) and
// src/lib/cashfree.ts (PRICING.MONTHLY_LISTING) so this page can't
// drift away from what the checkout actually charges.
const MONTHLY_LISTING = {
  usd: '$10',
  inr: '₹830',
  cadence: 'per month, recurring',
};

const BOOST_TIERS = [
  {
    name: 'Boost · Category Top',
    duration: '7 days',
    usd: '$12',
    inr: '₹999',
    blurb: 'Pins your tool to the #1 spot in its category page.',
  },
  {
    name: 'Boost · Home Rotation',
    duration: '7 days',
    usd: '$30',
    inr: '₹2,499',
    blurb: 'Places your tool in the home-page featured rotation.',
  },
  {
    name: 'Featured Badge',
    duration: '30 days',
    usd: '$60',
    inr: '₹4,999',
    blurb: 'Adds a red Featured badge on every surface your tool appears.',
  },
];

export default function PricingPage() {
  return (
    <LegalPage
      eyebrow="§ pricing"
      title="Pricing"
      lastUpdated={LAST_UPDATED}
      intro={
        <p className="m-0">
          {BRAND.name} has two product types: a <strong>recurring Monthly
          Listing</strong> subscription that keeps a tool in the catalog, and
          three <strong>one-time Boost packages</strong> that surface a tool
          higher for a fixed window. Charges settle in INR via Cashfree or
          USD via PayPal, based on the currency you choose at checkout.
        </p>
      }
      sections={[
        {
          id: 'monthly-listing',
          heading: 'Monthly Listing',
          body: (
            <>
              <p className="m-0">
                {MONTHLY_LISTING.usd} per month for international customers
                ({MONTHLY_LISTING.inr} per month for Indian customers,
                charged on the Cashfree e-mandate). Cadence:{' '}
                {MONTHLY_LISTING.cadence}.
              </p>
              <p className="mt-3">
                Includes the listing page, search inclusion, category
                placement, owner dashboard, and the ability to purchase
                boosts on top.
              </p>
            </>
          ),
        },
        {
          id: 'boosts',
          heading: 'One-time Boost packages',
          body: (
            <div className="grid gap-4">
              {BOOST_TIERS.map((t) => (
                <div
                  key={t.name}
                  className="rounded-md p-4"
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--rule)',
                  }}
                >
                  <div className="flex flex-wrap items-baseline justify-between gap-3">
                    <div
                      className="text-[15px] font-semibold"
                      style={{ color: 'var(--ink)' }}
                    >
                      {t.name}
                    </div>
                    <div
                      className="text-[13px]"
                      style={{
                        fontFamily: 'var(--mono)',
                        color: 'var(--ink-soft)',
                      }}
                    >
                      {t.duration}
                    </div>
                  </div>
                  <div className="mt-2 flex flex-wrap items-baseline gap-3">
                    <span
                      style={{
                        fontFamily: 'var(--mono)',
                        fontSize: 20,
                        color: 'var(--accent)',
                        fontWeight: 600,
                      }}
                    >
                      {t.usd}
                    </span>
                    <span
                      className="text-[13px]"
                      style={{ color: 'var(--ink-soft)' }}
                    >
                      ({t.inr} for Indian customers via Cashfree)
                    </span>
                  </div>
                  <p
                    className="m-0 mt-3 text-[14px] leading-[1.6]"
                    style={{ color: 'var(--ink-2)' }}
                  >
                    {t.blurb}
                  </p>
                </div>
              ))}
            </div>
          ),
        },
        {
          id: 'taxes',
          heading: 'Taxes',
          body: (
            <p className="m-0">
              Listed prices are <strong>exclusive of GST</strong>. For
              Indian customers, applicable GST (currently 18%) is added at
              checkout by Cashfree. International customers pay the listed
              USD amount with no additional tax collected by {BRAND.name};
              local tax obligations are the buyer&apos;s responsibility.
            </p>
          ),
        },
        {
          id: 'changes',
          heading: 'Pricing changes',
          body: (
            <p className="m-0">
              Pricing is subject to change. Existing subscriptions remain at
              the rate locked at sign-up; we will not raise prices on an
              active subscription without 30 days&apos; notice.
            </p>
          ),
        },
        {
          id: 'refunds-pointer',
          heading: 'Refunds & cancellation',
          body: (
            <p className="m-0">
              All payments are generally non-refundable. See the{' '}
              <a href="/refund" style={{ color: 'var(--accent)' }}>
                Refund &amp; Cancellation Policy
              </a>{' '}
              for the discretionary-refund process and subscription
              cancellation rules.
            </p>
          ),
        },
        {
          id: 'contact',
          heading: 'Billed by',
          body: <LegalEntityBlock />,
        },
      ]}
    />
  );
}
