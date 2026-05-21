"use client";

import { useEffect } from "react";

/**
 * Toggles `.in-view` on every `.card-reveal` element when it enters the
 * viewport. The CSS in src/index.css handles the actual fade-up; this
 * hook is just the trigger.
 *
 * Pass a dependency array when the grid contents can change at runtime
 * (filter, search, async data load, load-more) so the observer
 * reattaches to newly mounted cards.
 *
 * Two safety nets matter here — production hit a regression where
 * cards stayed at opacity:0 on the home grid after async data loaded:
 *
 *  1. requestAnimationFrame defers the IO setup one frame so React
 *     has finished committing the new cards to the DOM before
 *     querySelectorAll runs. Without it, the effect can fire on the
 *     same tick as the state update and miss late-arriving cards.
 *  2. A 2 s setTimeout failsafe force-marks any still-hidden cards
 *     `.in-view`. If the observer drops a card for any reason —
 *     browser quirk, layout race, conditional render — the user never
 *     sees a permanently invisible grid.
 *
 * Reduced-motion users skip both paths; every card is marked in-view
 * synchronously on mount.
 */
export function useInViewReveal(deps: unknown[] = []) {
  useEffect(() => {
    if (typeof window === "undefined") return;

    const prefersReduced = window.matchMedia(
      "(prefers-reduced-motion: reduce)"
    ).matches;
    if (prefersReduced) {
      document
        .querySelectorAll(".card-reveal")
        .forEach((el) => el.classList.add("in-view"));
      return;
    }

    let observer: IntersectionObserver | null = null;
    let failsafe: ReturnType<typeof setTimeout> | null = null;

    const raf = requestAnimationFrame(() => {
      observer = new IntersectionObserver(
        (entries) => {
          entries.forEach((entry) => {
            if (entry.isIntersecting) {
              entry.target.classList.add("in-view");
              observer?.unobserve(entry.target);
            }
          });
        },
        { rootMargin: "0px 0px -50px 0px", threshold: 0.1 }
      );

      const cards = document.querySelectorAll(".card-reveal:not(.in-view)");
      cards.forEach((card) => observer!.observe(card));

      failsafe = setTimeout(() => {
        document
          .querySelectorAll(".card-reveal:not(.in-view)")
          .forEach((el) => el.classList.add("in-view"));
      }, 2000);
    });

    return () => {
      cancelAnimationFrame(raf);
      observer?.disconnect();
      if (failsafe) clearTimeout(failsafe);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
