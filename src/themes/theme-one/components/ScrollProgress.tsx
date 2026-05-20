"use client";

import { motion, useScroll, useSpring, useReducedMotion } from "framer-motion";

/** Thin orange→violet gradient bar at the very top of the viewport that
 * tracks page scroll. Sits above the sticky header (z-[70]). Hidden when
 * the user prefers reduced motion. */
export const ScrollProgress = () => {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 140,
    damping: 24,
    mass: 0.3,
  });
  const reduceMotion = useReducedMotion();

  if (reduceMotion) return null;

  return (
    <motion.div
      aria-hidden
      style={{ scaleX, transformOrigin: "0% 50%" }}
      className="pointer-events-none fixed top-0 left-0 right-0 z-[70] h-[2px] bg-gradient-to-r from-orange-500 via-rose-500 to-violet-500"
    />
  );
};
