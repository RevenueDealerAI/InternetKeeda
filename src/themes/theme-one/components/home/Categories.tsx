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
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { motion } from "framer-motion";
import { useCategories } from "@/hooks/useCategories";

// Lucide icon for each canonical category. Falls back to Hash for niche ones.
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

// Subtle background tints — rotate through these per slot for visual rhythm.
const TINT_RING = [
  "from-orange-50 to-amber-50 text-orange-600",
  "from-blue-50 to-sky-50 text-blue-600",
  "from-violet-50 to-orange-50 text-violet-600",
  "from-rose-50 to-pink-50 text-rose-600",
  "from-emerald-50 to-teal-50 text-emerald-600",
  "from-amber-50 to-yellow-50 text-amber-600",
];

const container = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0 },
};

export const Categories = () => {
  const { data, isLoading } = useCategories(true);

  // Sort by toolCount desc, take top 12.
  const top = (data?.data ?? [])
    .filter((c) => (c.toolCount ?? 0) > 0)
    .sort((a, b) => (b.toolCount ?? 0) - (a.toolCount ?? 0))
    .slice(0, 12);

  return (
    <section className="py-16 relative bg-gradient-to-b from-white via-gray-50/50 to-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(255,90,31,0.04),transparent_25%)]" />
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.h2
            initial={{ opacity: 0, y: -16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold tracking-tight text-gray-900 inline-block"
          >
            Explore by category
          </motion.h2>
          <motion.p
            initial={{ opacity: 0 }}
            whileInView={{ opacity: 1 }}
            viewport={{ once: true }}
            transition={{ delay: 0.15 }}
            className="text-gray-600 mt-2"
          >
            The 12 most-stocked corners of the catalog.
          </motion.p>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {Array.from({ length: 12 }).map((_, i) => (
              <div
                key={i}
                className="h-32 rounded-xl bg-gray-100/60 animate-pulse"
              />
            ))}
          </div>
        ) : (
          <motion.div
            variants={container}
            initial="hidden"
            whileInView="show"
            viewport={{ once: true, margin: "-80px" }}
            className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
          >
            {top.map((cat, idx) => {
              const Icon = ICON_MAP[cat.name] ?? Hash;
              const tint = TINT_RING[idx % TINT_RING.length];
              return (
                <motion.div key={cat.slug ?? cat.name} variants={item}>
                  <Link href={`/category/${cat.slug ?? encodeURIComponent(cat.name.toLowerCase())}`} className="block group">
                    <Card className="relative overflow-hidden border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 h-full">
                      <div className={`absolute inset-0 bg-gradient-to-br ${tint.split(" ").slice(0, 2).join(" ")} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
                      <div className="relative p-4 flex flex-col items-center gap-3">
                        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${tint.split(" ").slice(0, 2).join(" ")} ring-1 ring-gray-200/60 group-hover:scale-105 transition-transform duration-200`}>
                          <Icon className={`w-5 h-5 ${tint.split(" ").slice(2).join(" ")}`} />
                        </div>
                        <div className="text-center space-y-0.5 min-h-[3rem]">
                          <h3 className="text-sm font-semibold text-gray-900 leading-tight line-clamp-2">
                            {cat.name}
                          </h3>
                          <p className="text-xs text-gray-500">
                            {cat.toolCount} tools
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
            className="inline-flex items-center gap-1.5 text-sm font-medium text-[#FF5A1F] hover:text-[#E64A0E] transition-colors"
          >
            Browse all categories <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>
    </section>
  );
};
