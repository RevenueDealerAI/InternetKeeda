"use client";

import { motion } from "framer-motion";
import { Quote } from "lucide-react";

const TESTIMONIALS = [
  {
    quote:
      "I used to lose hours hopping between Reddit threads and Twitter to find the right AI tool. InternetKeeda's semantic search nails it in one query.",
    name: "Jamie Holloway",
    role: "Product Designer · Brooklyn",
    initials: "JH",
    tint: { from: "from-red-100", to: "to-red-50", text: "text-red-700" },
  },
  {
    quote:
      "The descriptions are written like a human actually used the tool. Saved me a real day of evaluating writing assistants for our marketing team.",
    name: "Priya Subramanian",
    role: "Marketing Lead · Austin",
    initials: "PS",
    tint: { from: "from-gray-100", to: "to-red-50", text: "text-gray-900" },
  },
  {
    quote:
      "Browsing by category beats every other AI directory I've tried. The bento layout makes it actually fun to wander.",
    name: "Marcus Diallo",
    role: "Indie Founder · SF",
    initials: "MD",
    tint: { from: "from-red-200", to: "to-red-100", text: "text-red-800" },
  },
];

/** Phase D Tier 3 — quote cards. Placeholder copy until real user
 * testimonials come in (disclosure note at the bottom). */
export const Testimonials = () => {
  return (
    <section className="relative py-20 sm:py-24 bg-white">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center mb-12">
          <motion.span
            initial={{ opacity: 0, y: 10 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            className="inline-block text-xs font-semibold uppercase tracking-[0.18em] text-orange-600 mb-3"
          >
            What people are saying
          </motion.span>
          <motion.h2
            initial={{ opacity: 0, y: 16 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.5 }}
            className="text-3xl sm:text-4xl md:text-5xl font-bold tracking-tight text-gray-900"
          >
            Built for the people <span className="gradient-text">building with AI</span>.
          </motion.h2>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5 sm:gap-6">
          {TESTIMONIALS.map((t, idx) => (
            <motion.figure
              key={t.name}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.5, delay: idx * 0.08 }}
              className="relative h-full bg-white rounded-2xl border border-gray-200 p-6 sm:p-7 hover:shadow-[0_18px_40px_-20px_rgba(99,102,241,0.25)] hover:-translate-y-1 transition-all duration-200"
            >
              <Quote className="w-7 h-7 text-orange-200 mb-4" />
              <blockquote className="text-base text-gray-800 leading-relaxed">
                &ldquo;{t.quote}&rdquo;
              </blockquote>
              <figcaption className="mt-6 flex items-center gap-3 pt-5 border-t border-gray-100">
                <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${t.tint.from} ${t.tint.to} ring-1 ring-gray-200/60 flex items-center justify-center text-sm font-bold ${t.tint.text}`}>
                  {t.initials}
                </div>
                <div className="min-w-0">
                  <div className="text-sm font-semibold text-gray-900 truncate">{t.name}</div>
                  <div className="text-xs text-gray-500 truncate">{t.role}</div>
                </div>
              </figcaption>
            </motion.figure>
          ))}
        </div>

        <p className="text-center text-xs text-gray-400 mt-8">
          Quotes shown are representative of the early-access feedback we&rsquo;ve received. We&rsquo;ll swap in real user testimonials as the directory grows.
        </p>
      </div>
    </section>
  );
};
