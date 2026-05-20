"use client";

import { motion, useReducedMotion } from "framer-motion";
import { Search, Sparkles, Rocket } from "lucide-react";

const STEPS = [
  {
    icon: Search,
    title: "Browse",
    body: "Filter 5,000+ AI tools by category, pricing, or rating. Or search semantically for what you actually want to do.",
    tint: { ring: "ring-red-200", bg: "bg-red-50", text: "text-red-600" },
  },
  {
    icon: Sparkles,
    title: "Discover",
    body: "Our AI matches your prompt to tools — even if your wording doesn't match their name. Read AI-rewritten plain-English descriptions, not marketing fluff.",
    tint: { ring: "ring-red-300", bg: "bg-red-100", text: "text-red-700" },
  },
  {
    icon: Rocket,
    title: "Try",
    body: "Click through directly to the tool — no signup wall on our end. Save favorites and come back when you need them.",
    tint: { ring: "ring-gray-300", bg: "bg-gray-100", text: "text-gray-900" },
  },
];

/** Two-track layout so the mobile read is tight and labels never collide
 * with the icon disc:
 *
 * Mobile (<md): vertical stack — STEP n label (separate block, above)
 *   → 56px icon → title → body. space-y-12 between steps.
 *
 * Desktop (md+): 3-column grid, larger 96px icon, dashed gradient line
 *   draws between the columns on scroll. Title + body fall under the
 *   icon as before. */
export const HowItWorks = () => {
  const reduceMotion = useReducedMotion();

  return (
    <section className="relative py-16 sm:py-24 bg-gradient-to-b from-white via-[#FAFAFA] to-white">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-12 sm:mb-14">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-red-600 mb-3"
          >
            How it works
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900"
          >
            From <span className="gradient-text">prompt</span> to{" "}
            <span className="gradient-text">product</span> in three steps.
          </motion.h2>
        </div>

        <div className="relative max-w-5xl mx-auto">
          {/* Connecting line — desktop only (md+). */}
          {!reduceMotion && (
            <svg
              aria-hidden
              className="hidden md:block absolute top-12 left-[16%] right-[16%] h-3 pointer-events-none"
              viewBox="0 0 800 12"
              preserveAspectRatio="none"
            >
              <defs>
                <linearGradient id="howline" x1="0%" y1="0%" x2="100%" y2="0%">
                  <stop offset="0%"  stopColor="#DC2626" />
                  <stop offset="50%" stopColor="#991B1B" />
                  <stop offset="100%" stopColor="#0A0A0A" />
                </linearGradient>
              </defs>
              <motion.path
                d="M0,6 C200,6 200,6 400,6 C600,6 600,6 800,6"
                stroke="url(#howline)"
                strokeWidth="2"
                strokeLinecap="round"
                strokeDasharray="6 8"
                fill="none"
                initial={{ pathLength: 0, opacity: 0.2 }}
                whileInView={{ pathLength: 1, opacity: 0.9 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 1.4, ease: "easeInOut" }}
              />
            </svg>
          )}

          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 md:gap-8 relative">
            {STEPS.map((step, idx) => {
              const Icon = step.icon;
              return (
                <motion.div
                  key={step.title}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true, margin: "-80px" }}
                  transition={{ duration: 0.5, delay: idx * 0.1 }}
                  className="relative flex flex-col items-center text-center md:items-start md:text-left"
                >
                  {/* STEP n label — own block, fixed mb to ensure clean
                    * separation from the icon below. Never overlaps. */}
                  <span className={`block text-[11px] font-semibold uppercase tracking-[0.2em] ${step.tint.text} mb-3`}>
                    Step {idx + 1}
                  </span>

                  {/* Icon disc — 56px on mobile, 96px on desktop. ring-8
                    * ring-white only on md+ so the mobile disc doesn't
                    * get crowded by its halo. */}
                  <div
                    className={`inline-flex w-14 h-14 md:w-24 md:h-24 rounded-full ${step.tint.bg} md:ring-8 md:ring-white items-center justify-center shadow-[0_8px_30px_-10px_rgba(15,23,42,0.15)] mb-4 md:mb-6 relative z-10`}
                  >
                    <Icon className={`w-6 h-6 md:w-10 md:h-10 ${step.tint.text}`} />
                  </div>

                  <h3 className="text-2xl font-bold text-gray-900 tracking-tight mb-2 md:mb-3">
                    {step.title}
                  </h3>
                  <p className="text-base text-gray-600 leading-relaxed max-w-[360px] md:max-w-none">
                    {step.body}
                  </p>
                </motion.div>
              );
            })}
          </div>
        </div>
      </div>
    </section>
  );
};
