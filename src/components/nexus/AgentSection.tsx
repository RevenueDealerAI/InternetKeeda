'use client';

import { ArrowRight, Brain, Database, Share2 } from 'lucide-react';
import { NeuralCanvas } from './NeuralCanvas';

const BULLETS = [
  {
    icon: Brain,
    title: 'Multi-tool reasoning',
    body:
      'Ask once. Riley routes the question across thousands of indexed tools and assembles the stack that actually fits the task.',
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
      style={{ padding: '200px 28px' }}
    >
      <div className="mx-auto max-w-[1320px] grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
        {/* Left — copy + bullets + single CTA */}
        <div>
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 12,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
            }}
          >
            § 02 — riley · the concierge
          </div>
          <h2
            className="m-0 mt-5"
            style={{
              fontFamily: 'var(--sans)',
              fontSize: 'clamp(54px, 7.4vw, 104px)',
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: '-0.034em',
              color: 'var(--ink)',
            }}
          >
            Ask once. Get a{' '}
            <span style={{ fontWeight: 600, color: 'var(--accent)' }}>whole stack</span>
            , not ten tabs.
          </h2>
          <p
            className="mt-7 max-w-[560px] text-[20px] leading-[1.55]"
            style={{ color: 'var(--ink-2)' }}
          >
            Riley is your concierge for the AI internet. Tell Riley what you&apos;re
            trying to ship, ask where pricing lives, or get walked to the right
            section — you get ranked tools, cited sources, and the next place to go.
          </p>

          <ul className="m-0 mt-12 grid list-none gap-8 p-0">
            {BULLETS.map((b) => {
              const Icon = b.icon;
              return (
                <li key={b.title} className="flex items-start gap-5">
                  <span
                    aria-hidden="true"
                    className="grid h-14 w-14 shrink-0 place-items-center rounded-xl"
                    style={{
                      background: 'var(--accent-soft)',
                      border: '1px solid var(--rule)',
                      color: 'var(--accent)',
                    }}
                  >
                    <Icon className="h-6 w-6" strokeWidth={2.2} />
                  </span>
                  <div>
                    <div
                      className="text-[20px] font-semibold"
                      style={{ color: 'var(--ink)', letterSpacing: '-0.01em' }}
                    >
                      {b.title}
                    </div>
                    <p
                      className="m-0 mt-1.5 text-[16px] leading-[1.55]"
                      style={{ color: 'var(--ink-soft)' }}
                    >
                      {b.body}
                    </p>
                  </div>
                </li>
              );
            })}
          </ul>

          <div className="mt-12 flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => window.dispatchEvent(new Event('ik:open-chat'))}
              className="inline-flex items-center gap-2.5 rounded-full px-9 py-5 text-[13px] font-semibold uppercase tracking-[0.18em] transition-transform hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                color: 'var(--on-accent)',
                boxShadow: 'var(--shadow-accent)',
                fontFamily: 'var(--mono)',
              }}
            >
              Try Riley <ArrowRight className="h-4 w-4" strokeWidth={2.5} />
            </button>

            <a
              href="https://wa.me/internetkeeda"
              target="_blank"
              rel="noopener noreferrer"
              aria-label="Connect with us on WhatsApp"
              className="inline-flex items-center gap-2.5 rounded-full px-9 py-5 text-[13px] font-semibold uppercase tracking-[0.18em] transition-transform hover:-translate-y-0.5"
              style={{
                background: '#25D366',
                color: '#fff',
                boxShadow: '0 14px 32px -10px rgba(37,211,102,0.55)',
                fontFamily: 'var(--mono)',
              }}
            >
              <svg
                aria-hidden="true"
                viewBox="0 0 24 24"
                width="18"
                height="18"
                fill="currentColor"
              >
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347zM12.05 21.785h-.004A9.87 9.87 0 016.96 20.42l-.365-.218-3.78.99 1.01-3.68-.238-.378a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.889-9.884a9.825 9.825 0 016.992 2.898 9.825 9.825 0 012.892 6.99c-.002 5.45-4.437 9.885-9.885 9.885zM20.52 3.449C18.24 1.245 15.24.044 12.045.044 5.46.044.103 5.398.1 11.987c0 2.096.547 4.142 1.588 5.945L0 24l6.215-1.63a11.943 11.943 0 005.83 1.485h.005c6.585 0 11.945-5.354 11.948-11.943 0-3.192-1.245-6.196-3.475-8.463z" />
              </svg>
              Connect on WhatsApp
            </a>
          </div>
        </div>

        {/* Right — bordered intel panel with denser neural canvas */}
        <div
          className="relative overflow-hidden rounded-2xl"
          style={{
            background: 'var(--bg-2)',
            border: '1px solid var(--rule)',
            boxShadow: 'var(--shadow)',
            minHeight: 820,
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
            riley · concierge
          </div>

          {/* Riley's face — centered hero portrait, focal point of
              the panel. Halo + accent ring + soft red glow underneath
              so it reads as the agent's presence, not a stock photo. */}
          <div
            className="pointer-events-none absolute inset-0 z-10 flex items-center justify-center"
            aria-hidden="true"
          >
            <div className="relative flex flex-col items-center">
              {/* Glow halo behind the portrait */}
              <div
                style={{
                  position: 'absolute',
                  inset: '-56px',
                  borderRadius: '9999px',
                  background:
                    'radial-gradient(circle, rgba(255,59,59,0.40) 0%, rgba(255,59,59,0.14) 42%, transparent 72%)',
                  filter: 'blur(14px)',
                  zIndex: -1,
                }}
              />
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src="/branding/riley.jpg"
                alt=""
                width={420}
                height={420}
                className="rounded-full"
                style={{
                  width: 'clamp(280px, 36vw, 440px)',
                  height: 'clamp(280px, 36vw, 440px)',
                  objectFit: 'cover',
                  border: '4px solid var(--accent)',
                  boxShadow: 'var(--shadow-accent), 0 40px 120px -24px rgba(255,59,59,0.55)',
                }}
              />
              <div
                className="mt-5 flex items-center gap-2 rounded-full px-3.5 py-1.5"
                style={{
                  background: 'rgba(0,0,0,0.55)',
                  border: '1px solid var(--rule)',
                  backdropFilter: 'blur(8px)',
                }}
              >
                <span
                  className="ik-pulse-dot inline-block h-1.5 w-1.5 rounded-full"
                  style={{ background: '#5ed7ff', boxShadow: '0 0 10px #5ed7ff' }}
                />
                <span
                  style={{
                    fontFamily: 'var(--mono)',
                    fontSize: 10,
                    letterSpacing: '0.24em',
                    textTransform: 'uppercase',
                    color: '#f4f3f0',
                  }}
                >
                  riley · online
                </span>
              </div>
            </div>
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
