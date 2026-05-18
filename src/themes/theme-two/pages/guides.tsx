import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  BookOpen,
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
    <div className="container mx-auto px-4 py-8 mt-24">
      {/* Hero Section */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center mb-16"
      >
        <motion.div variants={itemVariants} className="inline-flex items-center justify-center p-2 rounded-2xl bg-gradient-to-r from-purple-500/10 via-fuchsia-500/10 to-blue-500/10 backdrop-blur-sm mb-6">
          <div className="px-4 py-1 rounded-xl bg-gradient-to-r from-purple-500 via-fuchsia-500 to-blue-600">
            <span className="text-white font-medium">AI-Hunt Guides</span>
          </div>
        </motion.div>
        <motion.h1 
          variants={itemVariants}
          className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-purple-600 via-fuchsia-500 to-blue-600 bg-clip-text text-transparent"
        >
          Learn How to Master AI Tools
        </motion.h1>
        <motion.p 
          variants={itemVariants}
          className="text-xl text-gray-600 max-w-3xl mx-auto"
        >
          Comprehensive guides to help you understand and leverage the power of artificial intelligence tools in your workflow.
        </motion.p>
      </motion.div>

      {/* Featured Guide */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mb-16"
      >
        <motion.div
          variants={itemVariants}
          className="p-8 rounded-2xl bg-gradient-to-r from-purple-500/10 via-fuchsia-500/10 to-blue-500/10 backdrop-blur-sm border border-gray-200/50"
        >
          <div className="flex flex-col md:flex-row items-center gap-8">
            <div className="h-16 w-16 rounded-2xl bg-purple-100 flex items-center justify-center">
              <Lightbulb className="h-8 w-8 text-purple-600" />
            </div>
            <div className="flex-1 text-center md:text-left">
              <h2 className="text-2xl font-bold mb-2">Ultimate Guide to AI Tools</h2>
              <p className="text-gray-600 mb-4">
                A comprehensive overview of different AI tools and how to use them effectively in your projects.
              </p>
              <Button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white">
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
        className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
      >
        {guides.map((guide, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="p-6 rounded-2xl bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-2xl bg-purple-100 flex items-center justify-center shrink-0">
                <guide.icon className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="text-xl font-semibold mb-2">{guide.title}</h3>
                <p className="text-gray-600 mb-4">{guide.description}</p>
                <div className="flex items-center gap-4 text-sm">
                  <span className="px-3 py-1 rounded-full bg-purple-100 text-purple-600 font-medium">
                    {guide.category}
                  </span>
                  <span className="text-gray-500">
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
        className="text-center mt-16"
      >
        <motion.div 
          variants={itemVariants}
          className="max-w-3xl mx-auto p-8 rounded-2xl bg-gradient-to-r from-purple-500/10 via-fuchsia-500/10 to-blue-500/10 backdrop-blur-sm"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
            Need More Help?
          </h2>
          <p className="text-gray-600 mb-6">
            Join our community to get help from AI experts and fellow enthusiasts.
          </p>
          <Button className="bg-gradient-to-r from-purple-600 to-blue-600 text-white hover:from-purple-700 hover:to-blue-700">
            Join Community
            <ArrowRight className="ml-2 h-4 w-4" />
          </Button>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default GuidesPage; 