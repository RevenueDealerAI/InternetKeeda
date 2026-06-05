'use client';

import { useEffect } from 'react';
import { useMotionValue, useSpring, useTransform, motion } from 'framer-motion';
import { formatPrice } from '../lib/pricing';
import type { StoreCurrency } from '../config';

/**
 * Smoothly tweens between two integer minor-unit values and renders
 * the formatted price. Used for the live "Total" line in the
 * checkout card. Snappy spring — never overshoots, ~250-350ms feel.
 */
export function AnimatedTotal({
  value,
  currency,
  size = 'lg',
}: {
  value: number;
  currency: StoreCurrency;
  size?: 'sm' | 'md' | 'lg';
}) {
  const mv = useMotionValue(value);
  const spring = useSpring(mv, {
    stiffness: 200,
    damping: 28,
    mass: 0.8,
  });
  const text = useTransform(spring, (v) => formatPrice(Math.round(v), currency));

  useEffect(() => {
    mv.set(value);
  }, [value, mv]);

  const fontSize = size === 'lg' ? 32 : size === 'md' ? 20 : 14;
  return (
    <motion.span
      className="tabular-nums font-semibold"
      style={{
        fontSize,
        color: 'var(--ink)',
        letterSpacing: '-0.025em',
        lineHeight: 1,
      }}
    >
      {text}
    </motion.span>
  );
}
