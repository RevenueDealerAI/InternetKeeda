import React from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Shield,
  Mail,
  ArrowRight
} from 'lucide-react';

const PrivacyPolicyPage: React.FC = () => {
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
      title: "Information We Collect",
      content: `We collect information that you provide directly to us, including:
        • Account information (name, email, password)
        • Profile information (avatar, bio, preferences)
        • Usage data (interactions, reviews, comments)
        • Device and browser information
        • Cookies and similar tracking technologies`
    },
    {
      title: "How We Use Your Information",
      content: `We use the collected information for:
        • Providing and improving our services
        • Personalizing your experience
        • Communicating with you
        • Analytics and research
        • Security and fraud prevention`
    },
    {
      title: "Information Sharing",
      content: `We may share your information with:
        • Service providers and partners
        • Legal authorities when required
        • Other users (only public profile information)
        We never sell your personal information to third parties.`
    },
    {
      title: "Data Security",
      content: `We implement appropriate security measures to protect your information:
        • Encryption of sensitive data
        • Regular security audits
        • Access controls and monitoring
        • Secure data storage practices`
    },
    {
      title: "Your Rights",
      content: `You have the right to:
        • Access your personal information
        • Correct inaccurate data
        • Request deletion of your data
        • Opt-out of marketing communications
        • Export your data`
    },
    {
      title: "Cookie Policy",
      content: `We use cookies to:
        • Maintain your session
        • Remember your preferences
        • Analyze site usage
        • Improve user experience
        You can control cookie settings in your browser.`
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
            <span className="text-white font-medium">Privacy Policy</span>
          </div>
        </motion.div>
        <motion.h1 
          variants={itemVariants}
          className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent"
        >
          Privacy Policy
        </motion.h1>
        <motion.p 
          variants={itemVariants}
          className="text-xl text-gray-600 max-w-3xl mx-auto"
        >
          We are committed to protecting your privacy and ensuring the security of your personal information.
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
            Privacy Questions?
          </h2>
          <p className="text-gray-600 mb-6">
            If you have any questions about our privacy policy or how we handle your data, please contact our privacy team.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700">
              <Mail className="mr-2 h-4 w-4" />
              Contact Privacy Team
            </Button>
            <Button variant="outline" className="border-green-200 hover:bg-green-50">
              Download Privacy Policy
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default PrivacyPolicyPage; 