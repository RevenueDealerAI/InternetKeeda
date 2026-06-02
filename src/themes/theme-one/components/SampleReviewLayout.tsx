'use client';

import Link from 'next/link';
import Image from 'next/image';
import { Helmet } from 'react-helmet-async';
import {
  Star,
  Check,
  X,
  ExternalLink,
  ArrowLeft,
  ArrowRight,
  Sparkles,
  ShieldCheck,
  AlertTriangle,
} from 'lucide-react';
import type { SampleReview } from '@/data/sample-reviews';

/**
 * Detail view for /reviews/[slug] when the slug matches a hand-written
 * sample. Structured around the SampleReview shape: rating + subscore
 * panel, TL;DR, pros / cons, best-for / not-for, sectioned breakdown,
 * pricing, alternatives, and a final verdict. Pure presentation —
 * data lives in src/data/sample-reviews.ts.
 */
export default function SampleReviewLayout({ review }: { review: SampleReview }) {
  const reviewedDate = new Date(review.reviewedOn).toLocaleDateString('en-US', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  });
  const logoUrl = `https://www.google.com/s2/favicons?domain=${review.toolDomain}&sz=128`;
  const toolUrl = `https://${review.toolDomain}`;

  return (
    <>
      <Helmet>
        <title>{`${review.title} · Internet Keeda Reviews`}</title>
        <meta name="description" content={review.verdict} />
        <meta property="og:title" content={review.title} />
        <meta property="og:description" content={review.verdict} />
      </Helmet>

      <main
        className="min-h-screen"
        style={{ background: 'var(--bg)', color: 'var(--ink)' }}
      >
        <div className="container mx-auto px-4 pt-[140px] pb-20 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl">
            {/* Breadcrumb */}
            <nav
              className="mb-8 flex items-center gap-2 text-[11px] uppercase tracking-[0.22em]"
              style={{ fontFamily: 'var(--mono)', color: 'var(--ink-soft)' }}
            >
              <Link
                href="/reviews"
                className="inline-flex items-center gap-1.5 transition-colors hover:opacity-80"
                style={{ color: 'var(--accent)' }}
              >
                <ArrowLeft className="h-3 w-3" />
                Reviews
              </Link>
              <span style={{ color: 'var(--ink-dim)' }}>/</span>
              <span
                className="truncate"
                style={{ color: 'var(--ink-2)', textTransform: 'none', letterSpacing: 0 }}
              >
                {review.toolName}
              </span>
            </nav>

            {/* Header */}
            <header className="mb-10">
              <div
                className="text-[11px] uppercase tracking-[0.3em]"
                style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}
              >
                § review — {review.category}
              </div>
              <h1
                className="m-0 mt-4"
                style={{
                  color: 'var(--ink)',
                  fontFamily: 'var(--sans)',
                  fontSize: 'clamp(28px, 4.4vw, 48px)',
                  fontWeight: 600,
                  lineHeight: 1.08,
                  letterSpacing: '-0.028em',
                }}
              >
                {review.title}
              </h1>

              {/* Meta strip */}
              <div
                className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-3 text-[12px]"
                style={{
                  fontFamily: 'var(--mono)',
                  color: 'var(--ink-soft)',
                }}
              >
                <span className="inline-flex items-center gap-2">
                  <div
                    className="relative h-7 w-7 overflow-hidden rounded-full"
                    style={{ border: '1px solid var(--rule)' }}
                  >
                    <Image
                      src={review.reviewer.avatar}
                      alt={review.reviewer.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <span style={{ color: 'var(--ink-2)' }}>
                    {review.reviewer.name}
                  </span>
                </span>
                <span style={{ color: 'var(--ink-dim)' }}>·</span>
                <span>Reviewed {reviewedDate}</span>
                <span style={{ color: 'var(--ink-dim)' }}>·</span>
                <span>{review.testedFor}</span>
              </div>
            </header>

            {/* Hero card: tool identity + rating + subscores */}
            <section
              className="mb-12 grid grid-cols-1 gap-0 overflow-hidden rounded-2xl md:grid-cols-[1.1fr_1fr]"
              style={{
                background: 'var(--bg-2)',
                border: '1px solid var(--rule)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              {/* Left: tool identity */}
              <div
                className="flex flex-col gap-5 p-7"
                style={{ borderRight: '1px solid var(--rule)' }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl"
                    style={{
                      background: '#fff',
                      border: '1px solid var(--rule)',
                    }}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={logoUrl}
                      alt={`${review.toolName} logo`}
                      className="h-10 w-10 object-contain"
                    />
                  </div>
                  <div className="min-w-0">
                    <div
                      className="text-[20px] font-semibold leading-tight"
                      style={{ color: 'var(--ink)' }}
                    >
                      {review.toolName}
                    </div>
                    <a
                      href={toolUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 text-[12px] transition-colors hover:opacity-80"
                      style={{
                        color: 'var(--accent)',
                        fontFamily: 'var(--mono)',
                      }}
                    >
                      {review.toolDomain}
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>

                <div
                  className="text-[15px] leading-[1.65]"
                  style={{
                    color: 'var(--ink-2)',
                    fontFamily: 'var(--sans)',
                  }}
                >
                  {review.verdict}
                </div>

                <div className="mt-auto flex items-end justify-between gap-4">
                  <div>
                    <div
                      className="text-[10px] uppercase tracking-[0.24em]"
                      style={{
                        color: 'var(--ink-soft)',
                        fontFamily: 'var(--mono)',
                      }}
                    >
                      Overall
                    </div>
                    <div className="mt-1 flex items-baseline gap-2">
                      <span
                        className="text-[44px] font-semibold leading-none tabular-nums"
                        style={{
                          color: 'var(--ink)',
                          letterSpacing: '-0.03em',
                        }}
                      >
                        {review.rating.toFixed(1)}
                      </span>
                      <span
                        className="text-[14px]"
                        style={{
                          color: 'var(--ink-soft)',
                          fontFamily: 'var(--mono)',
                        }}
                      >
                        / 5.0
                      </span>
                    </div>
                  </div>
                  <BigStars value={review.rating} />
                </div>
              </div>

              {/* Right: subscore bars */}
              <div className="p-7">
                <div
                  className="text-[10px] uppercase tracking-[0.24em]"
                  style={{
                    color: 'var(--ink-soft)',
                    fontFamily: 'var(--mono)',
                  }}
                >
                  Rating breakdown
                </div>
                <div className="mt-4 flex flex-col gap-3.5">
                  {review.subscores.map((s) => (
                    <SubscoreRow key={s.label} label={s.label} value={s.value} />
                  ))}
                </div>
              </div>
            </section>

            {/* TL;DR */}
            <Block
              eyebrow="§ 01 — tl;dr"
              title={
                <>
                  The <em style={{ fontFamily: 'var(--serif)', fontStyle: 'italic', fontWeight: 400 }}>short</em> version
                </>
              }
            >
              <ul className="m-0 mt-2 flex flex-col gap-3 p-0">
                {review.tldr.map((item, i) => (
                  <li
                    key={i}
                    className="flex gap-3 text-[15px] leading-[1.6]"
                    style={{ color: 'var(--ink-2)' }}
                  >
                    <span
                      className="mt-[9px] inline-block shrink-0 rounded-full"
                      style={{
                        width: 6,
                        height: 6,
                        background: 'var(--accent)',
                      }}
                    />
                    <span>{item}</span>
                  </li>
                ))}
              </ul>
            </Block>

            {/* Pros / Cons */}
            <Block eyebrow="§ 02 — pros & cons" title="What we liked, what we didn't">
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <ProsConsCard kind="pros" items={review.pros} />
                <ProsConsCard kind="cons" items={review.cons} />
              </div>
            </Block>

            {/* Best for / Not for */}
            <Block eyebrow="§ 03 — who it's for" title="Best for, not for">
              <div className="mt-4 grid grid-cols-1 gap-4 md:grid-cols-2">
                <FitCard kind="for" items={review.bestFor} />
                <FitCard kind="not" items={review.notFor} />
              </div>
            </Block>

            {/* Sections breakdown */}
            {review.sections.map((section, idx) => (
              <Block
                key={section.heading}
                eyebrow={`§ ${String(idx + 4).padStart(2, '0')} — deep dive`}
                title={section.heading}
              >
                {section.paragraphs?.map((p, i) => (
                  <p
                    key={i}
                    className="m-0 mt-4 text-[15.5px] leading-[1.75]"
                    style={{ color: 'var(--ink-2)' }}
                  >
                    {p}
                  </p>
                ))}
                {section.bullets && section.bullets.length > 0 && (
                  <ul className="m-0 mt-5 flex flex-col gap-3 p-0">
                    {section.bullets.map((b, i) => (
                      <li
                        key={i}
                        className="flex gap-3 text-[15px] leading-[1.65]"
                        style={{ color: 'var(--ink-2)' }}
                      >
                        <span
                          className="mt-[7px] inline-block h-[10px] w-[10px] shrink-0"
                          style={{
                            background: 'var(--accent)',
                            transform: 'rotate(45deg)',
                          }}
                        />
                        <span>{b}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </Block>
            ))}

            {/* Pricing */}
            <Block
              eyebrow={`§ ${String(review.sections.length + 4).padStart(2, '0')} — pricing`}
              title="What it costs in 2026"
            >
              <div className="mt-5 grid grid-cols-1 gap-3 sm:grid-cols-2">
                {review.pricing.map((tier) => (
                  <div
                    key={tier.tier}
                    className="rounded-xl p-5"
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--rule)',
                    }}
                  >
                    <div
                      className="text-[10px] uppercase tracking-[0.22em]"
                      style={{
                        color: 'var(--ink-soft)',
                        fontFamily: 'var(--mono)',
                      }}
                    >
                      {tier.tier}
                    </div>
                    <div
                      className="mt-1.5 text-[22px] font-semibold"
                      style={{
                        color: 'var(--ink)',
                        letterSpacing: '-0.02em',
                      }}
                    >
                      {tier.price}
                    </div>
                    <p
                      className="m-0 mt-2 text-[13.5px] leading-[1.55]"
                      style={{ color: 'var(--ink-2)' }}
                    >
                      {tier.blurb}
                    </p>
                  </div>
                ))}
              </div>
            </Block>

            {/* Alternatives */}
            <Block
              eyebrow={`§ ${String(review.sections.length + 5).padStart(2, '0')} — alternatives`}
              title="If this isn't the right fit"
            >
              <div className="mt-5 flex flex-col gap-3">
                {review.alternatives.map((alt) => (
                  <div
                    key={alt.name}
                    className="flex flex-col gap-1.5 rounded-xl p-5 sm:flex-row sm:items-center sm:gap-5"
                    style={{
                      background: 'var(--bg-2)',
                      border: '1px solid var(--rule)',
                    }}
                  >
                    <div
                      className="shrink-0 text-[14.5px] font-semibold sm:w-44"
                      style={{ color: 'var(--ink)' }}
                    >
                      {alt.name}
                    </div>
                    <div
                      className="text-[13.5px] leading-[1.6]"
                      style={{ color: 'var(--ink-2)' }}
                    >
                      {alt.blurb}
                    </div>
                  </div>
                ))}
              </div>
            </Block>

            {/* Bottom line */}
            <section
              className="mb-12 mt-6 rounded-2xl p-7"
              style={{
                background:
                  'linear-gradient(135deg, var(--accent-soft) 0%, transparent 60%)',
                border: '1px solid var(--rule)',
              }}
            >
              <div
                className="flex items-center gap-2 text-[11px] uppercase tracking-[0.3em]"
                style={{
                  color: 'var(--accent)',
                  fontFamily: 'var(--mono)',
                }}
              >
                <Sparkles className="h-3.5 w-3.5" />
                The bottom line
              </div>
              <p
                className="m-0 mt-4 text-[16px] leading-[1.75]"
                style={{ color: 'var(--ink)', fontFamily: 'var(--sans)' }}
              >
                {review.bottomLine}
              </p>
            </section>

            {/* Footer CTA */}
            <div
              className="flex flex-col items-start justify-between gap-4 pt-8 sm:flex-row sm:items-center"
              style={{ borderTop: '1px solid var(--rule)' }}
            >
              <Link
                href="/reviews"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[12px] uppercase tracking-[0.16em] transition-all hover:-translate-y-0.5"
                style={{
                  background: 'var(--surface)',
                  color: 'var(--ink-2)',
                  border: '1px solid var(--rule)',
                  fontFamily: 'var(--mono)',
                  fontWeight: 600,
                }}
              >
                <ArrowLeft className="h-3.5 w-3.5" />
                All reviews
              </Link>
              <a
                href={toolUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-[12px] uppercase tracking-[0.16em] transition-all hover:-translate-y-0.5"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--on-accent)',
                  fontFamily: 'var(--mono)',
                  fontWeight: 600,
                  boxShadow: 'var(--shadow-accent)',
                }}
              >
                Visit {review.toolName}
                <ArrowRight className="h-3.5 w-3.5" />
              </a>
            </div>
          </div>
        </div>
      </main>
    </>
  );
}

/* ---------- helpers ---------- */

function Block({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string;
  title: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <section
      className="mb-10 rounded-2xl p-6 sm:p-8"
      style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--rule)',
      }}
    >
      <div
        className="text-[11px] uppercase tracking-[0.3em]"
        style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}
      >
        {eyebrow}
      </div>
      <h2
        className="m-0 mt-3"
        style={{
          color: 'var(--ink)',
          fontFamily: 'var(--sans)',
          fontSize: 'clamp(20px, 2.4vw, 26px)',
          fontWeight: 600,
          letterSpacing: '-0.02em',
          lineHeight: 1.18,
        }}
      >
        {title}
      </h2>
      {children}
    </section>
  );
}

