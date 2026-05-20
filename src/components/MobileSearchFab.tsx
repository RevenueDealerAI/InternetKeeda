"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { useRouter, usePathname } from "next/navigation";
import { Search, Sparkles, X, ArrowRight } from "lucide-react";

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

/** Mobile-only floating search FAB. Vanilla DOM + CSS transitions
 * (previously used framer-motion which pulled it into the shared
 * layout chunk for every page). The framer dependency is now gone
 * from the critical path; LCP and TBT no longer pay for animation
 * runtime on first paint. */
export const MobileSearchFab = () => {
  const [scrolledPast, setScrolledPast] = useState(false);
  const [open, setOpen] = useState(false);
  const [render, setRender] = useState(false); // mounts the panel before fading in
  const [query, setQuery] = useState("");
  const [showHint, setShowHint] = useState(false);
  const inputRef = useRef<HTMLInputElement | null>(null);
  const hintShownRef = useRef(false);
  const router = useRouter();
  const pathname = usePathname();

  // Scroll vs ~80% of viewport height — "past the hero" threshold.
  useEffect(() => {
    let raf = 0;
    const update = () => {
      raf = 0;
      const threshold = window.innerHeight * 0.8;
      const past = window.scrollY > threshold;
      setScrolledPast((prev) => {
        if (!prev && past && !hintShownRef.current) {
          hintShownRef.current = true;
          try {
            if (!sessionStorage.getItem("ik_fab_hint_seen")) {
              setShowHint(true);
              sessionStorage.setItem("ik_fab_hint_seen", "1");
              window.setTimeout(() => setShowHint(false), 3200);
            }
          } catch {
            setShowHint(true);
            window.setTimeout(() => setShowHint(false), 3200);
          }
        }
        return past;
      });
    };
    update();
    const onScroll = () => { if (!raf) raf = requestAnimationFrame(update); };
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (raf) cancelAnimationFrame(raf);
    };
  }, []);

  // Mount the panel before animating it in so the CSS transition runs.
  useEffect(() => {
    if (open) {
      setRender(true);
    } else if (render) {
      const t = window.setTimeout(() => setRender(false), 220);
      return () => window.clearTimeout(t);
    }
  }, [open, render]);

  // Focus input shortly after mount so iOS pops the keyboard.
  useEffect(() => {
    if (!open) return;
    const t = window.setTimeout(() => inputRef.current?.focus(), 80);
    return () => window.clearTimeout(t);
  }, [open]);

  // Lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.body.style.overflow = prev; };
  }, [open]);

  // ESC closes.
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(false); };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const submit = useCallback((raw: string) => {
    const q = raw.trim();
    if (!q) return;
    const params = new URLSearchParams({ q });
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
      <div
        className={`md:hidden fixed right-5 z-[65] flex items-center gap-2 transition-all duration-200 ${
          scrolledPast ? "opacity-100 translate-y-0 scale-100 pointer-events-auto" : "opacity-0 translate-y-6 scale-90 pointer-events-none"
        }`}
        style={{ bottom: `calc(env(safe-area-inset-bottom, 0px) + 80px)` }}
      >
        {showHint && (
          <span
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-gray-900 text-white text-xs font-medium shadow-lg whitespace-nowrap relative"
            aria-hidden
          >
            Search AI tools
            <span aria-hidden className="block w-0 h-0 border-t-[5px] border-t-transparent border-l-[6px] border-l-gray-900 border-b-[5px] border-b-transparent absolute -right-1.5 top-1/2 -translate-y-1/2" />
          </span>
        )}

        <button
          type="button"
          onClick={() => { setOpen(true); setShowHint(false); }}
          aria-label="Search AI tools"
          aria-expanded={open}
          aria-controls="ik-mobile-search-panel"
          className="relative inline-flex items-center justify-center w-14 h-14 rounded-full bg-gradient-to-br from-red-500 to-red-700 hover:from-red-600 hover:to-red-800 ring-4 ring-white active:scale-95 text-white shadow-[0_12px_30px_-8px_rgba(220,38,38,0.6)] transition-colors"
        >
          <Sparkles className="w-6 h-6" />
          <span className="absolute -bottom-0.5 -right-0.5 inline-flex items-center justify-center w-5 h-5 rounded-full bg-white text-red-600 ring-2 ring-white">
            <Search className="w-3 h-3" />
          </span>
        </button>
      </div>

      {/* Slide-out panel — always rendered when `render` is true, then
        * the `open` class controls the CSS transition. */}
      {render && (
        <>
          <div
            onClick={() => setOpen(false)}
            className={`md:hidden fixed inset-0 z-[80] bg-black/40 backdrop-blur-sm transition-opacity duration-200 ${
              open ? "opacity-100" : "opacity-0"
            }`}
            aria-hidden
          />

          <aside
            id="ik-mobile-search-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Search AI tools"
            className={`md:hidden fixed top-0 right-0 z-[85] h-full w-[85vw] max-w-[420px] bg-white shadow-[0_0_60px_-10px_rgba(0,0,0,0.3)] flex flex-col transition-transform duration-[250ms] ease-out ${
              open ? "translate-x-0" : "translate-x-full"
            }`}
            style={{ paddingTop: "env(safe-area-inset-top, 0px)" }}
          >
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
          </aside>
        </>
      )}
    </>
  );
};
