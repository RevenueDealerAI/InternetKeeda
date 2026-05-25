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

const TRUST_BULLETS = [
  "Free to browse",
  "Updated daily",
  "No signup required",
];

/**
 * R6 hero — TAA-clean. Heavier sans-serif (Geist 800, -0.04em tracking),
 * solid-color accent on the keyword (no gradient sweep), an SVG keeda
 * (worm) mark floating above the headline with a gentle CSS bob.
 *
 * Why SVG over react-three-fiber: adding three.js to the home critical
 * path would defeat the R6 verification rule ("Lighthouse on / still
 * meets R2 targets"). three + @react-three/fiber + drei is ~150 KB
 * gzipped — a hard regression for one decorative mark. The SVG path
 * here is ~1.5 KB and animates on the GPU via CSS transform.
 */
export const HeroSection = ({
  searchQuery: externalQuery,
  setSearchQuery: externalSetQuery,
  setIsSearchOpen,
  onAiSearch,
  aiLoading,
}: HeroSectionProps) => {
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
      if (onAiSearch) onAiSearch(trimmed);
      else if (externalSetQuery) externalSetQuery(trimmed);
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
    <section className="relative isolate overflow-hidden bg-white pt-24 pb-20 sm:pb-24">
      {/* Subtle off-white wash → white floor, no blobs/mesh */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 bg-gradient-to-b from-[#FAFAFA] to-white"
      />

      <div className="relative z-10 mx-auto max-w-[960px] w-full px-4 sm:px-6 lg:px-8 text-center">
        {/* Keeda mark — small SVG worm, GPU-animated bob.
         * Decorative only (aria-hidden). Six segments + eye dot, brand
         * red gradient stops sampled from the logo. */}
        <div className="flex justify-center mb-6 hero-fade-up">
          <svg
            aria-hidden
            viewBox="0 0 140 56"
            className="h-12 w-auto keeda-mark-bob"
          >
            <defs>
              <linearGradient id="keedaWorm" x1="0" y1="0" x2="1" y2="0">
                <stop offset="0%" stopColor="#7F1D1D" />
                <stop offset="50%" stopColor="#DC2626" />
                <stop offset="100%" stopColor="#F87171" />
              </linearGradient>
            </defs>
            <g fill="url(#keedaWorm)">
              <circle cx="20" cy="28" r="14" />
              <circle cx="42" cy="26" r="12" />
              <circle cx="62" cy="28" r="11" />
              <circle cx="80" cy="26" r="10" />
              <circle cx="96" cy="28" r="9" />
              <circle cx="110" cy="27" r="8" />
              <circle cx="122" cy="28" r="7" />
            </g>
            {/* eye */}
            <circle cx="15" cy="25" r="2.2" fill="#fff" />
            <circle cx="15.5" cy="25" r="1.1" fill="#0A0A0A" />
          </svg>
        </div>

        {/* Eyebrow pill — clean, single-color, no halo */}
        <div className="flex justify-center hero-fade-up" style={{ animationDelay: "0.05s" }}>
          <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-[11px] font-semibold uppercase tracking-[0.14em] text-slate-700">
            <span className="h-1.5 w-1.5 rounded-full bg-brand-600" />
            5,000+ AI tools · updated daily
          </span>
        </div>

        {/* Headline — Geist 800, tight tracking, solid-color accent.
         * No italic, no gradient sweep, no per-letter wrap. The single
         * brand-colored word is the only chromatic punctuation. */}
        <h1
          className="mt-6 font-extrabold tracking-[-0.04em] text-slate-950 leading-[0.95] hero-fade-up"
          style={{ fontSize: "clamp(44px, 7vw, 88px)", animationDelay: "0.1s" }}
        >
          Every AI tool,
          <br className="hidden sm:inline" />
          <span className="text-brand-600"> organized.</span>
        </h1>

        {/* Subhead — shorter, tighter */}
        <p
          className="mt-5 text-base sm:text-lg text-slate-600 max-w-[580px] mx-auto hero-fade-up"
          style={{ animationDelay: "0.15s" }}
        >
          5,000+ tools across writing, design, code, audio, video, research. Search semantically or browse by category.
        </p>

        {/* Search bar */}
        <form
          onSubmit={handleSubmit}
          className="relative max-w-2xl mx-auto mt-9 group hero-fade-up"
          style={{ animationDelay: "0.2s" }}
        >
          <div className="relative">
            <Search
              className="pointer-events-none absolute left-5 top-1/2 -translate-y-1/2 w-5 h-5 text-slate-400"
              aria-hidden
            />
            <input
              type="text"
              value={localQuery}
              onChange={(e) => setLocalQuery(e.target.value)}
              placeholder="Try: 'AI tool to write LinkedIn posts'"
              aria-label="Search AI tools"
              className="w-full h-14 sm:h-16 pl-14 pr-32 sm:pr-36 rounded-full bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 text-[15px] sm:text-base shadow-[0_4px_20px_-8px_rgba(15,23,42,0.10)] focus:outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/15 transition-all duration-200 ease-out"
            />
            <Button
              type="submit"
              variant="keeda"
              disabled={aiLoading}
              className="absolute right-2 top-1/2 -translate-y-1/2 h-10 sm:h-12 px-4 sm:px-5 rounded-full active:scale-[0.98]"
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
          style={{ animationDelay: "0.25s" }}
        >
          <span className="text-xs text-slate-500 mr-1">Try:</span>
          {TRY_QUERIES.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => handleChipClick(q)}
              className="px-3.5 py-1.5 rounded-full text-[13px] bg-white border border-slate-200 text-slate-700 hover:bg-brand-50 hover:border-brand-200 hover:text-brand-700 transition-all duration-200 ease-out shadow-sm"
            >
              {q}
            </button>
          ))}
        </div>

        {/* Trust strip */}
        <div
          className="mt-8 flex flex-wrap items-center justify-center gap-x-5 gap-y-1.5 hero-fade-up"
          style={{ animationDelay: "0.3s" }}
        >
          {TRUST_BULLETS.map((t) => (
            <span key={t} className="inline-flex items-center gap-1.5 text-[13px] text-slate-500">
              <Check className="w-3.5 h-3.5 text-brand-600" />
              {t}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
};
