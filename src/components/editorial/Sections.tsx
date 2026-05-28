'use client';

import Link from 'next/link';
import { SectionHeader } from './FeaturedGrid';

type Corridor = {
  icon: string;
  route: string;
  title: string;
  desc: string;
  href: string;
};

const CORRIDORS: Corridor[] = [
  {
    icon: '✦',
    route: '/hidden',
    title: 'Hidden gems',
    desc: 'Under-the-radar tools that nobody is talking about yet — the long tail of the catalog.',
    href: '/recently-added',
  },
  {
    icon: '$',
    route: '/hustles',
    title: 'Side hustles',
    desc: 'Tools curated for solo operators, freelancers, and one-person businesses making money on the side.',
    href: '/best-productivity-tools-for-adhd',
  },
  {
    icon: '%',
    route: '/deals',
    title: 'Deals & lifetime',
    desc: 'Discounted plans, lifetime offers, and limited-time AppSumo-style deals on tools we actually use.',
    href: '/latest-launches',
  },
  {
    icon: '⌘',
    route: '/automation',
    title: 'Automation stacks',
    desc: 'No-code playbooks, n8n recipes, agent chains, and stack diagrams from working operators.',
    href: '/best-project-management-tools',
  },
  {
    icon: '△',
    route: '/community',
    title: 'Community',
    desc: 'Builders shipping AI products in public. Tips, builds, debates, and weekly link drops.',
    href: '/discussions',
  },
  {
    icon: '◐',
    route: '/ai',
    title: 'Ask the catalog',
    desc: 'Semantic search across the whole catalog. Describe the workflow, get tools tuned to the task.',
    href: '/?q=',
  },
];

export function Sections() {
  return (
    <section id="corridors" className="px-4 py-24 sm:py-32">
      <div className="mx-auto max-w-7xl">
        <SectionHeader
          marker="§ 02 — the rooms"
          title={
            <>
              Six <span className="font-display italic">corridors</span> into the web.
            </>
          }
        />
        <p className="mt-6 max-w-2xl text-base text-muted-foreground">
          The catalog is more than a list. Six rooms organize tools by intent, not just category —
          enter the one that matches what you&apos;re actually trying to do.
        </p>

        <div
          className="mt-12 overflow-hidden rounded-2xl border bg-foreground/10"
          style={{ borderColor: 'hsl(var(--border))' }}
        >
          <div className="grid grid-cols-1 gap-px sm:grid-cols-2 lg:grid-cols-3">
            {CORRIDORS.map((c) => (
              <CorridorCell key={c.route} corridor={c} />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function CorridorCell({ corridor }: { corridor: Corridor }) {
  return (
    <Link
      href={corridor.href}
      className="group flex flex-col bg-card p-7 transition-colors hover:bg-muted"
    >
      <div className="flex items-start justify-between gap-3">
        <span
          aria-hidden="true"
          className="flex h-11 w-11 items-center justify-center rounded-full bg-foreground text-background"
        >
          <span className="font-display text-xl italic leading-none">{corridor.icon}</span>
        </span>
        <span className="font-mono-display text-[10px] uppercase tracking-[0.2em] text-foreground/50">
          {corridor.route}
        </span>
      </div>

      <h3 className="font-display mt-7 text-3xl italic leading-tight">{corridor.title}</h3>
      <p className="mt-3 text-sm leading-relaxed text-muted-foreground">{corridor.desc}</p>

      <div className="ik-hairline mt-7 h-px w-full" />

      <div className="mt-4 flex items-center gap-2">
        <span className="font-mono-display text-[11px] uppercase tracking-[0.22em] text-foreground/70 transition-colors group-hover:text-foreground">
          enter
        </span>
        <span
          aria-hidden="true"
          className="font-mono-display inline-block translate-x-0 text-foreground/70 transition-transform duration-300 group-hover:translate-x-1 group-hover:text-foreground"
        >
          →
        </span>
      </div>
    </Link>
  );
}
