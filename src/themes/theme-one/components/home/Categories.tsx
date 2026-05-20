"use client";

import { Card } from "@/components/ui/card";
import Link from "next/link";
import {
  Image as ImageIcon,
  Pencil,
  Code,
  Video,
  AudioLines,
  Bot,
  Brain,
  Database,
  BarChart,
  Search,
  MessageSquare,
  Layers,
  ArrowRight,
  PencilLine,
  GraduationCap,
  Zap,
  Mic,
  UserCircle,
  Edit3,
  Cpu,
  Briefcase,
  Music,
  Share2,
  Headphones,
  Hash,
  type LucideIcon,
} from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { useCategories } from "@/hooks/useCategories";

const ICON_MAP: Record<string, LucideIcon> = {
  "Image Generation": ImageIcon,
  "Code & Developer Tools": Code,
  "AI Chatbots & Assistants": Bot,
  "Summarization & Q&A": MessageSquare,
  "Data & Analytics": BarChart,
  "Content Creation": Pencil,
  "Customer Support": Headphones,
  "Writing & Copywriting": PencilLine,
  "Education & Learning": GraduationCap,
  Productivity: Zap,
  "Voice & Speech": Mic,
  "Avatar & Character Generation": UserCircle,
  "Image Editing": Edit3,
  "ChatGPT Variants & Integrations": Cpu,
  "Video Generation": Video,
  "Audio & Podcasts": AudioLines,
  "Business & Strategy": Briefcase,
  SEO: Search,
  "Music Generation": Music,
  "Social Media": Share2,
  Research: Brain,
  "Research & Academic Tools": Brain,
  Marketing: Layers,
  "Note-Taking & Knowledge": Database,
};

type TintKey = "orange" | "violet" | "indigo" | "rose" | "emerald" | "amber";

const TINTS: Record<TintKey, { from: string; to: string; ring: string; text: string; halo: string }> = {
  orange:  { from: "from-red-50",  to: "to-red-100",   ring: "ring-red-200/60",   text: "text-red-600",  halo: "bg-red-200/40"  },
  violet:  { from: "from-gray-50", to: "to-red-50",    ring: "ring-gray-200/60",  text: "text-gray-800", halo: "bg-gray-200/40" },
  indigo:  { from: "from-red-100", to: "to-red-50",    ring: "ring-red-300/60",   text: "text-red-700",  halo: "bg-red-300/40"  },
  rose:    { from: "from-red-50",  to: "to-gray-50",   ring: "ring-red-200/60",   text: "text-red-600",  halo: "bg-red-200/40"  },
  emerald: { from: "from-gray-100",to: "to-red-50",    ring: "ring-gray-300/60",  text: "text-gray-900", halo: "bg-gray-300/40" },
  amber:   { from: "from-red-100", to: "to-gray-50",   ring: "ring-red-200/60",   text: "text-red-700",  halo: "bg-red-200/40"  },
};

const TINT_ORDER: TintKey[] = ["orange", "violet", "indigo", "rose", "emerald", "amber"];

const containerVariants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.45, ease: [0.22, 1, 0.36, 1] as const } },
};

/** Phase D Tier 3 — bento category section. Top-6 by tool count laid out
 * in an asymmetric grid (1 large feature + 5 smaller tiles) on desktop,
 * stacked on mobile. Each tile has a soft category-tinted gradient bg,
 * an icon, a tool count, and a hover lift. */
