'use client';

import Link from 'next/link';

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

const TIERS: Tier[] = [
  {
    name: 'Monthly Listing',
    price: '$10',
    per: '/ month',
    desc: 'Stay in the catalog. Recurring.',
    items: [
      'Public listing',
      'Category placement',
      'Analytics dashboard',
      'Soft-delete safety net',
    ],
    cta: { label: 'Submit tool', href: '/submit-tool' },
  },
  {
    name: 'Boost · Category Top',
    price: '$12',
    per: '/ 7 days',
    desc: 'Top of your category page.',
    items: [
      'Pin to top of category',
      'Boost badge',
      'Real-time impressions',
      'PayPal or Cashfree',
    ],
    cta: { label: 'Boost category', href: '/submit-tool' },
  },
  {
    name: 'Boost · Home Rotation',
    price: '$30',
    per: '/ 7 days',
    desc: 'Land in the home rotation.',
    items: [
      'Home rotation slot',
      'Front-page exposure',
      'Self-healing webhooks',
      'Resubmit-safe',
    ],
    cta: { label: 'Boost now', href: '/submit-tool' },
    featured: true,
    ribbon: 'most picked',
  },
  {
    name: 'Featured Badge',
    price: '$60',
    per: '/ 30 days',
    desc: 'Wear the blood crown.',
    items: [
      'Featured badge',
      'Editorial mention',
      'Newsletter inclusion',
      'All boost benefits',
    ],
    cta: { label: 'Go featured', href: '/submit-tool' },
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="px-6 py-24">
      <div className="mx-auto max-w-[var(--maxw,1240px)]">
        {/* Header — centered */}
        <div className="mx-auto mb-14 max-w-[760px] text-center">
          <div className="ik-eyebrow">§ 03 — pricing</div>
          <h2
            className="m-0 mt-3 font-medium text-foreground"
            style={{
              fontSize: 'clamp(36px, 5vw, 60px)',
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
            }}
          >
            Pay to{' '}
            <span
              className="font-display-roman italic"
              style={{ color: 'var(--blood-color)', fontWeight: 400 }}
            >
              be seen.
            </span>
          </h2>
          <p className="mx-auto mt-4 text-[16px] leading-[1.55]" style={{ color: 'var(--fg-dim)' }}>
            USD-anchored. PayPal worldwide. Cashfree for India. Self-healing webhooks so nothing
            strands.
          </p>
        </div>

        {/* 4-col grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {TIERS.map((tier) => (
            <TierCard key={tier.name} tier={tier} />
          ))}
        </div>
      </div>
    </section>
  );
}

function TierCard({ tier }: { tier: Tier }) {
  const featured = !!tier.featured;
  return (
    <article className={`tier-card ${featured ? 'featured' : 'ik-glass'}`}>
      {tier.ribbon && <div className="ribbon">{tier.ribbon}</div>}

      <div
        className="font-mono-display text-[10px] uppercase tracking-[0.22em]"
        style={{ color: featured ? 'rgba(255,255,255,0.8)' : 'var(--muted-color)' }}
      >
        {tier.name}
      </div>

      <div className="mt-3.5 flex items-baseline gap-2">
        <span
          className="font-display-roman italic"
          style={{
            fontSize: 56,
            lineHeight: 1,
            color: featured ? '#fff' : 'hsl(var(--foreground))',
            fontWeight: 400,
          }}
        >
          {tier.price}
        </span>
        <span
          className="font-mono-display text-[12px]"
          style={{ color: featured ? 'rgba(255,255,255,0.8)' : 'var(--muted-color)' }}
        >
          {tier.per}
        </span>
      </div>

      <p
        className="m-0 mt-2 text-[14px] leading-[1.5]"
        style={{ color: featured ? 'rgba(255,255,255,0.85)' : 'var(--fg-dim)' }}
      >
        {tier.desc}
      </p>

      <ul className="m-0 mb-6 mt-5 grid list-none gap-2.5 p-0">
        {tier.items.map((item) => (
          <li
            key={item}
            className="flex items-start gap-2.5 text-[13px]"
            style={{ color: featured ? '#fff' : 'hsl(var(--foreground))' }}
          >
            <span
              aria-hidden="true"
              className="mt-[8px] block h-[5px] w-[5px] flex-shrink-0 rounded-full"
              style={{ background: featured ? '#fff' : 'var(--blood-color)' }}
            />
            {item}
          </li>
        ))}
      </ul>

      <Link
        href={tier.cta.href}
        className={featured ? '' : 'btn-blood'}
        style={
          featured
            ? {
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
                padding: 14,
                borderRadius: 999,
                background: '#fff',
                color: 'var(--blood-color)',
                fontFamily: 'var(--font-jetbrains-mono), ui-monospace, monospace',
                fontSize: 11,
                textTransform: 'uppercase',
                letterSpacing: '0.18em',
                fontWeight: 600,
                width: '100%',
                transition: 'background 0.25s ease',
              }
            : { width: '100%', justifyContent: 'center', padding: 14 }
        }
      >
        {tier.cta.label} →
      </Link>
    </article>
  );
}
