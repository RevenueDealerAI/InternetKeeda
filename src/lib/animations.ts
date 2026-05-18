/**
 * Shared framer-motion animation helpers for tool-card grids.
 *
 * Tier 1b — grid stagger fade-in.
 *
 * Behavior:
 *   - Each card fades in (opacity 0 → 1, y 20 → 0) when its viewport
 *     intersection fires for the first time. viewport.once = true ensures
 *     it never replays (so existing cards don't re-animate when a filter
 *     adds new siblings or pagination appends a fresh batch).
 *   - The per-card delay is computed as (index % chunkSize) * 60ms, which
 *     produces a left-to-right cascade across each visible chunk (~12
 *     cards = one row of the 3-col desktop grid × 4 rows). A "load more"
 *     batch picks the same cascade because its indices restart the mod
 *     pattern.
 *   - prefers-reduced-motion users get no animation — cards render at
 *     their final state synchronously.
 *
 * Usage:
 *   import { useReducedMotion } from 'framer-motion';
 *   import { staggerCardProps } from '@/lib/animations';
 *
 *   const reduce = useReducedMotion();
 *
 *   {tools.map((tool, idx) => (
 *     <motion.div key={tool.id} {...staggerCardProps(idx, reduce)}>
 *       …card…
 *     </motion.div>
 *   ))}
 */

import type { MotionProps } from 'framer-motion';

const DEFAULT_CHUNK = 12; // ~4 rows × 3 cols on desktop
const STAGGER_STEP_MS = 60;
const DURATION_MS = 400;
const VIEWPORT_MARGIN = '-80px';

export function staggerCardProps(
  index: number,
  shouldReduceMotion: boolean | null,
  chunkSize: number = DEFAULT_CHUNK,
): MotionProps {
  if (shouldReduceMotion) {
    // Render in final state with no animation. `initial: false` skips the
    // mount transition entirely so reduced-motion users see no flicker.
    return { initial: false };
  }
  return {
    initial: { opacity: 0, y: 20 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: VIEWPORT_MARGIN },
    transition: {
      duration: DURATION_MS / 1000,
      ease: 'easeOut',
      delay: ((index % chunkSize) * STAGGER_STEP_MS) / 1000,
    },
  };
}

/**
 * For panels rendered inside an already-visible container (e.g. the AI-search
 * chat panel that flashes up over the hero), whileInView won't fire because
 * the panel's bounding box is computed before the children are positioned.
 * Use this variant — animates on mount instead of on viewport entry — for
 * recommendation lists or any grid that appears inside an open modal/popover.
 */
export function staggerCardPropsOnMount(
  index: number,
  shouldReduceMotion: boolean | null,
  chunkSize: number = DEFAULT_CHUNK,
): MotionProps {
  if (shouldReduceMotion) {
    return { initial: false };
  }
  return {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: {
      duration: DURATION_MS / 1000,
      ease: 'easeOut',
      delay: ((index % chunkSize) * STAGGER_STEP_MS) / 1000,
    },
  };
}
