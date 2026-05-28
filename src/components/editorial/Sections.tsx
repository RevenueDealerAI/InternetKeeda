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

// All routes verified against src/app/ — every href is a real page,
// not an invented destination.
const CORRIDORS: Corridor[] = [
  {
    icon: '△',
    route: '/trending',
    title: 'Trending this week',
    desc: 'What builders are picking up right now. Tools climbing the catalog by votes and views.',
    href: '/trending',
  },
  {
    icon: '★',
    route: '/top-products',
    title: 'Top products',
    desc: 'The highest-rated tools across every category — community-voted and editor-checked.',
    href: '/top-products',
  },
  {
    icon: '✦',
    route: '/latest-launches',
    title: 'Latest launches',
    desc: 'Fresh AI tools that shipped this week. New releases, public betas, and v1 launches.',
    href: '/latest-launches',
  },
  {
    icon: '+',
    route: '/recently-added',
    title: 'Recently added',
    desc: 'Just-listed tools by submission date. Earliest signal for what builders are putting out.',
    href: '/recently-added',
  },
  {
    icon: '◐',
    route: '/categories',
    title: 'Browse categories',
    desc: 'Every category indexed — writing, design, code, video, audio, research, agents, and more.',
    href: '/categories',
  },
  {
    icon: '§',
    route: '/latest-news',
    title: 'AI news',
    desc: 'What is happening in AI this week. Releases, launches, big shifts, and the why behind them.',
    href: '/latest-news',
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
          The catalog is more than a list. Six rooms organize tools by intent — enter the one that
          matches what you are actually trying to find.
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
