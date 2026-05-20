"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Search, X, ArrowRight } from "lucide-react";

const TRY_QUERIES = [
  "Image generation",
  "Code assistants",
  "Voice cloning",
  "Writing tools",
];

const POPULAR_SEARCHES = [
  "ChatGPT alternatives",
  "Free AI tools",
  "Resume builder",
  "Logo generator",
  "Background remover",
];

/** Mobile-only floating search FAB.
 *
 *  - Hidden under the fold (initial 80% of viewport height) so it doesn't
 *    compete with the hero search bar.
 *  - Appears bottom-right once scrolled past — 56 px red disc with white
 *    icon, sits above the bottom nav (96 px clear).
 *  - Tapping opens a right-anchored slide-out panel (~85vw) with a
 *    large auto-focused search input, "Try" chips, and Popular searches.
 *  - Submitting sets ?q in the URL and routes to / (or appends ?q if
 *    already on /), then closes the panel. The home page picks up ?q
 *    on mount and applies it as the keyword query that filters the grid.
 *  - md and up: not rendered. Desktop has the hero search + a header
 *    search button already; a FAB on a wide viewport is just visual
 *    noise.
 */
export const MobileSearchFab = () => {
  const [scrolledPast, setScrolledPast] = useState(false);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement | null>(null);
  const router = useRouter();
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  // Track scroll vs ~80% of viewport height (rough "past the hero").
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const threshold = window.innerHeight * 0.8;
      setScrolledPast(window.scrollY > threshold);
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

  // Focus the input the first frame after the panel opens. Direct
  // autoFocus on the input doesn't reliably trigger the iOS keyboard
  // when the input mounts behind a transform animation.
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 60);
    return () => window.clearTimeout(t);
  }, [open]);

  // Lock body scroll while panel is open so the page underneath doesn't
  // bounce when the user touches outside the panel.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // ESC to close
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const submit = useCallback((raw: string) => {
    const q = raw.trim();
    if (!q) return;
    const params = new URLSearchParams({ q });
    // If we're already on home, just update the URL (no full nav) and
    // let Index.tsx react via the ?q listener. Otherwise route to home.
    if (pathname === "/") {
      router.replace(`/?${params.toString()}#tool-grid`, { scroll: false });
      window.dispatchEvent(new CustomEvent("ik:run-search", { detail: { query: q } }));
    } else {
      router.push(`/?${params.toString()}#tool-grid`);
    }
    setOpen(false);
  }, [pathname, router]);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submit(query);
  };

  return (
    <>
      {/* FAB */}
      <AnimatePresence>
        {scrolledPast && (
          <motion.button
            key="ik-search-fab"
            type="button"
            initial={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.85 }}
            animate={reduceMotion ? { opacity: 1 } : { opacity: 1, y: 0, scale: 1 }}
            exit={reduceMotion ? { opacity: 0 } : { opacity: 0, y: 24, scale: 0.85 }}
            transition={{ duration: 0.2, ease: [0.22, 1, 0.36, 1] }}
            onClick={() => setOpen(true)}
            aria-label="Open search"
            aria-expanded={open}
            aria-controls="ik-mobile-search-panel"
            className="md:hidden fixed right-5 z-[65] inline-flex items-center justify-center w-14 h-14 rounded-full bg-red-600 hover:bg-red-700 active:scale-95 text-white shadow-[0_12px_30px_-8px_rgba(220,38,38,0.55)] transition-colors"
            style={{ bottom: `calc(env(safe-area-inset-bottom, 0px) + 80px)` }}
          >
            <Search className="w-6 h-6" />
          </motion.button>
        )}
      </AnimatePresence>

      {/* Slide-out side panel */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop — covers the 15% dismiss strip + the page below.
              * Solid-ish overlay so the white panel reads cleanly. */}
            <motion.div
              key="ik-search-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              onClick={() => setOpen(false)}
              className="md:hidden fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm"
              aria-hidden
            />

            <motion.aside
              key="ik-search-panel"
              id="ik-mobile-search-panel"
              role="dialog"
              aria-modal="true"
              aria-label="Search AI tools"
              initial={reduceMotion ? { opacity: 0 } : { x: "100%" }}
              animate={reduceMotion ? { opacity: 1 } : { x: 0 }}
              exit={reduceMotion ? { opacity: 0 } : { x: "100%", transition: { duration: 0.2, ease: [0.4, 0, 1, 1] } }}
              transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
              className="md:hidden fixed top-0 right-0 z-[85] h-full w-[85vw] max-w-[420px] bg-white shadow-[0_0_60px_-10px_rgba(0,0,0,0.3)] flex flex-col"
              style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
                <h2 className="text-lg font-bold text-gray-900">Search AI Tools</h2>
                <button
                  type="button"
                  aria-label="Close search"
                  onClick={() => setOpen(false)}
                  className="inline-flex items-center justify-center w-10 h-10 -mr-2 rounded-full text-gray-500 hover:bg-gray-100 active:scale-95 transition"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Scrollable body */}
              <div className="flex-1 overflow-y-auto px-5 pt-5 pb-8">
                <form onSubmit={onSubmit} className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    ref={inputRef}
                    type="search"
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Try: 'AI tool to write LinkedIn posts'"
                    aria-label="Search AI tools"
                    enterKeyHint="search"
                    className="w-full h-14 pl-12 pr-14 rounded-2xl bg-white border border-gray-200 text-gray-900 placeholder:text-gray-400 text-base shadow-sm focus:outline-none focus:border-red-400 focus:ring-4 focus:ring-red-500/15 transition"
                  />
                  <button
                    type="submit"
                    aria-label="Submit search"
                    disabled={!query.trim()}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-r from-red-600 to-red-700 disabled:opacity-50 text-white shadow-[0_6px_18px_-6px_rgba(220,38,38,0.5)] active:scale-95 transition"
                  >
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </form>

                {/* Try chips */}
                <div className="mt-6">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Try</p>
                  <div className="flex flex-wrap gap-2">
                    {TRY_QUERIES.map((q) => (
                      <button
                        key={q}
                        type="button"
                        onClick={() => { setQuery(q); submit(q); }}
                        className="px-3.5 py-2 rounded-full text-sm bg-white border border-gray-200 text-gray-700 hover:bg-red-50 hover:border-red-200 hover:text-red-700 active:scale-95 transition"
                      >
                        {q}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Popular */}
                <div className="mt-8">
                  <p className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Popular searches</p>
                  <ul className="divide-y divide-gray-100">
                    {POPULAR_SEARCHES.map((q) => (
                      <li key={q}>
                        <button
                          type="button"
                          onClick={() => { setQuery(q); submit(q); }}
                          className="w-full flex items-center justify-between text-left py-3 text-sm text-gray-800 active:bg-gray-50"
                        >
                          <span className="flex items-center gap-3">
                            <Search className="w-4 h-4 text-gray-400" />
                            {q}
                          </span>
                          <ArrowRight className="w-4 h-4 text-gray-300" />
                        </button>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </>
  );
};
