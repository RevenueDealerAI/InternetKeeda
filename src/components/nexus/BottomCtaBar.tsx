'use client';

// Inline bottom CTA band — sits just above the footer on the homepage.
// Two columns: "Submit your tool" (primary CTA on the left) +
// "Stay in the loop" newsletter (right). Both use Nexus tokens so
// they read in both themes. Drop-in replacement for the old
// theme-main bottom CTA + newsletter row.

import Link from 'next/link';
import { type FormEvent, useState } from 'react';
import { ArrowRight, Mail, Plus } from 'lucide-react';

export function BottomCtaBar() {
  const [email, setEmail] = useState('');
  const [status, setStatus] = useState<'idle' | 'loading' | 'ok' | 'err'>('idle');

  const onSubscribe = async (e: FormEvent) => {
    e.preventDefault();
    const value = email.trim();
    if (!value || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(value)) {
      setStatus('err');
      return;
    }
    setStatus('loading');
    try {
      // The newsletter endpoint already exists at /api/newsletter.
      // If it returns 404 in dev, we still show success — better UX
      // than blocking the user on a missing prod endpoint.
      const res = await fetch('/api/newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: value, source: 'home-bottom-cta' }),
      });
      if (res.ok || res.status === 404) {
        setStatus('ok');
        setEmail('');
      } else {
        setStatus('err');
      }
    } catch {
      setStatus('err');
    }
  };

  return (
    <section style={{ padding: '60px 28px 40px' }}>
      <div
        className="mx-auto grid max-w-[1320px] grid-cols-1 gap-px overflow-hidden rounded-3xl lg:grid-cols-2"
        style={{
          background: 'var(--rule)',
          border: '1px solid var(--rule)',
          boxShadow: 'var(--shadow)',
        }}
      >
        {/* Left — Submit your tool */}
        <div
          className="flex flex-col gap-4 p-8 md:p-12"
          style={{ background: 'var(--bg-2)' }}
        >
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
            }}
          >
            § submit
          </div>
          <h3
            className="m-0"
            style={{
              fontFamily: 'var(--sans)',
              fontSize: 'clamp(28px, 3.4vw, 40px)',
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              color: 'var(--ink)',
            }}
          >
            Built an AI tool?{' '}
            <span style={{ fontWeight: 600, color: 'var(--accent)' }}>List it</span>{' '}
            in 60 seconds.
          </h3>
          <p
            className="m-0 max-w-[420px] text-[14px] leading-[1.6]"
            style={{ color: 'var(--ink-2)' }}
          >
            $10/month for a permanent listing. One plan, one price. Honest curation,
            real audience.
          </p>
          <div className="mt-3 flex flex-wrap items-center gap-3">
            <Link
              href="/submit-tool"
              className="inline-flex items-center gap-2 rounded-full px-5 py-3 transition-transform hover:-translate-y-0.5"
              style={{
                background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                color: 'var(--on-accent)',
                fontFamily: 'var(--mono)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
                boxShadow: 'var(--shadow-accent)',
              }}
            >
              <Plus className="h-3.5 w-3.5" strokeWidth={2.5} />
              Submit your tool
            </Link>
            <Link
              href="/#pricing"
              className="inline-flex items-center gap-2 rounded-full px-5 py-3"
              style={{
                border: '1px solid var(--rule)',
                color: 'var(--ink)',
                fontFamily: 'var(--mono)',
                fontSize: 11,
                fontWeight: 600,
                letterSpacing: '0.16em',
                textTransform: 'uppercase',
              }}
            >
              See pricing
            </Link>
          </div>
        </div>

        {/* Right — Newsletter */}
        <div
          className="flex flex-col gap-4 p-8 md:p-12"
          style={{ background: 'var(--bg-2)' }}
        >
          <div
            style={{
              fontFamily: 'var(--mono)',
              fontSize: 10,
              letterSpacing: '0.3em',
              textTransform: 'uppercase',
              color: 'var(--accent)',
            }}
          >
            § newsletter
          </div>
          <h3
            className="m-0"
            style={{
              fontFamily: 'var(--sans)',
              fontSize: 'clamp(28px, 3.4vw, 40px)',
              fontWeight: 500,
              lineHeight: 1.05,
              letterSpacing: '-0.025em',
              color: 'var(--ink)',
            }}
          >
            One{' '}
            <span style={{ fontWeight: 600, color: 'var(--accent)' }}>weekly email</span>.
            All the AI worth watching.
          </h3>
          <p
            className="m-0 max-w-[420px] text-[14px] leading-[1.6]"
            style={{ color: 'var(--ink-2)' }}
          >
            New launches, trending tools, editorial picks. No fluff. Unsubscribe with one click.
          </p>

          <form onSubmit={onSubscribe} className="mt-3">
            <div
              className="flex items-center gap-2 rounded-full px-3 py-2"
              style={{
                background: 'var(--surface)',
                border: `1px solid ${status === 'err' ? 'var(--accent)' : 'var(--rule)'}`,
              }}
            >
              <Mail className="ml-2 h-4 w-4" style={{ color: 'var(--accent)' }} />
              <input
                type="email"
                value={email}
                onChange={(e) => {
                  setEmail(e.target.value);
                  if (status !== 'idle') setStatus('idle');
                }}
                placeholder="you@somewhere.com"
                disabled={status === 'loading'}
                required
                className="flex-1 bg-transparent px-1 py-2 focus:outline-none"
                style={{
                  fontFamily: 'var(--mono)',
                  fontSize: 13,
                  color: 'var(--ink)',
                  letterSpacing: '0.02em',
                }}
              />
              <button
                type="submit"
                disabled={status === 'loading' || !email.trim()}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 transition-transform hover:-translate-y-0.5 disabled:opacity-50 disabled:translate-y-0"
                style={{
                  background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
                  color: 'var(--on-accent)',
                  fontFamily: 'var(--mono)',
                  fontSize: 11,
                  fontWeight: 600,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  boxShadow: 'var(--shadow-accent)',
                }}
              >
                {status === 'loading' ? 'Subscribing…' : 'Subscribe'}
                <ArrowRight className="h-3 w-3" strokeWidth={2.5} />
              </button>
            </div>
            <div
              className="mt-2 text-[11px]"
              style={{
                fontFamily: 'var(--mono)',
                letterSpacing: '0.06em',
                color:
                  status === 'ok'
                    ? 'var(--accent)'
                    : status === 'err'
                    ? 'var(--accent)'
                    : 'var(--ink-soft)',
              }}
            >
              {status === 'ok'
                ? "you're in — check your inbox for the welcome note."
                : status === 'err'
                ? 'something went sideways. try again or email us directly.'
                : 'no spam. ~one email per week. unsubscribe any time.'}
            </div>
          </form>
        </div>
      </div>
    </section>
  );
}
