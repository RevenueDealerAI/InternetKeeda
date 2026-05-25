import React from 'react';
import Image from 'next/image';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { 
  Sparkles, 
  Users, 
  Target, 
  Rocket,
  Heart,
  Star,
  ArrowRight,
  Github,
  Twitter,
  Linkedin
} from 'lucide-react';

const AboutPage: React.FC = () => {
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

  const teamMembers = [
    {
      name: "John Smith",
      role: "Founder & CEO",
      image: "https://ui-avatars.com/api/?name=John+Smith&background=10b981&color=fff",
      twitter: "https://twitter.com/johnsmith",
      github: "https://github.com/johnsmith",
      linkedin: "https://linkedin.com/in/johnsmith"
    },
    {
      name: "Sarah Johnson",
      role: "Head of Product",
      image: "https://ui-avatars.com/api/?name=Sarah+Johnson&background=10b981&color=fff",
      twitter: "https://twitter.com/sarahjohnson",
      github: "https://github.com/sarahjohnson",
      linkedin: "https://linkedin.com/in/sarahjohnson"
    },
    {
      name: "Michael Chen",
      role: "Lead Developer",
      image: "https://ui-avatars.com/api/?name=Michael+Chen&background=10b981&color=fff",
      twitter: "https://twitter.com/michaelchen",
      github: "https://github.com/michaelchen",
      linkedin: "https://linkedin.com/in/michaelchen"
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
        <motion.div variants={itemVariants} className="inline-flex items-center justify-center p-2 rounded-2xl bg-gradient-to-r from-green-500/10 via-green-400/10 to-green-300/10 backdrop-blur-sm mb-6">
          <div className="px-4 py-1 rounded-xl bg-gradient-to-r from-green-500 to-green-600">
            <span className="text-white font-medium">About Internet Keeda</span>
          </div>
        </motion.div>
        <motion.h1 
          variants={itemVariants}
          className="text-4xl md:text-5xl font-bold mb-6 bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent"
        >
          Discover the Future of AI Tools
        </motion.h1>
        <motion.p 
          variants={itemVariants}
          className="text-xl text-gray-600 max-w-3xl mx-auto"
        >
          Internet Keeda is your premier destination for discovering and exploring the latest AI tools and technologies. We're dedicated to helping innovators, creators, and businesses harness the power of artificial intelligence.
        </motion.p>
      </motion.div>

      {/* Mission Section */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-16"
      >
        <motion.div 
          variants={itemVariants}
          className="p-6 rounded-2xl bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="h-12 w-12 rounded-2xl bg-green-100 flex items-center justify-center mb-4">
            <Target className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Our Mission</h3>
          <p className="text-gray-600">
            To curate and showcase the most innovative AI tools, making them accessible to everyone who wants to leverage artificial intelligence.
          </p>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="p-6 rounded-2xl bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="h-12 w-12 rounded-2xl bg-green-100 flex items-center justify-center mb-4">
            <Users className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Our Community</h3>
          <p className="text-gray-600">
            Join our thriving community of 50,000+ AI enthusiasts, developers, and industry professionals sharing insights and discoveries.
          </p>
        </motion.div>

        <motion.div 
          variants={itemVariants}
          className="p-6 rounded-2xl bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300"
        >
          <div className="h-12 w-12 rounded-2xl bg-green-100 flex items-center justify-center mb-4">
            <Rocket className="h-6 w-6 text-green-600" />
          </div>
          <h3 className="text-xl font-semibold mb-2">Our Vision</h3>
          <p className="text-gray-600">
            To become the world's most trusted platform for discovering and evaluating artificial intelligence tools and solutions.
          </p>
        </motion.div>
      </motion.div>

      {/* Stats Section */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-2 md:grid-cols-4 gap-8 mb-16"
      >
        {[
          { icon: Sparkles, value: "1,000+", label: "AI Tools Listed", color: "green" },
          { icon: Users, value: "50K+", label: "Community Members", color: "green" },
          { icon: Star, value: "100K+", label: "Monthly Visits", color: "green" },
          { icon: Heart, value: "10K+", label: "User Reviews", color: "green" }
        ].map((stat, index) => (
          <motion.div
            key={index}
            variants={itemVariants}
            className="text-center p-6 rounded-2xl bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300"
          >
            <div className={`h-12 w-12 rounded-2xl bg-${stat.color}-100 flex items-center justify-center mb-4 mx-auto`}>
              <stat.icon className={`h-6 w-6 text-${stat.color}-600`} />
            </div>
            <h4 className="text-2xl font-bold mb-1 bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent">
              {stat.value}
            </h4>
            <p className="text-gray-600">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* Team Section */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="mb-16"
      >
        <motion.h2 
          variants={itemVariants}
          className="text-3xl font-bold text-center mb-12 bg-gradient-to-r from-green-600 to-green-500 bg-clip-text text-transparent"
        >
          Meet Our Team
        </motion.h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {teamMembers.map((member, index) => (
            <motion.div
              key={index}
              variants={itemVariants}
              className="text-center p-6 rounded-2xl bg-white border border-gray-200 shadow-lg hover:shadow-xl transition-all duration-300"
            >
              <div className="relative w-24 h-24 rounded-full mx-auto mb-4 border-4 border-green-100 overflow-hidden">
                <Image
                  src={member.image}
                  alt={member.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
              <h3 className="text-xl font-semibold mb-1">{member.name}</h3>
              <p className="text-gray-600 mb-4">{member.role}</p>
              <div className="flex justify-center gap-4">
                <a href={member.twitter} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="rounded-full hover:text-blue-400">
                    <Twitter className="h-5 w-5" />
                  </Button>
                </a>
                <a href={member.github} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="rounded-full hover:text-gray-900">
                    <Github className="h-5 w-5" />
                  </Button>
                </a>
                <a href={member.linkedin} target="_blank" rel="noopener noreferrer">
                  <Button variant="ghost" size="icon" className="rounded-full hover:text-blue-600">
                    <Linkedin className="h-5 w-5" />
                  </Button>
                </a>
              </div>
            </motion.div>
          ))}
        </div>
      </motion.div>

      {/* CTA Section */}
      <motion.div 
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="text-center"
      >
        <motion.div 
          variants={itemVariants}
          className="max-w-3xl mx-auto p-8 rounded-2xl bg-gradient-to-r from-orange-500/10 via-fuchsia-500/10 to-blue-500/10 backdrop-blur-sm"
        >
          <h2 className="text-2xl md:text-3xl font-bold mb-4 bg-gradient-to-r from-orange-600 to-blue-600 bg-clip-text text-transparent">
            Join Our Community
          </h2>
          <p className="text-gray-600 mb-6">
            Be part of our growing community and stay updated with the latest in AI technology.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Button 
              variant="outline" 
              className="border-orange-200 hover:bg-orange-50"
              asChild
            >
              <a href="/guides">
                Learn More
                <ArrowRight className="ml-2 h-4 w-4" />
              </a>
            </Button>
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
};

export default AboutPage; 