import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import {
  HelpCircle,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useFAQs } from '@/lib/api/faq';
import { WhatsAppSupportButton } from '@/components/nexus/WhatsAppSupportButton';

/**
 * Hand-written sample FAQs shown when /api/faq returns no rows.
 * Mirrors the same shape the page consumes from the API (category +
 * questions[{q, a}]). Once real FAQs are seeded via /admin these
 * disappear automatically.
 */
const SAMPLE_FAQ_CATEGORIES: { title: string; questions: { q: string; a: string }[] }[] = [
  {
    title: 'Internet Keeda — the basics',
    questions: [
      {
        q: 'What is Internet Keeda?',
        a: 'Internet Keeda is a hand-curated atlas of the AI internet — 5,000+ AI tools across writing, design, code, audio, video, research, automation, and more. We are a hub, not a directory: humans actually using these tools decide what gets surfaced and what gets buried.',
      },
      {
        q: 'How is Internet Keeda different from other AI tool directories?',
        a: 'Most directories are scraped lists with no editorial position. We rank by humans who use the tools, write honest reviews (real strengths and real failure modes), and reject paid placements that misrepresent quality. Tools pay to be listed and to be boosted, but they cannot pay for a higher rating.',
      },
      {
        q: 'Is Internet Keeda free to use?',
        a: 'Browsing tools, reading reviews, comparing categories, and using AI Keeda (the agent) is free for everyone. Tool owners pay to list their tool ($10/month) or to boost visibility. End users never pay to access the catalogue.',
      },
    ],
  },
  {
    title: 'Listing your AI tool',
    questions: [
      {
        q: 'How do I list my AI tool on Internet Keeda?',
        a: 'Click "Submit your tool" from the top nav, fill in the listing form (name, URL, category, description, screenshots, pricing), and submit. Listings are reviewed by an editor before going live — most are approved within 24–48 hours. Spam and low-quality submissions are rejected outright.',
      },
      {
        q: 'What does it cost to list a tool?',
        a: 'The Monthly Listing is $10/month — that gets your tool into the catalogue and into category pages. Boosts are optional add-ons: Category Boost ($12 / 7 days), Home Boost ($30 / 7 days), Featured Badge ($60 / 30 days). All pricing is on the /advertise page.',
      },
      {
        q: 'How long does it take to get listed?',
        a: 'Most legitimate submissions go live within 24–48 hours of payment, after a quick editorial check. We do not auto-approve — that is the whole point. If your submission is borderline (vague descriptions, low-effort screenshots, broken links) we will ask for fixes before publishing.',
      },
      {
        q: 'Can I edit my listing after it is published?',
        a: 'Yes. Sign in with the email you used to submit, go to your dashboard, and edit the listing in place. Major changes (category swaps, new pricing) re-enter the editorial queue; minor copy and screenshot updates publish immediately.',
      },
    ],
  },
  {
    title: 'Reviews, ratings & moderation',
    questions: [
      {
        q: 'How are AI tools rated on Internet Keeda?',
        a: 'Editorial reviews are written by the Internet Keeda team — opinionated, hands-on, and explicitly not marketing reprints. Community reviews come from signed-in users with verified accounts; we weight them by usage signal and remove obvious astroturfing. Ratings are 0–5 in 0.1 increments.',
      },
      {
        q: 'Are reviews on Internet Keeda paid?',
        a: 'No. Tool owners can pay to be listed and to be boosted, but they cannot pay for a rating, a positive review, or to remove a critical one. Affiliate links on some reviews are disclosed with sponsored / nofollow rel attributes and do not change the editorial position.',
      },
      {
        q: 'Can I write a review of a tool?',
        a: 'Yes — sign in, open any tool page, and click "Write a review." Reviews are moderated to catch spam, fake claims, and brigading, but honest negative reviews are welcome. The platform is more useful with them than without them.',
      },
      {
        q: 'How do I report a misleading or fake listing?',
        a: 'Every tool page has a "Report this listing" link in the footer. Reports go to the editorial desk and we investigate within 48 hours. Substantiated reports get the listing pulled; recurring offenders get banned at the operator account level.',
      },
    ],
  },
  {
    title: 'AI Keeda — the agent',
    questions: [
      {
        q: 'What is AI Keeda?',
        a: 'AI Keeda is our in-house research agent. Ask it a question once ("what is the best AI for short-form video editing?") and it returns a curated stack of tools, real citations, and the trade-offs — instead of ten tabs you have to read yourself.',
      },
      {
        q: 'Is AI Keeda free?',
        a: 'Yes, with daily query limits for signed-out users. Signed-in users get higher limits. We have no paid tier for AI Keeda right now — if and when we do, it will be clearly labelled and the free tier will stay genuinely useful.',
      },
      {
        q: 'What model powers AI Keeda?',
        a: 'AI Keeda routes queries across multiple frontier models (we currently use Claude and GPT-class models behind the scenes) depending on the task. The model choice is part of the agent — you do not have to pick one.',
      },
    ],
  },
  {
    title: 'Billing, refunds & account',
    questions: [
      {
        q: 'What payment methods do you accept?',
        a: 'We accept all major credit cards via our payment processors (Cashfree in India, PayPal globally). Cards are stored by the processor, not by us. For volume / enterprise billing, contact the editorial desk.',
      },
      {
        q: 'Can I cancel my listing or boost at any time?',
        a: 'Yes. Monthly listings can be cancelled from your dashboard and stop billing at the next cycle. Boosts and Featured Badges are fixed-duration purchases (7 or 30 days) — you can stop renewing, but the active boost runs out its term.',
      },
      {
        q: 'Do you offer refunds?',
        a: 'Listings and boosts are non-refundable once active, but if your listing is rejected at the editorial review stage we refund automatically. If you believe a charge is wrong, email the support contact in your invoice — we do read those.',
      },
      {
        q: 'How do I delete my account?',
        a: 'Sign in, go to dashboard → settings → delete account. This removes your profile, your written reviews, and your active listings. Some transactional and tax records are retained per regulatory requirements; those are not visible publicly.',
      },
    ],
  },
];

