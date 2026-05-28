'use client';

import Link from 'next/link';

const CATEGORIES = [
  'writing', 'design', 'code', 'audio', 'video', 'research',
  'agents', 'automation', '3d', 'vision', 'voice', 'search',
];

export function Hero({
  toolCount,
  categoryCount,
}: {
  toolCount: number;
  categoryCount: number;
}) {
  const marqueeItems = [...CATEGORIES, ...CATEGORIES];

  return (
    <section className="relative px-4 pt-36 pb-24 sm:pt-40 sm:pb-32">
      <div className="mx-auto max-w-5xl">
        <div className="flex flex-col items-center text-center">
          {/* Live-tools pill */}
          <div className="ik-pill font-mono-display flex items-center gap-2 rounded-full px-3 py-1.5 text-[10px] uppercase tracking-[0.22em] text-foreground/70">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-foreground/40 opacity-75"></span>
              <span className="relative inline-flex h-2 w-2 rounded-full bg-foreground"></span>
            </span>
            <span>
              <span className="text-foreground">{toolCount.toLocaleString()} tools</span>
              <span className="mx-2 text-foreground/30">·</span>
              <span>indexed live</span>
            </span>
          </div>

          {/* H1 — Geist + italic Instrument Serif accents */}
          <h1 className="mt-8 text-5xl font-medium tracking-tight leading-[0.95] sm:text-7xl md:text-[5.5rem] lg:text-[7rem]">
            <span className="block">
              <span className="font-display italic">Discover.</span>{' '}
              <span className="font-display italic">Learn.</span>{' '}
              <span>Earn.</span>
            </span>
            <span className="block text-foreground/85">
              <span className="font-display italic">Everything</span>{' '}
              <span className="font-display italic">AI.</span>
            </span>
          </h1>

          <p className="mt-8 max-w-xl text-base text-muted-foreground sm:text-lg">
            A printed catalog of {toolCount.toLocaleString()}+ AI tools across {categoryCount}+ categories.
            Submitted by builders, ranked by use, indexed live. The web has a spider — and it&apos;s crawling.
          </p>

          <div className="mt-8 flex flex-col items-center gap-3 sm:flex-row">
            <Link
              href="#featured"
              className="font-mono-display rounded-full bg-foreground px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-background transition-opacity hover:opacity-90"
            >
              Enter the web →
            </Link>
            <Link
              href="/categories"
              className="ik-pill font-mono-display rounded-full px-6 py-3 text-[11px] uppercase tracking-[0.2em] text-foreground transition-colors hover:bg-muted"
            >
              Browse catalog
            </Link>
          </div>

          {/* Hanging hero spider */}
          <HangingSpider />

          {/* Stat strip */}
          <div className="mt-16 w-full">
            <StatStrip toolCount={toolCount} categoryCount={categoryCount} />
          </div>
        </div>
      </div>

      {/* Category marquee */}
      <div className="ik-marquee-mask mt-20 overflow-hidden">
        <div className="ik-marquee flex w-max items-center gap-10 whitespace-nowrap text-3xl text-foreground/35 sm:text-4xl md:text-5xl">
          {marqueeItems.map((c, i) => (
            <span key={i} className="flex items-center gap-10">
              <span className="font-display italic">{c}</span>
              <span aria-hidden="true" className="text-foreground/20">✦</span>
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}

function HangingSpider() {
  return (
    <div className="relative mt-16 flex h-[26rem] w-full items-start justify-center sm:h-[30rem]">
      {/* The thread coming down from the top */}
      <div
        aria-hidden="true"
        className="absolute left-1/2 top-0 -translate-x-1/2 ik-thread"
        style={{ width: 1, height: '60%' }}
      />

      {/* The spider itself, with float */}
      <div className="absolute left-1/2 top-[40%] -translate-x-1/2 ik-float-y">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/spider.svg"
          alt="Keeda, the Internet Keeda mascot"
          width={420}
          height={420}
          className="block h-[18rem] w-[18rem] sm:h-[24rem] sm:w-[24rem] md:h-[28rem] md:w-[28rem]"
          style={{ filter: 'drop-shadow(0 24px 32px rgba(0,0,0,0.16))' }}
          draggable={false}
        />
      </div>

      {/* Floating spec chips — three paper pills with mono labels */}
      <SpecChip className="left-[8%] top-[18%]" delay="ik-float-y-slow" label="mascot" value="keeda" />
      <SpecChip className="right-[6%] top-[40%]" delay="ik-float-y" label="crawled" value="218,402 pages" />
      <SpecChip className="left-[12%] bottom-[12%]" delay="ik-float-y-fast" label="latency" value="12ms" />
    </div>
  );
}

function SpecChip({
  className,
  delay,
  label,
  value,
}: {
  className: string;
  delay: string;
  label: string;
  value: string;
}) {
  return (
    <div className={`absolute ${className} ${delay} ik-pill flex flex-col gap-0.5 rounded-xl px-3 py-2 text-left`}>
      <div className="font-mono-display text-[9px] uppercase tracking-[0.2em] text-muted-foreground">
        {label}
      </div>
      <div className="font-display-roman text-base italic text-foreground">{value}</div>
    </div>
  );
}

function StatStrip({ toolCount, categoryCount }: { toolCount: number; categoryCount: number }) {
  const stats = [
    { value: toolCount.toLocaleString(), label: 'tools indexed' },
    { value: '$10', label: '/mo to list' },
    { value: `${categoryCount}+`, label: 'categories' },
  ];
  return (
    <div
      className="ik-card mx-auto grid w-full max-w-3xl grid-cols-3 overflow-hidden rounded-2xl border bg-card"
      style={{ borderColor: 'hsl(var(--border))' }}
    >
      {stats.map((s, i) => (
        <div
          key={s.label}
          className={`flex flex-col items-center gap-2 px-6 py-7 ${i !== 0 ? 'border-l' : ''}`}
          style={{ borderColor: 'hsl(var(--border))' }}
        >
          <div className="font-display text-4xl italic leading-none sm:text-5xl">{s.value}</div>
          <div className="font-mono-display text-[10px] uppercase tracking-[0.2em] text-muted-foreground">
            {s.label}
          </div>
        </div>
      ))}
    </div>
  );
}
