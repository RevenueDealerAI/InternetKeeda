'use client';

import Link from 'next/link';

type Corridor = {
  num: string;
  tag: string;
  title: string;
  em: string;
  desc: string;
  href: string;
};

// Six corridors per the reference. All hrefs map to REAL existing
// routes verified against src/app/ — no 404s, no invented destinations.
const CORRIDORS: Corridor[] = [
  {
    num: '§ 01',
    tag: '/launches',
    title: 'Latest',
    em: 'launches',
    desc: 'Fresh AI tools that shipped this week. New releases, public betas, v1 launches.',
    href: '/latest-launches',
  },
  {
    num: '§ 02',
    tag: '/trending',
    title: 'Trending',
    em: 'this week',
    desc: 'What builders are picking up right now. Tools climbing the catalog by votes and views.',
    href: '/trending',
  },
  {
    num: '§ 03',
    tag: '/top',
    title: 'Top',
    em: 'products',
    desc: 'The highest-rated tools across every category — community-voted and editor-checked.',
    href: '/top-products',
  },
  {
    num: '§ 04',
    tag: '/recent',
    title: 'Recently',
    em: 'added',
    desc: 'Just-listed tools by submission date. Earliest signal for what builders are putting out.',
    href: '/recently-added',
  },
  {
    num: '§ 05',
    tag: '/categories',
    title: 'Browse',
    em: 'categories',
    desc: 'Every category indexed — writing, design, code, video, audio, research, agents, and more.',
    href: '/categories',
  },
  {
    num: '§ 06',
    tag: '/news',
    title: 'AI',
    em: 'news',
    desc: 'What is happening in AI this week. Releases, launches, big shifts, and the why behind them.',
    href: '/latest-news',
  },
];

export function Sections() {
  return (
    <section id="corridors" className="px-6 py-24">
      <div className="mx-auto max-w-[var(--maxw,1240px)]">
        {/* Header */}
        <div className="mb-10 max-w-[720px]">
          <div className="ik-eyebrow">§ 02 — the rooms</div>
          <h2
            className="m-0 mt-3 font-medium text-foreground"
            style={{
              fontSize: 'clamp(36px, 5vw, 60px)',
              lineHeight: 1.02,
              letterSpacing: '-0.025em',
            }}
          >
            Six{' '}
            <span
              className="font-display-roman italic"
              style={{ color: 'var(--blood-color)', fontWeight: 400 }}
            >
              corridors
            </span>{' '}
            into the web.
          </h2>
          <p className="mt-3.5 text-[16px] leading-[1.55]" style={{ color: 'var(--fg-dim)' }}>
            Each room is its own dense, hand-tuned surface. No infinite scroll. No SEO bait. No
            purple gradients.
          </p>
        </div>

        {/* 3×2 hairline grid */}
        <div className="corridor-grid">
          {CORRIDORS.map((c) => (
            <Link key={c.tag} href={c.href} className="corridor-cell group">
              <div className="ik-eyebrow">
                {c.num} — {c.tag}
              </div>
              <h3
                className="m-0 mt-3.5 font-medium text-foreground"
                style={{
                  fontSize: 26,
                  lineHeight: 1.15,
                  letterSpacing: '-0.015em',
                }}
              >
                {c.title}{' '}
                <span
                  className="font-display-roman italic"
                  style={{ color: 'var(--blood-color)', fontWeight: 400 }}
                >
                  {c.em}
                </span>
              </h3>
              <p
                className="mt-2 flex-1 text-[14px] leading-[1.55]"
                style={{ color: 'var(--fg-dim)' }}
              >
                {c.desc}
              </p>
              <div
                className="font-mono-display mt-6 flex items-center justify-between text-[10px] uppercase tracking-[0.22em]"
                style={{ color: 'var(--muted-color)' }}
              >
                <span className="transition-colors group-hover:text-[color:var(--blood-color)]">
                  explore
                </span>
                <span
                  aria-hidden="true"
                  className="inline-block transition-transform duration-300 group-hover:translate-x-1 group-hover:text-[color:var(--blood-color)]"
                >
                  →
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
