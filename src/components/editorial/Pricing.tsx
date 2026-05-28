'use client';

import Link from 'next/link';
import { SectionHeader } from './FeaturedGrid';

type Plan = {
  name: string;
  price: string;
  period: string;
  tagline: string;
  features: string[];
  cta: { label: string; href: string };
  highlight?: boolean;
};

const PLANS: Plan[] = [
  {
    name: 'Listing',
    price: '$10',
    period: '/ month',
    tagline: 'Stay in the catalog. Forever.',
    features: [
      'Public listing on internetkeeda.com',
      'Category placement + search index',
      'Real-time analytics dashboard',
      'Soft-delete safety net for missed payments',
    ],
    cta: { label: 'Submit tool →', href: '/submit-tool' },
  },
  {
    name: 'Boost · Category',
    price: '$12',
    period: '/ 7 days',
    tagline: 'Pin to the top of your category.',
    features: [
      'Top slot in your category for 7 days',
      'Category boost badge on the card',
      'Real-time impressions + clicks',
      'PayPal or Cashfree, USD-anchored',
    ],
    cta: { label: 'Boost category →', href: '/submit-tool' },
  },
  {
    name: 'Boost · Home',
    price: '$30',
    period: '/ 7 days',
    tagline: 'Land in the home rotation.',
    features: [
      'Home rotation slot (front-page exposure)',
      'Self-healing webhooks — no stranded payments',
      'Resubmit-safe, keeps your slot on re-edit',
      'Stacks with the monthly Listing',
    ],
    cta: { label: 'Boost now →', href: '/submit-tool' },
    highlight: true,
  },
  {
    name: 'Featured Badge',
    price: '$60',
    period: '/ 30 days',
    tagline: 'Wear the crown for a month.',
    features: [
      'Featured badge on every surface',
      'All boost benefits included',
      'Editorial mention in our roundup',
      'Newsletter inclusion to our reader list',
    ],
    cta: { label: 'Go featured →', href: '/submit-tool' },
  },
];

export function Pricing() {
  return (
    <section id="pricing" className="px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          marker="§ 03 — pricing"
          title={
            <>
              Pay to <span className="font-display italic text-blood">be seen.</span>
            </>
          }
        />
        <p className="mt-6 max-w-2xl text-base text-muted-foreground">
          USD-anchored. PayPal worldwide, Cashfree for India. Self-healing webhooks keep your
          listing live even if a single payment event drops.
        </p>

        <div className="mt-12 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {PLANS.map((plan) => (
            <PlanCard key={plan.name} plan={plan} />
          ))}
        </div>
      </div>
    </section>
  );
}

function PlanCard({ plan }: { plan: Plan }) {
  const highlight = !!plan.highlight;

  // Highlight card → blood-gradient w/ red glow. Others → glass.
  const cardSurface = highlight
    ? 'bg-gradient-blood shadow-blood text-white border-transparent'
    : 'glass text-foreground';

  const mutedText = highlight ? 'text-white/70' : 'text-muted-foreground';
  const hairline = highlight ? 'bg-white/20' : 'bg-foreground/12';

  return (
    <div className="relative flex flex-col">
      {highlight && (
        <div className="absolute -top-3 left-1/2 -translate-x-1/2 z-10">
          <span className="glass font-mono-display rounded-full px-3 py-1 text-[10px] uppercase tracking-[0.22em] text-foreground">
            most picked
          </span>
        </div>
      )}

      <div
        className={`ik-card flex h-full flex-col overflow-hidden rounded-2xl border p-8 ${cardSurface}`}
      >
        <div className="font-mono-display text-[10px] uppercase tracking-[0.25em]">
          <span className={mutedText}>plan</span>{' '}
          <span className="ml-1">{plan.name}</span>
        </div>

        <div className="mt-5 flex items-baseline gap-2">
          <span className="font-display text-6xl italic leading-none">{plan.price}</span>
          <span className={`font-mono-display text-xs uppercase tracking-[0.18em] ${mutedText}`}>
            {plan.period}
          </span>
        </div>

        <p className="font-display-roman mt-4 text-lg italic">{plan.tagline}</p>

        <div className={`mt-6 h-px w-full ${hairline}`} />

        <ul className="mt-6 flex flex-1 flex-col gap-3">
          {plan.features.map((f) => (
            <li key={f} className="flex items-start gap-3 text-sm leading-relaxed">
              <span
                aria-hidden="true"
                className={`mt-[0.55rem] h-[3px] w-[3px] shrink-0 rounded-full ${highlight ? 'bg-white' : 'bg-blood'}`}
              />
              <span className={highlight ? 'text-white/90' : 'text-foreground/85'}>{f}</span>
            </li>
          ))}
        </ul>

        <Link
          href={plan.cta.href}
          className={
            highlight
              ? 'font-mono-display mt-8 inline-flex items-center justify-center rounded-full bg-white px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-black transition-transform hover:-translate-y-0.5'
              : 'font-mono-display bg-gradient-blood shadow-blood mt-8 inline-flex items-center justify-center rounded-full px-5 py-3 text-[11px] uppercase tracking-[0.2em] text-white transition-transform hover:-translate-y-0.5'
          }
        >
          {plan.cta.label}
        </Link>
      </div>
    </div>
  );
}
