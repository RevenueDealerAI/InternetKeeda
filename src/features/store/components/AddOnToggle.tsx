'use client';

import { motion } from 'framer-motion';
import { Check } from 'lucide-react';
import { formatPrice } from '../lib/pricing';
import type { StoreAddOn } from '../lib/addons';
import type { StoreCurrency } from '../config';

/**
 * One row in the add-ons list inside <CheckoutCard />. Clicking the
 * whole tile toggles it; clicking the checkbox toggles it. Highlight
 * variant is the upsell — slightly bigger, accent border, description
 * always visible.
 */
export function AddOnToggle({
  addon,
  currency,
  on,
  onToggle,
}: {
  addon: StoreAddOn;
  currency: StoreCurrency;
  on: boolean;
  onToggle: () => void;
}) {
  const isHighlight = !!addon.highlight;
  const price =
    currency === 'INR' ? addon.priceInrMinor : addon.priceUsdMinor;
  return (
    <motion.button
      type="button"
      onClick={onToggle}
      aria-pressed={on}
      whileHover={{ y: -1 }}
      whileTap={{ scale: 0.985 }}
      transition={{ duration: 0.18, ease: 'easeOut' }}
      className="relative flex w-full items-start gap-3.5 rounded-2xl p-4 text-left transition-colors"
      style={{
        background: on
          ? 'var(--accent-soft)'
          : isHighlight
            ? 'linear-gradient(135deg, rgba(255,59,59,0.07) 0%, transparent 80%), var(--bg-2)'
            : 'var(--bg-2)',
        border: on
          ? '1px solid var(--accent)'
          : isHighlight
            ? '1px solid rgba(255,59,59,0.35)'
            : '1px solid var(--rule)',
        boxShadow: on ? '0 0 0 3px var(--accent-soft)' : 'none',
      }}
    >
      {/* checkbox */}
      <motion.span
        className="mt-0.5 grid h-5 w-5 shrink-0 place-items-center rounded-md"
        animate={{
          background: on ? 'var(--accent)' : 'transparent',
          borderColor: on ? 'var(--accent)' : 'var(--rule)',
        }}
        transition={{ duration: 0.18 }}
        style={{ border: '1.5px solid var(--rule)' }}
      >
        <motion.span
          initial={false}
          animate={{ scale: on ? 1 : 0, opacity: on ? 1 : 0 }}
          transition={{ duration: 0.18, ease: 'backOut' }}
          style={{ display: 'inline-flex', color: 'var(--on-accent)' }}
        >
          <Check className="h-3.5 w-3.5" strokeWidth={3.5} />
        </motion.span>
      </motion.span>

      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-baseline justify-between gap-2">
          <span
            className="text-[14px] font-semibold"
            style={{
              color: 'var(--ink)',
              letterSpacing: '-0.005em',
            }}
          >
            {addon.name}
            {isHighlight && (
              <span
                className="ml-2 inline-block rounded-full px-2 py-0.5 align-middle text-[9px] uppercase tracking-[0.22em]"
                style={{
                  background: 'var(--accent)',
                  color: 'var(--on-accent)',
                  fontFamily: 'var(--mono)',
                  fontWeight: 700,
                }}
              >
                Most picked
              </span>
            )}
          </span>
          <span
            className="text-[14px] tabular-nums font-semibold"
            style={{ color: 'var(--ink)' }}
          >
            +{formatPrice(price, currency)}
          </span>
        </div>
        <p
          className="m-0 mt-1.5 text-[12.5px] leading-[1.55]"
          style={{ color: 'var(--ink-2)' }}
        >
          {addon.description}
        </p>
      </div>
    </motion.button>
  );
}