export const Categories = () => {
  // Bento only renders 6 tiles — fetch the top 30 to leave headroom and
  // keep the payload light.
  const { data, isLoading } = useCategories(true, 30);
  const reduceMotion = useReducedMotion();

  const top = (data?.data ?? []).filter((c) => (c.toolCount ?? 0) > 0).slice(0, 6);

  return (
    <section className="relative py-20 sm:py-24 bg-white">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            "radial-gradient(900px 400px at 50% 0%, rgba(220,38,38,0.04), transparent 60%)",
        }}
      />

      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-orange-600 mb-3"
          >
            Browse the catalog
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900"
          >
            Explore by <span className="gradient-text">category</span>
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ delay: 0.1 }}
            className="text-gray-600 mt-3"
          >
            Six of the most-stocked corners of InternetKeeda. Click any tile to drill in.
          </motion.p>
        </div>

        {isLoading ? (
          <BentoSkeleton />
        ) : (
          <motion.div
            variants={containerVariants}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-2 md:grid-cols-4 grid-rows-[repeat(4,minmax(0,1fr))] md:grid-rows-2 gap-4 sm:gap-5"
          >
            {top.map((cat, idx) => {
              const Icon = ICON_MAP[cat.name] ?? Hash;
              const tint = TINTS[TINT_ORDER[idx % TINT_ORDER.length]];
              const isFeature = idx === 0; // first tile is the big one

              return (
                <motion.div
                  key={cat.slug ?? cat.name}
                  variants={itemVariants}
                  className={isFeature ? "col-span-2 row-span-2" : "col-span-1 row-span-1"}
                >
                  <Link
                    href={`/category/${cat.slug ?? encodeURIComponent(cat.name.toLowerCase())}`}
                    className="block group h-full"
                  >
                    <Card
                      className={[
                        "relative h-full overflow-hidden border border-gray-100",
                        "shadow-[0_1px_2px_rgba(15,23,42,0.04)] hover:shadow-[0_18px_40px_-20px_rgba(99,102,241,0.25)]",
                        "transition-all duration-300",
                        reduceMotion ? "" : "hover:-translate-y-1",
                        "bg-gradient-to-br",
                        tint.from,
                        tint.to,
                      ].join(" ")}
                    >
                      {/* Soft inner halo on hover */}
                      <div className={`absolute -inset-4 ${tint.halo} blur-3xl opacity-0 group-hover:opacity-70 transition-opacity duration-500`} aria-hidden />

                      <div className={`relative h-full flex flex-col ${isFeature ? "p-6 sm:p-8" : "p-5"}`}>
                        <div className="flex items-start justify-between">
                          <div className={`${isFeature ? "w-14 h-14" : "w-11 h-11"} rounded-2xl bg-white/80 ring-1 ${tint.ring} flex items-center justify-center backdrop-blur-sm group-hover:scale-105 transition-transform`}>
                            <Icon className={`${isFeature ? "w-7 h-7" : "w-5 h-5"} ${tint.text}`} />
                          </div>
                          <ArrowRight className={`w-4 h-4 text-gray-400 group-hover:text-gray-700 group-hover:translate-x-0.5 transition-all`} />
                        </div>

                        <div className="mt-auto pt-6">
                          <h3 className={`font-bold text-gray-900 leading-tight tracking-tight ${isFeature ? "text-2xl sm:text-3xl" : "text-base"} line-clamp-2`}>
                            {cat.name}
                          </h3>
                          <p className={`mt-2 ${isFeature ? "text-sm" : "text-xs"} text-gray-600`}>
                            <span className="font-semibold text-gray-700">{cat.toolCount}</span>{" "}
                            {cat.toolCount === 1 ? "tool" : "tools"}
                          </p>
                        </div>
                      </div>
                    </Card>
                  </Link>
                </motion.div>
              );
            })}
          </motion.div>
        )}

        <div className="text-center mt-10">
          <Link
            href="/categories"
            className="inline-flex items-center gap-1.5 text-sm font-semibold text-orange-600 hover:text-orange-700 transition-colors"
          >
            Browse all categories <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};

function BentoSkeleton() {
  return (
    <div className="grid grid-cols-2 md:grid-cols-4 grid-rows-[repeat(4,minmax(0,1fr))] md:grid-rows-2 gap-4 sm:gap-5">
      <div className="col-span-2 row-span-2 h-44 md:h-auto rounded-xl bg-gray-100/60 animate-pulse" />
      {Array.from({ length: 5 }).map((_, i) => (
        <div key={i} className="h-36 rounded-xl bg-gray-100/60 animate-pulse" />
      ))}
    </div>
  );
}
