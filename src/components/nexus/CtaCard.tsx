'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { NeuralCanvas } from './NeuralCanvas';

export function CtaCard() {
  return (
    <section style={{ padding: '60px 28px 100px' }}>
      <div
        className="relative mx-auto max-w-[1320px] overflow-hidden rounded-3xl"
        style={{
          background: 'var(--hero-bg)',
          border: '1px solid var(--rule)',
          boxShadow: 'var(--shadow)',
          color: '#f4f3f0',
        }}
      >
        <NeuralCanvas
          density={0.00018}
          maxDist={140}
          speed={0.24}
          interactive={false}
          style={{ zIndex: 0 }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute"
          style={{
            top: '-200px',
            right: '-200px',
            width: '500px',
            height: '500px',
            borderRadius: '9999px',
            background:
              'radial-gradient(circle, rgba(255,59,59,0.28), transparent 60%)',
            zIndex: 1,
          }}
        />

        <div className="relative z-10 px-7 py-20 text-center">
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
            }}
          >
            § list your tool
          </div>
          <h2
            className="m-0 mx-auto mt-4 max-w-[840px]"
            style={{
              fontFamily: 'var(--sans)',
              fontSize: 'clamp(40px, 6vw, 80px)',
              fontWeight: 500,
              lineHeight: 1,
              letterSpacing: '-0.03em',
              color: '#f4f3f0',
            }}
          >
            List your tool.{' '}
            <span
              style={{
                fontFamily: 'var(--serif)',
                fontStyle: 'italic',
                fontWeight: 400,
                color: 'var(--accent)',
              }}
            >
              Get
            </span>{' '}
            seen.
          </h2>
          <p
            className="mx-auto mt-5 max-w-[540px] text-[16px] leading-[1.6]"
            style={{ color: 'rgba(244,243,240,0.75)' }}
          >
            Submit once. Stay in the index for $10/month. Boost when you need a spike. Pricing
            anchored in USD, payments worldwide.
          </p>
          <div className="mt-9 flex flex-wrap items-center justify-center gap-3">
            <Link
              href="/submit-tool"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3.5 transition-transform hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                color: 'var(--on-accent)',
                fontFamily: 'var(--mono)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
                boxShadow: 'var(--shadow-accent)',
              }}
            >
              Submit your tool <ArrowRight className="h-3.5 w-3.5" strokeWidth={2.5} />
            </Link>
            <Link
              href="#pricing"
              className="inline-flex items-center gap-2 rounded-full px-6 py-3.5"
              style={{
                border: '1px solid rgba(255,255,255,0.16)',
                color: '#f4f3f0',
                fontFamily: 'var(--mono)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.18em',
                textTransform: 'uppercase',
              }}
            >
              See pricing
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
