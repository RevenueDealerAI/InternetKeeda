'use client';

import { ArrowRight, Brain, Database, Share2 } from 'lucide-react';
import { NeuralCanvas } from './NeuralCanvas';

const BULLETS = [
  {
    icon: Brain,
    title: 'Multi-tool reasoning',
    body:
      'Ask once. Keeda routes the question across thousands of indexed tools and assembles the stack that actually fits the task.',
  },
  {
    icon: Database,
    title: 'Real-time citations',
    body:
      'Every suggestion shows its source — tool name, category, pricing, and the exact reason it landed in your answer.',
  },
  {
    icon: Share2,
    title: 'Save & share stacks',
    body:
      'Pin a stack to your dashboard, share a link with your team, or export it as a Notion-ready bundle.',
  },
];

export function AgentSection() {
  return (
    <section
      id="agent"
      className="relative"
      style={{ padding: '120px 28px' }}
    >
      <div className="mx-auto max-w-[1320px] grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
        {/* Left — copy + bullets + single CTA */}
        <div>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
            }}
          >
            § 02 — ai keeda · the agent
          </div>
          <h2
            className="m-0 mt-4"
            style={{
              fontFamily: 'var(--sans)',
              fontSize: 'clamp(36px, 5vw, 64px)',
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: '-0.028em',
              color: 'var(--ink)',
            }}
          >
            Ask once. Get a{' '}
            <span style={{ fontWeight: 600, color: 'var(--accent)' }}>whole stack</span>
            , not ten tabs.
          </h2>
          <p
            className="mt-5 max-w-[520px] text-[16px] leading-[1.6]"
            style={{ color: 'var(--ink-2)' }}
          >
            Keeda is the conversational index for the AI internet. Tell it what you&apos;re
            trying to ship; it returns the toolchain — ranked, cited, and ready to copy.
          </p>

          <ul className="m-0 mt-10 grid list-none gap-6 p-0">
            {BULLETS.map((b) => {
              const Icon = b.icon;
              return (
                <li key={b.title} className="flex items-start gap-4">
                  <span
                    aria-hidden="true"
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-lg"
                    style={{
                      background: 'var(--accent-soft)',
                      border: '1px solid var(--rule)',
                      color: 'var(--accent)',
                    }}
                  >
                    <Icon className="h-4 w-4" strokeWidth={2.2} />
                  </span>
                  <div>
                    <div
                      className="text-[15px] font-semibold"
                      style={{ color: 'var(--ink)' }}
                    >
                      {b.title}
                    </div>
                    <p
                      className="m-0 mt-1 text-[14px] leading-[1.55]"
                      style={{ color: 'var(--ink-soft)' }}
                    >
                      {b.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <button
            type="button"
            onClick={() => window.dispatchEvent(new Event('ik:open-eli'))}
            className="mt-10 inline-flex items-center gap-2 rounded-full px-6 py-3.5 text-[11px] font-semibold uppercase tracking-[0.18em] transition-transform hover:-translate-y-0.5"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              color: 'var(--on-accent)',
              boxShadow: 'var(--shadow-accent)',
              fontFamily: 'var(--mono)',
            }}
          >
            Try AI Keeda <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
          </button>
        </div>

        {/* Right — bordered intel panel with denser neural canvas */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--rule)',
            boxShadow: 'var(--shadow)',
            minHeight: 480,
          }}
        >
          <NeuralCanvas
            density={0.0004}
            maxDist={110}
            speed={0.32}
            interactive
            style={{ zIndex: 0 }}
          />

          {/* HUD overlay — corner brackets + scan lines */}
          <CornerBrackets />

          {/* HUD label */}
          <div
            className="absolute left-5 top-5 z-10 inline-flex items-center gap-2 rounded-full px-3 py-1.5"
            style={{
              background: 'rgba(0,0,0,0.45)',
              border: '1px solid var(--rule)',
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.24em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
            }}
          >
            <span
              className="ik-pulse-dot inline-block h-1.5 w-1.5 rounded-full"
              style={{ background: 'var(--accent)' }}
              aria-hidden="true"
            />
            keeda · agent
          </div>

          {/* HUD readout — bottom-left */}
          <div
            className="absolute bottom-5 left-5 z-10 max-w-[360px]"
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 11,
              color: 'var(--ink-2)',
              lineHeight: 1.5,
            }}
          >
            <div style={{ color: 'var(--accent)' }}>&gt; query:</div>
            <div style={{ color: 'var(--ink)' }}>
              best stack to ship a one-person ai newsletter in a weekend
            </div>
            <div className="mt-3" style={{ color: 'var(--ink-soft)' }}>
              routing across 5,247 tools across 42 categories…
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function CornerBrackets() {
  const arm = 18;
  const off = 14;
  const common: React.CSSProperties = {
    position: 'absolute',
    width: arm,
    height: arm,
    pointerEvents: 'none',
    zIndex: 5,
  };
  const stroke = 'var(--accent)';
  return (
    <>
      {/* TL */}
      <div
        style={{
          ...common,
          top: off,
          left: off,
          borderTop: `1px solid ${stroke}`,
          borderLeft: `1px solid ${stroke}`,
        }}
      />
      {/* TR */}
      <div
        style={{
          ...common,
          top: off,
          right: off,
          borderTop: `1px solid ${stroke}`,
          borderRight: `1px solid ${stroke}`,
        }}
      />
      {/* BL */}
      <div
        style={{
          ...common,
          bottom: off,
          left: off,
          borderBottom: `1px solid ${stroke}`,
          borderLeft: `1px solid ${stroke}`,
        }}
      />
      {/* BR */}
      <div
        style={{
          ...common,
          bottom: off,
          right: off,
          borderBottom: `1px solid ${stroke}`,
          borderRight: `1px solid ${stroke}`,
        }}
      />
    </>
  );
}
