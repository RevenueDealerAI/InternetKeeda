"use client";

import { useEffect } from "react";

/**
 * Attaches an IntersectionObserver to every `.card-reveal` element on
 * the page and toggles `.in-view` when each enters the viewport. The
 * CSS in src/index.css handles the actual fade-up; this hook is just
 * the trigger. Each card is unobserved after its first entry so
 * scrolling back up doesn't replay the animation.
 *
 * Pass a dependency array when the grid contents can change at runtime
 * (filter, search, load-more) so the observer reattaches to newly
 * mounted cards. Without it, late-arriving cards would stay hidden.
 *
 * Reduced-motion users skip the observer entirely — every card is
 * marked in-view on mount so they appear in their final state.
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

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("in-view");
            observer.unobserve(entry.target);
          }
        });
      },
      { rootMargin: "0px 0px -50px 0px", threshold: 0.1 }
    );

    const cards = document.querySelectorAll(".card-reveal:not(.in-view)");
    cards.forEach((card) => observer.observe(card));

    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, deps);
}
