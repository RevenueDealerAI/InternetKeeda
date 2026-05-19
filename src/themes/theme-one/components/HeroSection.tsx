"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReducedMotion } from "framer-motion";

interface HeroSectionProps {
  searchQuery?: string;
  setSearchQuery?: React.Dispatch<React.SetStateAction<string>>;
  setIsSearchOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  /** Kept for prop compatibility with the previous hero — unused in the new design. */
  siteDescription?: string;
  /** Semantic / AI search handler. Hero calls this on submit; parent owns
   * the loading + results state and renders matches in the grid below. */
  onAiSearch?: (query: string) => void | Promise<void>;
  /** Mirror of parent's aiLoading state — drives the Search button label
   * and disables interaction while GPT is processing. */
  aiLoading?: boolean;
}

const TRY_QUERIES = [
  "Image generation",
  "Code assistants",
  "Voice cloning",
  "Writing tools",
];

/** Tier 2 hero — dark, near-black, animated orange-tinted dot grid behind a
 * centered headline + search bar. Spec confirmed by user 2026-05-18. */
export const HeroSection = ({
  searchQuery: externalQuery,
  setSearchQuery: externalSetQuery,
  setIsSearchOpen,
  onAiSearch,
  aiLoading,
}: HeroSectionProps) => {
  // Local input mirrors the parent's searchQuery so chips can update the
  // visible value while the parent's grid filter only fires on submit.
  const [localQuery, setLocalQuery] = useState(externalQuery ?? "");
  useEffect(() => {
    if (externalQuery !== undefined) setLocalQuery(externalQuery);
  }, [externalQuery]);

  const reduceMotion = useReducedMotion();

  // Parallax target — translates the dot-grid backdrop a few px based on
  // cursor position. Disabled on touch devices and when reduced motion is on.
  const parallaxRef = useRef<HTMLDivElement>(null);
  const heroRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (reduceMotion) return;
    const isTouch =
      typeof window !== "undefined" &&
      window.matchMedia("(hover: none) and (pointer: coarse)").matches;
    if (isTouch) return;

    const hero = heroRef.current;
    const target = parallaxRef.current;
    if (!hero || !target) return;

    let raf = 0;
    let nextX = 0;
    let nextY = 0;
    let curX = 0;
    let curY = 0;

    const onMove = (e: MouseEvent) => {
      const rect = hero.getBoundingClientRect();
      const cx = rect.left + rect.width / 2;
      const cy = rect.top + rect.height / 2;
      // ±10px max translation, eased on actual write
      nextX = ((e.clientX - cx) / rect.width) * -10;
      nextY = ((e.clientY - cy) / rect.height) * -10;
      if (!raf) raf = requestAnimationFrame(tick);
    };

    const tick = () => {
      curX += (nextX - curX) * 0.08;
      curY += (nextY - curY) * 0.08;
      target.style.transform = `translate3d(${curX.toFixed(2)}px, ${curY.toFixed(2)}px, 0)`;
      if (Math.abs(nextX - curX) > 0.05 || Math.abs(nextY - curY) > 0.05) {
        raf = requestAnimationFrame(tick);
      } else {
        raf = 0;
      }
    };

    hero.addEventListener("mousemove", onMove);
    return () => {
      hero.removeEventListener("mousemove", onMove);
      if (raf) cancelAnimationFrame(raf);
    };
  }, [reduceMotion]);

  const scrollToGrid = useCallback(() => {
    if (typeof window === "undefined") return;
    const grid =
      document.getElementById("tool-grid") ??
      document.querySelector("[data-tool-grid]");
    if (grid instanceof HTMLElement) {
      grid.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const runSearch = useCallback(
    (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) return;
      // Prefer the semantic AI handler when the parent provides it; the
      // parent's handler will fall back to keyword filtering if GPT misses.
      if (onAiSearch) {
        onAiSearch(trimmed);
      } else if (externalSetQuery) {
        externalSetQuery(trimmed);
      }
      scrollToGrid();
    },
    [onAiSearch, externalSetQuery, scrollToGrid],
  );

  const handleSubmit = useCallback(
    (e: React.FormEvent) => {
      e.preventDefault();
      runSearch(localQuery);
    },
    [localQuery, runSearch],
  );

  const handleChipClick = (q: string) => {
    setLocalQuery(q);
    runSearch(q);
  };

  // Listen for Cmd/Ctrl+K → open the existing SearchDialog overlay.
  useEffect(() => {
    if (!setIsSearchOpen) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsSearchOpen((open) => !open);
      }
    };
    document.addEventListener("keydown", handler);
    return () => document.removeEventListener("keydown", handler);
  }, [setIsSearchOpen]);

  return (
    <section
      ref={heroRef}
      className="relative isolate overflow-hidden bg-[#0A0A0F] min-h-[calc(100vh-72px)] flex items-center"
    >
      {/* Backdrop layer 1 — subtle upper-right radial glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(800px 500px at 85% 0%, rgba(249,115,22,0.07), transparent 60%)",
        }}
      />

      {/* Backdrop layer 2 — animated dot grid + radial mask fade.
       * Two stacked radial-gradient backgrounds at the same size give the
       * grid a stronger inner dot + softer outer halo, and `animate-dot-drift`
       * walks the position from 0 → 40px (one cell) on a 30s loop. The
       * outer wrapper provides the mouse-parallax transform (set inline). */}
      <div
        aria-hidden
        ref={parallaxRef}
        className="pointer-events-none absolute inset-0 will-change-transform"
        style={{ transform: "translate3d(0,0,0)" }}
      >
        <div
          className={
            "absolute inset-[-40px] " +
            (reduceMotion ? "" : "motion-safe:animate-dot-drift")
          }
          style={{
            backgroundImage: [
              "radial-gradient(rgba(249,115,22,0.18) 1.2px, transparent 1.6px)",
              "radial-gradient(rgba(255,255,255,0.05) 1px, transparent 1.4px)",
            ].join(", "),
            backgroundSize: "40px 40px, 40px 40px",
            backgroundPosition: "0 0, 20px 20px",
            maskImage:
              "radial-gradient(ellipse 70% 55% at 50% 50%, black 30%, transparent 80%)",
            WebkitMaskImage:
              "radial-gradient(ellipse 70% 55% at 50% 50%, black 30%, transparent 80%)",
          }}
        />
      </div>

      {/* Bottom-edge fade so the hero blends into the white section below */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 h-32 bg-gradient-to-b from-transparent to-[#0A0A0F]"
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-[960px] w-full px-4 sm:px-6 lg:px-8 py-24 text-center">
        {/* Eyebrow */}
        <p className="text-[10px] sm:text-xs font-medium uppercase tracking-[0.16em] sm:tracking-[0.28em] text-orange-500/80 mb-6">
          5,000+ AI tools, curated and searchable
        </p>

        {/* Headline */}
        <h1 className="text-5xl sm:text-6xl md:text-7xl lg:text-[80px] font-bold tracking-tight text-white leading-[1.05] mb-6">
          Every AI tool,{" "}
          <span className="inline-block bg-gradient-to-r from-orange-500 via-orange-300 to-white bg-clip-text text-transparent">
            organized.
          </span>
        </h1>

        {/* Subheading */}
        <p className="text-base sm:text-lg text-gray-400 max-w-[600px] mx-auto leading-relaxed mb-10">
          Find the right AI for any job — from writing and design to code,
          research, and beyond. Search semantically, browse by category, or
          let our AI recommend tools for you.
        </p>

        {/* Search bar */}
        <form
          onSubmit={handleSubmit}
          className="relative max-w-2xl mx-auto group"
        >
          {/* Subtle outer halo on focus */}
          <div className="absolute -inset-0.5 rounded-full bg-orange-500/0 group-focus-within:bg-orange-500/20 blur-md transition-colors duration-200" />
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-500"
              aria-hidden
            />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Try: 'AI tool to write LinkedIn posts'"
              aria-label="Search AI tools"
              className="w-full h-16 pl-14 pr-32 rounded-full bg-white/[0.04] border border-white/10 text-white placeholder:text-gray-500 text-base backdrop-blur-sm focus:outline-none focus:border-orange-500 focus:bg-white/[0.07] focus:ring-2 focus:ring-orange-500/30 transition-all"
            />
            <Button
              type="submit"
              disabled={aiLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-12 px-5 bg-orange-500 hover:bg-orange-600 disabled:opacity-80 text-white rounded-full font-medium shadow-[0_8px_24px_-8px_rgba(249,115,22,0.6)] active:scale-[0.98] transition-transform"
            >
              {aiLoading ? (
                <>
                  <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin sm:mr-2" />
                  <span className="hidden sm:inline">Finding…</span>
                </>
              ) : (
                <>
                  <span className="hidden sm:inline">Search</span>
                  <ArrowRight className="w-4 h-4 sm:ml-2" />
                </>
              )}
            </Button>
          </div>
        </form>

        {/* Try chips */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-6">
          <span className="text-xs text-gray-500 mr-1">Try:</span>
          {TRY_QUERIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleChipClick(q)}
              className="px-4 py-1.5 rounded-full text-sm bg-white/5 border border-white/10 text-gray-300 hover:bg-white/10 hover:border-white/20 hover:text-white transition-colors"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Social proof */}
        <p className="text-xs text-gray-500 mt-10 tracking-wide">
          Updated daily · 5,000+ tools · Free to browse
        </p>
      </div>
    </section>
  );
};
