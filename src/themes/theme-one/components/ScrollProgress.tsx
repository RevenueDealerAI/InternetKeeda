"use client";

import { useEffect, useRef } from "react";

/** Thin red-gradient bar fixed at the top of the viewport tracking page
 * scroll. Previously used framer-motion's useScroll + useSpring; that
 * pulled framer-motion into the layout shared chunk for every page.
 * Vanilla DOM + transform: scaleX is identical in feel and ships zero
 * runtime JS into the shared bundle. */
export const ScrollProgress = () => {
  const ref = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let raf = 0;
    const update = () => {
      raf = 0;
      const el = ref.current;
      if (!el) return;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const frac = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      el.style.transform = `scaleX(${frac.toFixed(4)})`;
    };
    update();
    const onScroll = () => {
      if (!raf) raf = requestAnimationFrame(update);
    };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  return (
    <div
      ref={ref}
      aria-hidden
      style={{ transformOrigin: "0% 50%", transform: "scaleX(0)" }}
      className="pointer-events-none fixed top-0 left-0 right-0 z-[70] h-[2px] bg-gradient-to-r from-red-600 via-red-500 to-red-700 motion-reduce:hidden"
    />
  );
};
