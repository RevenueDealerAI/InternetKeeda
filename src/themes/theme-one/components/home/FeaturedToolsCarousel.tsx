"use client";

import { useMemo, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowRight, ChevronLeft, ChevronRight } from "lucide-react";
import { useTools } from "@/lib/api/tools";
import { getToolLogo } from "@/utils/toolHelpers";
import { Tool } from "@/types/tool";

/** Horizontal snap carousel — top 8-10 tools by rating × log(votes + 1).
 * Each card is one snap target. Arrows scroll one card width. */
export const FeaturedToolsCarousel = () => {
  // Carousel only shows 10 — fetch 30 to give the Wilson-score
  // re-ranking some headroom. Was 200 = ~120 KB wasted.
  const { data, isLoading } = useTools({ limit: 30, sortBy: "rating", sortOrder: "desc" });
  const reduceMotion = useReducedMotion();
  const scrollRef = useRef<HTMLDivElement | null>(null);

  const top = useMemo(() => {
    const all = (data?.data ?? []) as Tool[];
    const score = (t: Tool) => (t.rating || 0) * Math.log((t.votes || 0) + 1);
    return [...all]
      .filter((t) => t.status === "published" || t.status === "approved")
      .sort((a, b) => score(b) - score(a))
      .slice(0, 10);
  }, [data]);

  const scroll = (dir: 1 | -1) => {
    const el = scrollRef.current;
    if (!el) return;
    el.scrollBy({ left: dir * (el.clientWidth * 0.85), behavior: "smooth" });
  };

  return (
    <section className="relative py-20 sm:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between gap-4 mb-8">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-orange-600 mb-3"
            >
              Editor's picks
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900"
            >
              Featured <span className="gradient-text">AI tools</span>
            </motion.h2>
            <p className="text-gray-600 mt-2 max-w-lg">
              The highest-rated tools in the catalog right now — ranked by a Wilson-style score that weights ratings by vote volume.
            </p>
          </div>

          <div className="hidden sm:flex gap-2">
            <button
              type="button"
              aria-label="Scroll left"
              onClick={() => scroll(-1)}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-colors shadow-sm flex items-center justify-center"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              type="button"
              aria-label="Scroll right"
              onClick={() => scroll(1)}
              className="w-10 h-10 rounded-full bg-white border border-gray-200 text-gray-700 hover:bg-orange-50 hover:border-orange-200 hover:text-orange-700 transition-colors shadow-sm flex items-center justify-center"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="relative">
          {/* Edge fades */}
          <div className="pointer-events-none absolute top-0 bottom-0 left-0 w-12 bg-gradient-to-r from-white to-transparent z-10" aria-hidden />
          <div className="pointer-events-none absolute top-0 bottom-0 right-0 w-12 bg-gradient-to-l from-white to-transparent z-10" aria-hidden />

          <div
            ref={scrollRef}
            className="overflow-x-auto snap-x snap-mandatory scroll-smooth mobile-scroll-area"
            style={{ scrollbarWidth: "none" }}
          >
            <div className="flex gap-5 pb-4 pr-6">
              {isLoading
                ? Array.from({ length: 6 }).map((_, i) => (
                    <div
                      key={i}
                      className="snap-start shrink-0 w-[280px] h-44 rounded-2xl bg-gray-100/60 animate-pulse"
                    />
                  ))
                : top.map((tool, idx) => (
                    <motion.div
                      key={tool.id}
                      initial={{ opacity: 0, y: 24 }}
                      whileInView={{ opacity: 1, y: 0 }}
                      viewport={{ once: true, margin: "-50px" }}
                      transition={{ duration: 0.4, delay: idx * 0.04 }}
                      className="snap-start shrink-0 w-[280px]"
                    >
                      <Link
                        href={`/ai-tools/${tool.slug}`}
                        className="gradient-border group block h-full bg-white rounded-2xl border border-gray-200 p-5 hover:shadow-[0_18px_40px_-20px_rgba(220,38,38,0.25)] hover:-translate-y-1 transition-all duration-200"
                      >
                        <div className="flex items-center gap-3">
                          <div className="relative w-12 h-12 rounded-xl overflow-hidden bg-gradient-to-br from-red-50 to-gray-50 ring-1 ring-gray-200/80 shrink-0">
                            <Image
                              src={getToolLogo(tool)}
                              alt={tool.name}
                              fill
                              sizes="48px"
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="min-w-0 flex-1">
                            <h3 className="text-sm font-semibold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                              {tool.name}
                            </h3>
                            <p className="text-xs text-gray-500 truncate">{tool.category}</p>
                          </div>
                        </div>
                        <p className="text-sm text-gray-600 line-clamp-3 mt-3 leading-relaxed min-h-[3.75rem]">
                          {tool.description_ai || tool.description}
                        </p>
                        <div className="flex items-center justify-between mt-4 pt-3 border-t border-gray-100">
                          <span className="text-xs text-gray-500">
                            ★ {tool.rating?.toFixed(1) ?? "—"} · {tool.votes?.toLocaleString() ?? 0} votes
                          </span>
                          <span className="inline-flex items-center text-xs font-semibold text-orange-600 group-hover:translate-x-0.5 transition-transform">
                            Try now <ArrowRight className="w-3.5 h-3.5 ml-1" />
                          </span>
                        </div>
                      </Link>
                    </motion.div>
                  ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
