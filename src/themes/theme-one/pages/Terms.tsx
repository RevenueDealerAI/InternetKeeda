import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Scale,
  Mail,
  ArrowRight,
  FileText
} from 'lucide-react';

const TermsPage: React.FC = () => {
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

  const sections = [
    {
      title: "1. Acceptance of Terms",
      content: `By accessing or using AI Tool Finder, you agree to be bound by these Terms of Service and all applicable laws and regulations. If you do not agree with any of these terms, you are prohibited from using or accessing this site.

We reserve the right to modify these terms at any time, and we'll always post the most current version on our website.`
    },
    {
      title: "2. User Accounts",
      content: `When you create an account with us, you must provide accurate and complete information. You are responsible for maintaining the security of your account and password.

You agree to notify us immediately of any unauthorized access to or use of your account. We reserve the right to terminate accounts, remove content, or cancel orders at our discretion.`
    },
    {
      title: "3. Content Guidelines",
      content: `Users may submit AI tools, reviews, and comments ("Content") to the platform. By submitting Content, you grant us a worldwide, non-exclusive, royalty-free license to use, reproduce, and distribute such Content.

You agree not to submit Content that:
• Is false, misleading, or deceptive
• Infringes on intellectual property rights
• Contains malware or harmful code
• Violates any applicable laws or regulations`
    },
    {
      title: "4. Intellectual Property",
      content: `The AI Tool Finder platform, including its original content, features, and functionality, is owned by AI Tool Finder and protected by international copyright, trademark, and other intellectual property laws.

Our trademarks and trade dress may not be used in connection with any product or service without our prior written consent.`
    },
    {
      title: "5. Limitation of Liability",
      content: `AI Tool Finder is provided "as is" without any warranties, expressed or implied. We do not warrant that the platform will be error-free or uninterrupted.

In no event shall AI Tool Finder be liable for any indirect, incidental, special, consequential, or punitive damages arising out of or relating to your use of the platform.`
    },
    {
      title: "6. Third-Party Links",
      content: `Our platform may contain links to third-party websites or services not owned or controlled by AI Tool Finder. We have no control over and assume no responsibility for the content, privacy policies, or practices of any third-party sites or services.

You acknowledge and agree that AI Tool Finder shall not be responsible or liable for any damage or loss caused by the use of such third-party services.`
    }
  ];

  const lastUpdated = "December 1, 2023";

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
            <span className="text-white font-medium">Terms of Service</span>
          </div>
        </motion.div>
        <motion.h1 
          variants={itemVariants}
          className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent"
        >
          Terms of Service
        </motion.h1>
        <motion.p 
          variants={itemVariants}
          className="text-xl text-gray-600 max-w-3xl mx-auto"
        >
          Please read these terms carefully before using AI Tool Finder. By using our platform, you agree to these terms.
        </motion.p>
        <motion.p
          variants={itemVariants}
          className="text-sm text-gray-500 mt-4"
        >
          Last Updated: {lastUpdated}
        </motion.p>
      </motion.div>

      {/* Content Sections */}
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="max-w-4xl mx-auto"
      >
        {sections.map((section, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="mb-12 p-8 rounded-2xl bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <h2 className="text-2xl font-bold mb-4 bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
              {section.title}
            </h2>
            <div className="text-gray-600 whitespace-pre-line">
              {section.content}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {/* Contact Section */}
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
            Have Questions?
          </h2>
          <p className="text-gray-600 mb-6">
            If you have any questions about our Terms of Service, please contact our legal team.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700">
              <Mail className="mr-2 h-4 w-4" />
              Contact Legal Team
            </Button>
            <Button variant="outline" className="border-green-200 hover:bg-green-50">
              Download Terms
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default TermsPage; 