const FAQPage: React.FC = () => {
  const { data, isLoading } = useFAQs();

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  const apiCategories = useMemo(() => {
    if (!data?.grouped) return [];
    return Object.entries(data.grouped).map(([category, faqs]) => ({
      title: category,
      questions: faqs.map(faq => ({
        q: faq.question,
        a: faq.answer,
      }))
    }));
  }, [data]);

  // Show DB-backed FAQs when present, fall back to hand-written
  // samples so the page reads complete even before any FAQ is seeded.
  const faqCategories = apiCategories.length > 0 ? apiCategories : SAMPLE_FAQ_CATEGORIES;

  return (
    <div
      className="min-h-screen"
      style={{ background: 'var(--bg)', color: 'var(--ink)' }}
    >
      <div className="container mx-auto px-4 py-8 mt-24">
        {/* Hero Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center mb-12 sm:mb-16"
        >
          <motion.div
            variants={itemVariants}
            className="inline-flex items-center justify-center p-2 rounded-2xl backdrop-blur-sm mb-6"
            style={{
              background: 'var(--accent-soft)',
              border: '1px solid var(--rule)',
            }}
          >
            <div
              className="px-4 py-1 rounded-xl"
              style={{ background: 'var(--accent)' }}
            >
              <span
                className="font-medium"
                style={{ color: 'var(--on-accent)' }}
              >
                FAQ
              </span>
            </div>
          </motion.div>
          <motion.h1
            variants={itemVariants}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6"
            style={{ color: 'var(--accent)' }}
          >
            Frequently Asked Questions
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg md:text-xl max-w-3xl mx-auto"
            style={{ color: 'var(--ink-2)' }}
          >
            Find answers to common questions about Internet Keeda, our tools, and how to make the most of our platform.
          </motion.p>
        </motion.div>

        {/* FAQ Categories */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="max-w-4xl mx-auto"
        >
          {isLoading ? (
            <div className="flex items-center justify-center h-96">
              <div
                className="animate-spin rounded-full h-8 w-8 border-b-2"
                style={{ borderColor: 'var(--accent)' }}
              ></div>
            </div>
          ) : (
            faqCategories.map((category, index) => (
              <motion.div
                key={index}
                variants={itemVariants}
                className="mb-10 sm:mb-12"
              >
                <h2
                  className="text-xl sm:text-2xl font-bold mb-4 sm:mb-6"
                  style={{ color: 'var(--accent)' }}
                >
                  {category.title}
                </h2>
                <Accordion type="single" collapsible className="space-y-3 sm:space-y-4">
                  {category.questions.map((item, qIndex) => (
                    <AccordionItem
                      key={qIndex}
                      value={`${index}-${qIndex}`}
                      className="rounded-xl overflow-hidden transition-all duration-300"
                      style={{
                        background: 'var(--bg-2)',
                        border: '1px solid var(--rule)',
                        boxShadow: 'var(--shadow-sm)',
                      }}
                    >
                      <AccordionTrigger className="px-4 sm:px-6 py-4 text-left hover:no-underline">
                        <div className="flex items-center gap-3">
                          <HelpCircle
                            className="h-5 w-5 shrink-0"
                            style={{ color: 'var(--accent)' }}
                          />
                          <span
                            className="font-medium text-sm sm:text-base"
                            style={{ color: 'var(--ink)' }}
                          >
                            {item.q}
                          </span>
                        </div>
                      </AccordionTrigger>
                      <AccordionContent
                        className="px-4 sm:px-6 pb-4 pt-2 text-sm sm:text-base leading-[1.65]"
                        style={{ color: 'var(--ink-2)' }}
                      >
                        {item.a}
                      </AccordionContent>
                    </AccordionItem>
                  ))}
                </Accordion>
              </motion.div>
            ))
          )}
        </motion.div>

        {/* CTA Section */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="text-center mt-12 sm:mt-16"
        >
          <motion.div
            variants={itemVariants}
            className="max-w-3xl mx-auto p-6 sm:p-8 rounded-2xl backdrop-blur-sm"
            style={{
              background: 'var(--accent-soft)',
              border: '1px solid var(--rule)',
            }}
          >
            <h2
              className="text-xl sm:text-2xl md:text-3xl font-bold mb-3 sm:mb-4"
              style={{ color: 'var(--accent)' }}
            >
              Still Have Questions?
            </h2>
            <p
              className="mb-5 sm:mb-6 text-sm sm:text-base"
              style={{ color: 'var(--ink-2)' }}
            >
              Can&apos;t find the answer you&apos;re looking for? Ping Riley on
              WhatsApp — that&apos;s where our support actually lives.
            </p>
            <div className="flex flex-wrap justify-center gap-3 sm:gap-4">
              <WhatsAppSupportButton label="Chat with Riley on WhatsApp" />
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default FAQPage;
