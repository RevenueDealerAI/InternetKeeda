"use client";

import { useMemo } from "react";
import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { TrendingUp, ArrowRight } from "lucide-react";
import { useTools } from "@/lib/api/tools";
import { getToolLogo } from "@/utils/toolHelpers";
import { Tool } from "@/types/tool";

const GRADIENT_RING = [
  "from-red-300/60 via-red-200/40 to-red-100/60",
  "from-red-200/60 via-red-300/40 to-gray-200/60",
  "from-gray-300/60 via-red-200/40 to-red-300/60",
];

/** Three trending tools in a gradient-bordered grid. Derived from total
 * views (no per-day tracking on the schema yet); admins can pin via
 * isTrending — pinned tools always come first. */
export const TrendingThisWeek = () => {
  const { data, isLoading } = useTools({ limit: 500, sortBy: "views", sortOrder: "desc" });

  const tools = useMemo(() => {
    const all = (data?.data ?? []) as Tool[];
    const rank = (t: Tool) => (t.isTrending ? 1_000_000_000 : 0) + (t.views || 0);
    return [...all]
      .filter((t) => t.status === "published" || t.status === "approved")
      .sort((a, b) => rank(b) - rank(a))
      .slice(0, 3);
  }, [data]);

  return (
    <section className="relative py-20 sm:py-24 bg-gradient-to-b from-white via-[#FAFAFA] to-white overflow-hidden">
      <div className="container mx-auto px-4">
        <div className="flex items-end justify-between gap-4 mb-10">
          <div>
            <motion.span
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-orange-600 mb-3"
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Trending this week
            </motion.span>
            <motion.h2
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5 }}
              className="text-3xl sm:text-4xl font-bold tracking-tight text-gray-900"
            >
              What everyone's <span className="gradient-text">using</span>
            </motion.h2>
          </div>
          <Link
            href="/trending"
            className="hidden sm:inline-flex items-center gap-1 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
          >
            See all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {isLoading
            ? Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className="h-64 rounded-2xl bg-gray-100/60 animate-pulse" />
              ))
            : tools.map((tool, idx) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                >
                  <Link href={`/ai-tools/${tool.slug}`} className="block group h-full relative">
                    {/* Soft gradient frame */}
                    <div
                      className={`absolute -inset-px rounded-2xl bg-gradient-to-br ${GRADIENT_RING[idx % GRADIENT_RING.length]} opacity-100 group-hover:opacity-100 blur-sm group-hover:blur-md transition-all`}
                      aria-hidden
                    />
                    <div className="relative h-full bg-white rounded-2xl border border-white p-6 sm:p-7 hover:-translate-y-1 transition-transform duration-200 shadow-[0_1px_2px_rgba(15,23,42,0.05)]">
                      <div className="flex items-start gap-3">
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
                        <div className="flex-1 min-w-0">
                          <h3 className="text-lg font-bold text-gray-900 truncate group-hover:text-orange-600 transition-colors">
                            {tool.name}
                          </h3>
                          <p className="text-xs text-gray-500 truncate">{tool.category}</p>
                        </div>
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-orange-700 bg-orange-50 ring-1 ring-orange-200/60 px-2 py-0.5 rounded-full shrink-0">
                          #{idx + 1}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 leading-relaxed mt-4 line-clamp-3 min-h-[4.5rem]">
                        {tool.description_ai || tool.description}
                      </p>
                      <div className="mt-5 pt-4 border-t border-gray-100 flex items-center justify-between">
                        <span className="text-xs text-gray-500">
                          {tool.views?.toLocaleString() ?? 0} views
                        </span>
                        <span className="inline-flex items-center text-xs font-semibold text-orange-600 group-hover:translate-x-0.5 transition-transform">
                          Explore <ArrowRight className="w-3.5 h-3.5 ml-1" />
                        </span>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
        </div>
      </div>
    </section>
  );
};
