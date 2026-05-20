"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { Search, ArrowRight, Check } from "lucide-react";
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

const SOCIAL_PROOF_LOGOS = [
  "ChatGPT",
  "Midjourney",
  "Claude",
  "Stable Diffusion",
  "Runway",
];

const TRUST_BULLETS = [
  "Free to browse",
  "Updated daily",
  "No signup required",
];

/** Phase D Tier 3 — bright SaaS hero. Light canvas, animated gradient mesh
 * (three blurred orange+violet+indigo blobs drifting on different cycles),
 * a massive gradient-accented headline, a tall rounded-full search bar,
 * try-chips, social-proof logo row, and a trust strip. */
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

  // Hero entrance is now CSS-driven (.hero-fade-up class + per-element
  // animation-delay). framer-motion was making the LCP headline invisible
  // until hydration, which blew LCP out to 8s on mobile Lighthouse runs.
  return (
    <section
      ref={heroRef}
      className="relative isolate overflow-hidden bg-white min-h-[100svh] flex items-center pt-20 pb-24 sm:pb-28"
    >
      {/* Soft off-white wash so the mesh blobs read as paint on canvas */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#FAFAFA] via-white to-white"
      />

      {/* Gradient mesh — three blurred blobs drift independently behind
       * the content. Heavy on GPU (mix-blend + 80px blur + keyframes),
       * so we ONLY render on md and up. Mobile gets the soft off-white
       * wash instead, which keeps the hero lightweight on the platform
       * where the perf budget matters most. */}
      <div
        aria-hidden
        ref={parallaxRef}
        className="pointer-events-none absolute inset-0 will-change-transform hidden md:block"
        style={{ transform: "translate3d(0,0,0)" }}
      >
        <div
          className={
            "mesh-blob " + (reduceMotion ? "" : "motion-safe:animate-blob-a")
          }
          style={{
            width: "560px",
            height: "560px",
            top: "-10%",
            left: "-8%",
            background:
              "radial-gradient(closest-side, rgba(220,38,38,0.55), rgba(220,38,38,0))",
          }}
        />
        <div
          className={
            "mesh-blob " + (reduceMotion ? "" : "motion-safe:animate-blob-b")
          }
          style={{
            width: "620px",
            height: "620px",
            top: "12%",
            right: "-10%",
            background:
              "radial-gradient(closest-side, rgba(153,27,27,0.45), rgba(153,27,27,0))",
          }}
        />
        <div
          className={
            "mesh-blob " + (reduceMotion ? "" : "motion-safe:animate-blob-c")
          }
          style={{
            width: "520px",
            height: "520px",
            bottom: "-12%",
            left: "30%",
            background:
              "radial-gradient(closest-side, rgba(15,15,15,0.18), rgba(15,15,15,0))",
          }}
        />
      </div>


      {/* Faint dot grid for texture — kept light so it's atmosphere, not pattern */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          backgroundImage:
            "radial-gradient(rgba(15,23,42,0.05) 1px, transparent 1.4px)",
          backgroundSize: "28px 28px",
          maskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 85%)",
          WebkitMaskImage:
            "radial-gradient(ellipse 70% 60% at 50% 50%, black 30%, transparent 85%)",
        }}
      />

      {/* Content */}
      <div className="relative z-10 mx-auto max-w-[1040px] w-full px-4 sm:px-6 lg:px-8 text-center">
        {/* Eyebrow pill */}
        <div className="flex justify-center hero-fade-up">
          <span className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/80 backdrop-blur-sm border border-orange-200/60 text-[11px] sm:text-xs font-semibold uppercase tracking-[0.18em] text-orange-700 shadow-sm">
            <span className="relative flex h-2 w-2">
              <span className="absolute inset-0 rounded-full bg-orange-500/40 animate-ping motion-reduce:hidden" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-orange-500" />
            </span>
            5,000+ AI tools · updated daily
          </span>
        </div>

        {/* Headline — LCP element. NO opacity:0 initial state so it
         * paints immediately on first byte; the CSS fade-up runs once
         * over 0.55s but the text is visible the whole time. */}
        <h1
          className="mt-7 font-bold tracking-tight text-gray-900 leading-[1.03] hero-fade-up"
          style={{ fontSize: "clamp(40px, 6vw, 80px)", animationDelay: "0.05s" }}
        >
          Every AI tool,{" "}
          <span className="gradient-text inline-block">organized.</span>
        </h1>

        {/* Subhead */}
        <p
          className="mt-6 text-base sm:text-lg md:text-xl text-gray-600 max-w-[640px] mx-auto leading-relaxed hero-fade-up"
          style={{ animationDelay: "0.1s" }}
        >
          Find the right AI for any job — writing, design, code, research, audio, video.
          Search semantically, browse by category, or let our AI pick for you.
        </p>

        {/* Search bar */}
        <form
          onSubmit={handleSubmit}
          className="relative max-w-2xl mx-auto mt-10 group hero-fade-up"
          style={{ animationDelay: "0.15s" }}
        >
          <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-red-500/0 via-red-700/0 to-black/0 blur-xl transition-all duration-300 group-focus-within:from-red-500/30 group-focus-within:via-red-700/20 group-focus-within:to-black/20" />
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400"
              aria-hidden
            />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Try: 'AI tool to write LinkedIn posts'"
              aria-label="Search AI tools"
              className="w-full h-16 pl-14 pr-32 sm:pr-36 rounded-full bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 text-base shadow-[0_8px_30px_-10px_rgba(15,23,42,0.12)] focus:outline-none focus:border-orange-400 focus:ring-4 focus:ring-orange-500/15 transition-all"
            />
            <Button
              type="submit"
              disabled={aiLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-12 px-5 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 disabled:opacity-80 text-white rounded-full font-medium shadow-[0_8px_24px_-8px_rgba(220,38,38,0.55)] active:scale-[0.98] transition-transform"
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
        <div
          className="flex flex-wrap items-center justify-center gap-2 mt-5 hero-fade-up"
          style={{ animationDelay: "0.2s" }}
        >
          <span className="text-xs text-gray-500 mr-1">Try:</span>
          {TRY_QUERIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleChipClick(q)}
              className="px-4 py-1.5 rounded-full text-sm bg-white border border-gray-200 text-gray-700 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 hover:-translate-y-px transition-all shadow-sm"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Trust strip */}
        <div
          className="mt-10 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 hero-fade-up"
          style={{ animationDelay: "0.25s" }}
        >
          {TRUST_BULLETS.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 text-sm text-gray-600">
              <Check className="w-4 h-4 text-orange-500" />
              {t}
            </span>
          ))}
        </div>

        {/* Social proof — featured AI tools logo row */}
        <div
          className="mt-12 flex flex-wrap items-center justify-center gap-x-5 sm:gap-x-8 gap-y-3 hero-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          <span className="text-xs font-medium uppercase tracking-wider text-gray-400">
            Featured AI tools
          </span>
          {SOCIAL_PROOF_LOGOS.map((name) => (
            <span
              key={name}
              className="text-sm font-semibold text-gray-500 hover:text-gray-700 transition-colors"
            >
              {name}
            </span>
          ))}
          <span className="text-sm text-gray-400">· 5,000+ more</span>
        </div>
      </div>
    </section>
  );
};
