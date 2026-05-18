import React, { useMemo } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
  HelpCircle,
  MessageSquare,
  ArrowRight,
} from 'lucide-react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useFAQs } from '@/lib/api/faq';

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

  const faqCategories = useMemo(() => {
    if (!data?.grouped) return [];
    
    return Object.entries(data.grouped).map(([category, faqs]) => ({
      title: category,
      questions: faqs.map(faq => ({
        q: faq.question,
        a: faq.answer,
      }))
    }));
  }, [data]);

  return (
    <div className="container mx-auto px-4 py-8 mt-24">
      {/* Hero Section */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center mb-16"
      >
        <motion.div variants={itemVariants} className="inline-flex items-center justify-center p-2 rounded-2xl bg-gradient-to-r from-green-500/10 via-green-400/10 to-green-300/10 backdrop-blur-sm mb-6">
          <div className="px-4 py-1 rounded-xl bg-gradient-to-r from-green-500 to-green-600">
            <span className="text-white font-medium">FAQ</span>
          </div>
        </motion.div>
        <motion.h1 
          variants={itemVariants}
          className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent"
        >
          Frequently Asked Questions
        </motion.h1>
        <motion.p 
          variants={itemVariants}
          className="text-xl text-gray-600 max-w-3xl mx-auto"
        >
          Find answers to common questions about AI Tool Finder, our tools, and how to make the most of our platform.
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
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          </div>
        ) : faqCategories.length === 0 ? (
          <div className="text-center py-12">
            <HelpCircle className="h-12 w-12 mx-auto mb-4 text-gray-400" />
            <p className="text-gray-600">No FAQs available at the moment.</p>
          </div>
        ) : (
          faqCategories.map((category, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="mb-12"
          >
            <h2 className="text-2xl font-bold mb-6 bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
              {category.title}
            </h2>
            <Accordion type="single" collapsible className="space-y-4">
              {category.questions.map((item, qIndex) => (
                <AccordionItem
                  key={qIndex}
                  value={`${index}-${qIndex}`}
                  className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-all duration-300"
                >
                  <AccordionTrigger className="px-6 py-4 text-left hover:no-underline">
                    <div className="flex items-center gap-3">
                      <HelpCircle className="h-5 w-5 text-green-600 shrink-0" />
                      <span className="font-medium text-gray-900">{item.q}</span>
                    </div>
                  </AccordionTrigger>
                  <AccordionContent className="px-6 pb-4 pt-2 text-gray-600">
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
        className="text-center mt-16"
      >
        <motion.div 
          variants={itemVariants}
          className="max-w-3xl mx-auto p-8 rounded-2xl bg-gradient-to-r from-green-500/10 via-green-400/10 to-green-300/10 backdrop-blur-sm"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
            Still Have Questions?
          </h2>
          <p className="text-gray-600 mb-6">
            Can't find the answer you're looking for? Reach out to our community or contact our support team.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button className="bg-gradient-to-r from-green-600 to-green-500 text-white hover:from-green-700 hover:to-green-700">
              <MessageSquare className="mr-2 h-4 w-4" />
              Contact Support
            </Button>
            <Button variant="outline" className="border-green-200 hover:bg-green-50">
              Visit Help Center
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default FAQPage; 