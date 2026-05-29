'use client';

// Shared legal-page chrome — eyebrow, title, last-updated, ToC,
// content slot. Used by Privacy / Terms / Refund / About so all
// the legal copy reads with the same look + the Nexus tokens
// instead of hardcoded gray-900 / bg-white.

import type { ReactNode } from 'react';
import { BRAND } from '@/lib/brand';

export type LegalSection = {
  id: string;
  heading: string;
  body: ReactNode;
};

export function LegalPage({
  eyebrow,
  title,
  lastUpdated,
  intro,
  sections,
}: {
  eyebrow: string;
  title: string;
  lastUpdated: string;
  intro?: ReactNode;
  sections: LegalSection[];
}) {
  return (
    <main
      className="relative"
      style={{ background: 'var(--bg)', color: 'var(--ink)', paddingTop: 120, paddingBottom: 80 }}
    >
      <div className="mx-auto max-w-[1080px] px-7">
        {/* Header */}
        <div
          className="text-[11px] uppercase tracking-[0.3em]"
          style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}
        >
          {eyebrow}
        </div>
        <h1
          className="m-0 mt-4"
          style={{
            fontFamily: 'var(--sans)',
            fontSize: 'clamp(40px, 6vw, 72px)',
            fontWeight: 500,
            lineHeight: 1.02,
            letterSpacing: '-0.03em',
            color: 'var(--ink)',
          }}
        >
          {title}
        </h1>
        <div
          className="mt-4 text-[12px] uppercase tracking-[0.22em]"
          style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
        >
          Last updated · {lastUpdated} · Operator {BRAND.legalEntity}
        </div>

        {intro && (
          <div
            className="mt-9 max-w-[760px] text-[16px] leading-[1.7]"
            style={{ color: 'var(--ink-2)' }}
          >
            {intro}
          </div>
        )}

        {/* Two-column body — ToC on the left, content on the right. */}
        <div className="mt-14 grid grid-cols-1 gap-10 lg:grid-cols-[260px_1fr]">
          <nav
            aria-label="Section navigation"
            className="hidden lg:block"
            style={{ position: 'sticky', top: 100, alignSelf: 'start' }}
          >
            <div
              className="mb-3 text-[10px] uppercase tracking-[0.25em]"
              style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
            >
              On this page
            </div>
            <ul className="m-0 list-none p-0">
              {sections.map((s, i) => (
                <li key={s.id} className="m-0 list-none">
                  <a
                    href={`#${s.id}`}
                    className="block rounded-md py-2 pl-3 text-[13px] transition-colors"
                    style={{
                      color: 'var(--ink-2)',
                      borderLeft: '2px solid var(--rule)',
                    }}
                    onMouseEnter={(e) => {
                      (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
                      (e.currentTarget as HTMLElement).style.borderLeftColor = 'var(--accent)';
                    }}
                    onMouseLeave={(e) => {
                      (e.currentTarget as HTMLElement).style.color = 'var(--ink-2)';
                      (e.currentTarget as HTMLElement).style.borderLeftColor = 'var(--rule)';
                    }}
                  >
                    <span
                      className="mr-2"
                      style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
                    >
                      §{String(i + 1).padStart(2, '0')}
                    </span>
                    {s.heading}
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="flex flex-col gap-10">
            {sections.map((s, i) => (
              <section key={s.id} id={s.id} className="scroll-mt-28">
                <div
                  className="text-[10px] uppercase tracking-[0.3em]"
                  style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}
                >
                  § {String(i + 1).padStart(2, '0')}
                </div>
                <h2
                  className="m-0 mt-2"
                  style={{
                    fontFamily: 'var(--sans)',
                    fontSize: 28,
                    fontWeight: 500,
                    lineHeight: 1.15,
                    letterSpacing: '-0.018em',
                    color: 'var(--ink)',
                  }}
                >
                  {s.heading}
                </h2>
                <div
                  className="mt-4 text-[15px] leading-[1.7]"
                  style={{ color: 'var(--ink-2)' }}
                >
                  {s.body}
                </div>
              </section>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
