"use client";

/**
 * Page-level fade + 8px translate on App Router route changes.
 *
 * - Outgoing: opacity 1→0, y 0→-8px, 200ms ease-in
 * - Incoming: opacity 0→1, y 8px→0, 300ms ease-out
 * - mode="wait" keeps the exit + enter sequential, so we never see a
 *   layout-shift from two stacked page trees at once.
 * - Keyed on `usePathname()` only. Query-param-only changes (filter
 *   updates, search params) and in-page anchor jumps (#tool-grid) keep
 *   the same pathname → no transition replays.
 * - `prefers-reduced-motion` → instant navigation, no transition.
 */

import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <>{children}</>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname ?? "/"}
        initial={{ opacity: 0, y: 8 }}
        animate={{
          opacity: 1,
          y: 0,
          transition: { duration: 0.3, ease: "easeOut" },
        }}
        exit={{
          opacity: 0,
          y: -8,
          transition: { duration: 0.2, ease: "easeIn" },
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
