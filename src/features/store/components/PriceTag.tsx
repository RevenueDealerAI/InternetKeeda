'use client';

import { useState, useEffect } from 'react';
import type { StoreCurrency } from '../config';
import { formatPrice } from '../lib/pricing';

/**
 * USD / INR price toggle. Defaults to INR for `en-IN` locale,
 * USD otherwise. Persists user choice in localStorage so subsequent
 * product pages remember the preference.
 */
const LS_KEY = 'kl-currency';
const CURRENCY_EVENT = 'ik-store-currency-change';

/**
 * Shared currency hook. Each call to useStoreCurrency() owns its own
 * React state slot, so when one component (e.g. PriceTag) toggles the
 * currency, sibling components reading the same hook used to stay
 * stale. Fix: every set() publishes a window event; every instance
 * subscribes and re-renders. Cheap, no new deps.
 */
export function useStoreCurrency(): [StoreCurrency, (c: StoreCurrency) => void] {
  const [currency, setCurrency] = useState<StoreCurrency>('USD');
  useEffect(() => {
    const saved = localStorage.getItem(LS_KEY) as StoreCurrency | null;
    if (saved === 'INR' || saved === 'USD') {
      setCurrency(saved);
    } else if (
      typeof navigator !== 'undefined' &&
      /-IN\b/i.test(navigator.language)
    ) {
      setCurrency('INR');
    }
    const handler = (e: Event) => {
      const next = (e as CustomEvent<StoreCurrency>).detail;
      if (next === 'INR' || next === 'USD') setCurrency(next);
    };
    window.addEventListener(CURRENCY_EVENT, handler);
    return () => window.removeEventListener(CURRENCY_EVENT, handler);
  }, []);
  const set = (c: StoreCurrency) => {
    setCurrency(c);
    localStorage.setItem(LS_KEY, c);
    window.dispatchEvent(new CustomEvent(CURRENCY_EVENT, { detail: c }));
  };
  return [currency, set];
}

export function PriceTag({
  priceUsdMinor,
  priceInrMinor,
  size = 'md',
  showToggle = false,
}: {
  priceUsdMinor: number;
  priceInrMinor: number;
  size?: 'sm' | 'md' | 'lg';
  showToggle?: boolean;
}) {
  const [currency, setCurrency] = useStoreCurrency();
  const value = currency === 'INR' ? priceInrMinor : priceUsdMinor;
  const fontSize = size === 'lg' ? 38 : size === 'sm' ? 14 : 22;
  return (
    <div className="inline-flex items-baseline gap-3">
      <span
        className="tabular-nums font-semibold"
        style={{
          fontSize,
          color: 'var(--ink)',
          letterSpacing: '-0.02em',
          lineHeight: 1,
        }}
      >
        {formatPrice(value, currency)}
      </span>
      {showToggle && (
        <span
          className="inline-flex overflow-hidden rounded-full text-[10px] uppercase tracking-[0.18em]"
          style={{
            background: 'var(--surface)',
            border: '1px solid var(--rule)',
            fontFamily: 'var(--mono)',
          }}
        >
          {(['USD', 'INR'] as StoreCurrency[]).map((c) => {
            const active = c === currency;
            return (
              <button
                key={c}
                type="button"
                onClick={() => setCurrency(c)}
                className="px-2.5 py-1 transition-colors"
                style={{
                  background: active ? 'var(--accent)' : 'transparent',
                  color: active ? 'var(--on-accent)' : 'var(--ink-soft)',
                }}
              >
                {c}
              </button>
            );
          })}
        </span>
      )}
    </div>
  );
}
