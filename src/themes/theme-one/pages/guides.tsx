import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  Code,
  Lightbulb,
  Rocket,
  Bot,
  Image,
  Video,
  MessageSquare,
  ArrowRight
} from 'lucide-react';

const GuidesPage: React.FC = () => {
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

  const guides = [
    {
      title: "Getting Started with AI Tools",
      description: "Learn the basics of AI tools and how to choose the right ones for your needs.",
      icon: Rocket,
      category: "Beginners",
      readTime: "5 min read"
    },
    {
      title: "AI for Developers",
      description: "Integrate AI capabilities into your applications with our comprehensive guide.",
      icon: Code,
      category: "Development",
      readTime: "10 min read"
    },
    {
      title: "Chatbot Implementation",
      description: "Step-by-step guide to implementing AI chatbots for customer service.",
      icon: Bot,
      category: "Implementation",
      readTime: "8 min read"
    },
    {
      title: "AI Image Generation",
      description: "Master the art of generating images using AI tools and techniques.",
      icon: Image,
      category: "Creative",
      readTime: "7 min read"
    },
    {
      title: "Video Creation with AI",
      description: "Learn how to create and edit videos using AI-powered tools.",
      icon: Video,
      category: "Creative",
      readTime: "12 min read"
    },
    {
      title: "AI Writing Assistant",
      description: "Enhance your writing with AI tools and techniques.",
      icon: MessageSquare,
      category: "Productivity",
      readTime: "6 min read"
    }
  ];

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
                AI-Hunt Guides
              </span>
            </div>
          </motion.div>
          <motion.h1
            variants={itemVariants}
            className="text-3xl sm:text-4xl md:text-5xl font-bold mb-4 sm:mb-6"
            style={{ color: 'var(--accent)' }}
          >
            Learn How to Master AI Tools
          </motion.h1>
          <motion.p
            variants={itemVariants}
            className="text-base sm:text-lg md:text-xl max-w-3xl mx-auto"
            style={{ color: 'var(--ink-2)' }}
          >
            Comprehensive guides to help you understand and leverage the power of artificial intelligence tools in your workflow.
          </motion.p>
        </motion.div>

        {/* Featured Guide */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="mb-12 sm:mb-16"
        >
          <motion.div
            variants={itemVariants}
            className="p-6 sm:p-8 rounded-2xl backdrop-blur-sm"
            style={{
              background: 'var(--accent-soft)',
              border: '1px solid var(--rule)',
            }}
          >
            <div className="flex flex-col md:flex-row items-center gap-6 md:gap-8">
              <div
                className="h-14 w-14 sm:h-16 sm:w-16 rounded-2xl flex items-center justify-center shrink-0"
                style={{ background: 'var(--bg-2)', border: '1px solid var(--rule)' }}
              >
                <Lightbulb
                  className="h-7 w-7 sm:h-8 sm:w-8"
                  style={{ color: 'var(--accent)' }}
                />
              </div>
              <div className="flex-1 text-center md:text-left">
                <h2
                  className="text-xl sm:text-2xl font-bold mb-2"
                  style={{ color: 'var(--ink)' }}
                >
                  Ultimate Guide to AI Tools
                </h2>
                <p
                  className="mb-4 text-sm sm:text-base"
                  style={{ color: 'var(--ink-2)' }}
                >
                  A comprehensive overview of different AI tools and how to use them effectively in your projects.
                </p>
                <Button
                  className="font-semibold"
                  style={{
                    background: 'var(--accent)',
                    color: 'var(--on-accent)',
                  }}
                >
                  Read Guide
                  <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </div>
            </div>
          </motion.div>
        </motion.div>

        {/* Guide Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8"
        >
          {guides.map((guide, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="p-5 sm:p-6 rounded-2xl transition-all duration-300 hover:-translate-y-0.5"
              style={{
                background: 'var(--bg-2)',
                border: '1px solid var(--rule)',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div className="flex items-start gap-4">
                <div
                  className="h-12 w-12 rounded-2xl flex items-center justify-center shrink-0"
                  style={{
                    background: 'var(--accent-soft)',
                    border: '1px solid var(--rule)',
                  }}
                >
                  <guide.icon
                    className="h-6 w-6"
                    style={{ color: 'var(--accent)' }}
                  />
                </div>
                <div className="min-w-0">
                  <h3
                    className="text-lg sm:text-xl font-semibold mb-2"
                    style={{ color: 'var(--ink)' }}
                  >
                    {guide.title}
                  </h3>
                  <p
                    className="mb-4 text-sm sm:text-base"
                    style={{ color: 'var(--ink-2)' }}
                  >
                    {guide.description}
                  </p>
                  <div className="flex flex-wrap items-center gap-3 sm:gap-4 text-xs sm:text-sm">
                    <span
                      className="px-3 py-1 rounded-full font-medium"
                      style={{
                        background: 'var(--accent-soft)',
                        color: 'var(--accent)',
                      }}
                    >
                      {guide.category}
                    </span>
                    <span style={{ color: 'var(--ink-soft)' }}>
                      {guide.readTime}
                    </span>
                  </div>
                </div>
              </div>
            </motion.div>
          ))}
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
              Need More Help?
            </h2>
            <p
              className="mb-5 sm:mb-6 text-sm sm:text-base"
              style={{ color: 'var(--ink-2)' }}
            >
              Join our community to get help from AI experts and fellow enthusiasts.
            </p>
            <Button
              className="font-semibold"
              style={{
                background: 'var(--accent)',
                color: 'var(--on-accent)',
              }}
            >
              Join Community
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
};

export default GuidesPage;
