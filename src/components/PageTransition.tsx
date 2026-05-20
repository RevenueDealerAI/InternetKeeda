"use client";

/**
 * Page-level fade-up on App Router route changes.
 *
 * Previously used framer-motion's AnimatePresence + motion.div for a
 * fade-out + fade-in handoff. Sat in the root layout, which dragged
 * framer-motion into the shared chunk for every route — adding
 * ~2.8 s of mobile scripting time on cold loads per Lighthouse.
 *
 * The new approach: CSS-keyframe fade-up on the incoming page only,
 * re-triggered by `key={pathname}` so React remounts on route change.
 * The exit transition is sacrificed; the trade is a few ms of visual
 * polish vs. seconds of mobile load time.
 *
 * prefers-reduced-motion users skip the animation entirely.
 */

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

export function PageTransition({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  return (
    <div
      key={pathname ?? "/"}
      className="page-transition"
    >
      {children}
    </div>
  );
}