function ProsConsCard({
  kind,
  items,
}: {
  kind: 'pros' | 'cons';
  items: string[];
}) {
  const isPros = kind === 'pros';
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--rule)',
      }}
    >
      <div
        className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em]"
        style={{
          color: isPros ? 'var(--accent)' : 'var(--ink-soft)',
          fontFamily: 'var(--mono)',
        }}
      >
        {isPros ? (
          <Check className="h-3.5 w-3.5" />
        ) : (
          <X className="h-3.5 w-3.5" />
        )}
        {isPros ? 'Pros' : 'Cons'}
      </div>
      <ul className="m-0 mt-4 flex flex-col gap-2.5 p-0">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex gap-2.5 text-[14px] leading-[1.55]"
            style={{ color: 'var(--ink-2)' }}
          >
            <span
              className="mt-0.5 grid h-4 w-4 shrink-0 place-items-center rounded-full"
              style={{
                background: isPros
                  ? 'var(--accent-soft)'
                  : 'rgba(255,255,255,0.06)',
                color: isPros ? 'var(--accent)' : 'var(--ink-soft)',
              }}
            >
              {isPros ? (
                <Check className="h-2.5 w-2.5" strokeWidth={3} />
              ) : (
                <X className="h-2.5 w-2.5" strokeWidth={3} />
              )}
            </span>
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function FitCard({
  kind,
  items,
}: {
  kind: 'for' | 'not';
  items: string[];
}) {
  const isFor = kind === 'for';
  return (
    <div
      className="rounded-xl p-5"
      style={{
        background: 'var(--surface)',
        border: '1px solid var(--rule)',
      }}
    >
      <div
        className="flex items-center gap-2 text-[10px] uppercase tracking-[0.24em]"
        style={{
          color: isFor ? 'var(--accent)' : 'var(--ink-soft)',
          fontFamily: 'var(--mono)',
        }}
      >
        {isFor ? (
          <ShieldCheck className="h-3.5 w-3.5" />
        ) : (
          <AlertTriangle className="h-3.5 w-3.5" />
        )}
        {isFor ? 'Best for' : 'Not for'}
      </div>
      <ul className="m-0 mt-4 flex flex-col gap-2.5 p-0">
        {items.map((item, i) => (
          <li
            key={i}
            className="flex gap-2.5 text-[14px] leading-[1.55]"
            style={{ color: 'var(--ink-2)' }}
          >
            <span
              className="mt-[9px] inline-block h-[5px] w-[5px] shrink-0 rounded-full"
              style={{
                background: isFor ? 'var(--accent)' : 'var(--ink-soft)',
              }}
            />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function SubscoreRow({ label, value }: { label: string; value: number }) {
  const pct = Math.max(0, Math.min(100, (value / 5) * 100));
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <span
          className="text-[13px]"
          style={{
            color: 'var(--ink-2)',
            fontFamily: 'var(--sans)',
          }}
        >
          {label}
        </span>
        <span
          className="text-[12px] tabular-nums"
          style={{
            color: 'var(--ink-soft)',
            fontFamily: 'var(--mono)',
          }}
        >
          {value.toFixed(1)}
        </span>
      </div>
      <div
        className="mt-1.5 h-[3px] w-full overflow-hidden rounded-full"
        style={{ background: 'var(--rule-2)' }}
      >
        <div
          className="h-full rounded-full"
          style={{
            width: `${pct}%`,
            background: 'var(--accent)',
            boxShadow: '0 0 12px var(--accent-soft)',
          }}
        />
      </div>
    </div>
  );
}

function BigStars({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(5, value));
  const full = Math.floor(clamped);
  const hasHalf = clamped - full >= 0.25 && clamped - full < 0.75;
  const filledCount = clamped - full >= 0.75 ? full + 1 : full;
  return (
    <div className="flex items-center gap-1">
      {[0, 1, 2, 3, 4].map((i) => {
        if (i < filledCount) {
          return (
            <Star
              key={i}
              className="h-4 w-4"
              style={{ color: 'var(--accent)', fill: 'var(--accent)' }}
            />
          );
        }
        if (i === filledCount && hasHalf) {
          return (
            <span
              key={i}
              className="relative inline-flex"
              style={{ width: 16, height: 16 }}
            >
              <Star
                className="absolute inset-0 h-4 w-4"
                style={{ color: 'var(--rule)' }}
              />
              <span
                className="absolute inset-0 overflow-hidden"
                style={{ width: '50%' }}
              >
                <Star
                  className="h-4 w-4"
                  style={{
                    color: 'var(--accent)',
                    fill: 'var(--accent)',
                  }}
                />
              </span>
            </span>
          );
        }
        return (
          <Star
            key={i}
            className="h-4 w-4"
            style={{ color: 'var(--rule)' }}
          />
        );
      })}
    </div>
  );
}
