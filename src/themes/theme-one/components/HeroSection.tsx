"use client";

import type React from "react";
import { useState, useEffect, useCallback } from "react";
import { Search, ArrowRight, Check } from "lucide-react";
import { Button } from "@/components/ui/button";

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

  // Hero entrance is CSS-driven (.hero-fade-up), so the LCP element
  // paints immediately without waiting for framer hydration.
  return (
    <section
      className="relative isolate overflow-hidden bg-white min-h-[100svh] flex items-center pt-20 pb-24 sm:pb-28"
    >
      {/* Clean hero — no mesh blobs, no WebGL shader, no dot grid.
       * Just a subtle off-white→white wash so the hero doesn't read
       * as a hard rectangle against the page below. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#FAFAFA] to-white"
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

        {/* Headline — LCP element. Plain text + a single
         * gradient-text-sweep span around the accent word. No per-
         * letter wrapping so background-clip:text works correctly
         * and "organized." actually renders. The .hero-fade-up
         * keyframe on the <h1> still fades the whole headline in
         * on desktop; mobile + reduced-motion paint instantly. */}
        <h1
          className="mt-7 font-bold tracking-tight text-gray-900 leading-[1.03] hero-fade-up"
          style={{ fontSize: "clamp(40px, 6vw, 80px)", animationDelay: "0.05s" }}
        >
          Every AI tool,{" "}
          <span className="gradient-text-sweep">organized.</span>
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
