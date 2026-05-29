'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';

type Tier = {
  name: string;
  price: string;
  per: string;
  desc: string;
  items: string[];
  cta: { label: string; href: string };
  featured?: boolean;
  ribbon?: string;
};

// Single-tier pricing — only the Monthly Listing plan has a live
// payment flow right now (Cashfree TEST → ₹830/mo, displayed as $10).
// Boost / Featured tiers will return when their checkout flows are
// live in production.
const TIERS: Tier[] = [
  {
    name: 'Monthly Listing',
    price: '$10',
    per: '/ month',
    desc: 'Recurring listing — stay in the catalog. The only thing you need to be on Internet Keeda.',
    items: [
      'Public listing on internetkeeda.com',
      'Category placement + search index',
      'Real-time analytics dashboard',
      'Editorial review on submission',
      'Soft-delete safety net for missed payments',
      'Cancel anytime from your dashboard',
    ],
    cta: { label: 'Submit your tool', href: '/submit-tool' },
    featured: true,
    ribbon: 'one plan · one price',
  },
];

export function Pricing() {
  return (
    <section
      id="pricing"
      style={{ padding: '120px 28px', background: 'var(--bg)', color: 'var(--ink)' }}
    >
      <div className="mx-auto max-w-[1320px]">
        <div className="mx-auto mb-14 max-w-[760px] text-center">
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
            }}
          >
            § 03 — pricing
          </div>
          <h2
            className="m-0 mt-3"
            style={{
              fontFamily: 'var(--sans)',
              fontSize: 'clamp(36px, 5vw, 60px)',
              fontWeight: 500,
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
              color: 'var(--ink)',
            }}
          >
            Pay to{' '}
            <span style={{ fontWeight: 600, color: 'var(--accent)' }}>be seen.</span>
          </h2>
          <p
            className="mx-auto mt-4 text-[16px] leading-[1.6]"
            style={{ color: 'var(--ink-2)' }}
          >
            One plan. One price. Cashfree checkout, USD-anchored. Self-healing webhooks so
            nothing strands. No boosts, no upsells — list well and let the catalog do the work.
          </p>
        </div>

        <div className="mx-auto grid max-w-[460px] grid-cols-1 gap-4">
          {TIERS.map((t) => (
            <TierCard key={t.name} tier={t} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TierCard({ tier }: { tier: Tier }) {
  const featured = !!tier.featured;
  return (
    <article
      className="relative flex flex-col rounded-2xl p-7 transition-transform duration-300 hover:-translate-y-1"
      style={
        featured
          ? {
              background: 'linear-gradient(160deg, var(--accent), var(--accent-2))',
              color: 'var(--on-accent)',
              border: '1px solid transparent',
              boxShadow: 'var(--shadow-accent)',
            }
          : {
              background: 'var(--bg-2)',
              border: '1px solid var(--rule)',
              boxShadow: 'var(--shadow-sm)',
            }
      }
    >
      {tier.ribbon && (
        <div
          className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full px-3 py-1"
          style={{
            background: 'var(--bg-2)',
            color: 'var(--ink)',
            border: '1px solid var(--rule)',
            fontFamily: 'var(--mono)',
            fontSize: 9,
            letterSpacing: '0.25em',
            textTransform: 'uppercase',
          }}
        >
          {tier.ribbon}
        </div>
      )}

      <div
        style={{
          fontFamily: 'var(--mono)',
          fontSize: 10,
          letterSpacing: '0.22em',
          textTransform: 'uppercase',
          color: featured ? 'rgba(255,255,255,0.8)' : 'var(--ink-soft)',
        }}
      >
        {tier.name}
      </div>

      <div className="mt-4 flex items-baseline gap-2">
        <span
          className="tabular-nums"
          style={{
            fontFamily: 'var(--sans)',
            fontWeight: 600,
            fontSize: 56,
            letterSpacing: '-0.03em',
            lineHeight: 1,
            color: featured ? '#fff' : 'var(--ink)',
          }}
        >
          {tier.price}
        </span>
        <span
          style={{
            fontFamily: 'var(--mono)',
            fontSize: 12,
            color: featured ? 'rgba(255,255,255,0.8)' : 'var(--ink-soft)',
          }}
        >
          {tier.per}
        </span>
      </div>

      <p
        className="m-0 mt-2 text-[14px] leading-[1.55]"
        style={{ color: featured ? 'rgba(255,255,255,0.9)' : 'var(--ink-2)' }}
      >
        {tier.desc}
      </p>

      <ul className="m-0 mt-6 grid flex-1 list-none gap-2.5 p-0">
        {tier.items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2.5 text-[13px] leading-[1.5]"
            style={{ color: featured ? '#fff' : 'var(--ink)' }}
          >
            <span
              aria-hidden="true"
              className="mt-[7px] block h-[5px] w-[5px] shrink-0 rounded-full"
              style={{ background: featured ? '#fff' : 'var(--accent)' }}
            />
            {item}
          </li>
        ))}
      </ul>

      <Link
        href={tier.cta.href}
        className="mt-7 inline-flex w-full items-center justify-center gap-2 rounded-full px-5 py-3.5"
        style={
          featured
            ? {
                background: '#fff',
                color: 'var(--accent)',
                fontFamily: 'var(--mono)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }
            : {
                background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                color: 'var(--on-accent)',
                fontFamily: 'var(--mono)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                boxShadow: 'var(--shadow-accent)',
              }
        }
      >
        {tier.cta.label} <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
      </Link>
    </article>
  );
}
