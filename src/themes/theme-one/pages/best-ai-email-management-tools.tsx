import React, { useState, useEffect } from "react";
import Link from 'next/link';
import Image from 'next/image';
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import {
  Check,
  Star,
  ChevronRight,
  Mail,
  Shield,
  Clock,
  FilePlus,
  Inbox,
  MessageCircle,
  ArrowRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
interface EmailTool {
  id: string;
  name: string;
  logo: string;
  description: string;
  rating: number;
  bestFor: string[];
  pros: string[];
  cons: string[];
  pricing: {
    free: boolean;
    startingPrice: string;
  };
  url: string;
  features: {
    autoResponses: boolean;
    emailSorting: boolean;
    scheduling: boolean;
    templates: boolean;
    spamProtection: boolean;
  };
}

const toolsList: EmailTool[] = [
  {
    id: "1",
    name: "Superhuman",
    logo: "https://logo.clearbit.com/superhuman.com",
    description: "The fastest email experience ever made, powered by AI to help you reach inbox zero and stay there.",
    rating: 4.8,
    bestFor: ["Professionals", "Executives", "Power users"],
    pros: ["Lightning fast interface", "Keyboard shortcuts", "Split inbox", "Smart follow-ups"],
    cons: ["High price point", "Invite-only access", "Limited integrations", "Learning curve"],
    pricing: {
      free: false,
      startingPrice: "$30/month"
    },
    url: "https://superhuman.com",
    features: {
      autoResponses: true,
      emailSorting: true,
      scheduling: true,
      templates: true,
      spamProtection: true
    }
  },
  {
    id: "2",
    name: "Front",
    logo: "https://logo.clearbit.com/frontapp.com",
    description: "Shared inbox for teams with AI capabilities to manage email, SMS, and messages together.",
    rating: 4.7,
    bestFor: ["Customer support", "Client communications", "Small teams"],
    pros: ["Great for team collaboration", "Multi-channel support", "Analytics", "Automation rules"],
    cons: ["Expensive for small teams", "Mobile app limitations", "Learning curve"],
    pricing: {
      free: false,
      startingPrice: "$19/user/month"
    },
    url: "https://frontapp.com",
    features: {
      autoResponses: true,
      emailSorting: true,
      scheduling: false,
      templates: true,
      spamProtection: true
    }
  },
  {
    id: "3",
    name: "SaneBox",
    logo: "https://logo.clearbit.com/sanebox.com",
    description: "AI email management that automatically filters unimportant emails and helps you process your inbox faster.",
    rating: 4.6,
    bestFor: ["Busy professionals", "Inbox zero enthusiasts", "Anyone with email overload"],
    pros: ["Works with any email provider", "Advanced filtering", "Email reminders", "One-click unsubscribe"],
    cons: ["Requires training period", "Occasional false positives", "Limited free tier"],
    pricing: {
      free: true,
      startingPrice: "$7/month"
    },
    url: "https://sanebox.com",
    features: {
      autoResponses: false,
      emailSorting: true,
      scheduling: true,
      templates: false,
      spamProtection: true
    }
  },
  {
    id: "4",
    name: "Twobird",
    logo: "https://logo.clearbit.com/twobird.com",
    description: "All-in-one workspace that combines email, notes, and to-dos with intelligent organization.",
    rating: 4.5,
    bestFor: ["Task-oriented users", "Note takers", "Gmail users"],
    pros: ["Clean interface", "Notes in email", "Reminders", "Collaborative"],
    cons: ["Limited to Gmail", "Fewer features than competitors", "No mobile app for Android"],
    pricing: {
      free: true,
      startingPrice: "Free"
    },
    url: "https://twobird.com",
    features: {
      autoResponses: false,
      emailSorting: true,
      scheduling: true,
      templates: false,
      spamProtection: true
    }
  },
  {
    id: "5",
    name: "Mailman",
    logo: "https://logo.clearbit.com/mailman.io",
    description: "Email management tool that batches your emails and delivers them at set times to reduce distractions.",
    rating: 4.5,
    bestFor: ["Focus-driven workers", "Digital minimalists", "Productivity enthusiasts"],
    pros: ["Scheduled deliveries", "VIP lists", "Do Not Disturb mode", "Daily summary"],
    cons: ["Limited AI features", "Gmail only", "Basic UI", "No mobile apps"],
    pricing: {
      free: false,
      startingPrice: "$8/month"
    },
    url: "https://mailman.io",
    features: {
      autoResponses: false,
      emailSorting: true,
      scheduling: true,
      templates: false,
      spamProtection: true
    }
  }
];

export default function BestAIEmailManagementTools() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  
  return (
    <>
      <Helmet>
        <title>Best AI Email Management Tools for 2025 — Internet Keeda</title>
        <meta name="description" content="Discover the best AI-powered email management tools that help you organize your inbox, automate responses, and save time." />
      </Helmet>

      {/* Hero Section with minimalist design */}
      <div className="bg-gradient-to-br from-blue-700 to-blue-900 text-white pt-36 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] opacity-5"></div>
        <motion.div 
          className="container mx-auto max-w-4xl relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col items-center text-center mb-12">
            <Badge className="mb-4 bg-blue-800/60 text-white px-4 py-1 text-sm font-medium">Email Management</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Best AI Email Management Tools for 2025
            </h1>
            <p className="text-lg text-blue-100 max-w-2xl leading-relaxed">
              Get through your inbox with ease and organization using AI-powered tools that sort, prioritize, and automate your email workflow.
            </p>
            <div className="mt-8 text-sm text-blue-200 flex items-center">
              <div className="relative w-8 h-8 rounded-full overflow-hidden mr-2 border-2 border-blue-400">
                <Image src="https://ui-avatars.com/api/?name=Sarah+Wilson&background=3B82F6&color=fff" alt="Sarah Wilson" fill className="object-cover" unoptimized />
              </div>
              <p>By Sarah Wilson • Last updated: May 2025</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Introduction with minimalist design */}
      <div className="py-16 px-4 bg-gray-50">
        <div className="container mx-auto max-w-3xl">
          <motion.div 
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            viewport={{ once: true }}
          >
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Take Back Control of Your Inbox</h2>
            <p className="text-gray-700 leading-relaxed mb-0">
              The average professional spends over 3 hours a day on email. AI-powered email management tools help you reclaim that time by automating sorting, prioritizing important messages, and handling routine responses.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Tool Reviews with cleaner design */}
      <div className="py-20 bg-white px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Best AI Email Management Tools</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">We've evaluated the leading AI-powered email solutions to help you find the perfect tool.</p>
          </div>
          
          {toolsList.map((tool, index) => (
            <motion.div 
              key={tool.id} 
              className="mb-16 border border-gray-100 rounded-xl overflow-hidden shadow-md hover:shadow-lg transition-all duration-300"
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              viewport={{ once: true, margin: "-100px" }}
            >
              {/* Tool Header with simplified design */}
              <div className="flex items-center gap-4 border-b border-gray-100 p-6 bg-white">
                <div className="w-14 h-14 bg-white rounded-lg flex items-center justify-center shadow-sm overflow-hidden border border-gray-100 relative">
                  <Image 
                    src={tool.logo} 
                    alt={tool.name} 
                    fill
                    className="object-contain p-2"
                    unoptimized
                  />
                </div>
                <div>
                  <div className="flex items-center">
                    <h3 className="text-xl font-bold text-gray-900">{tool.name}</h3>
                    <div className="ml-3 px-2 py-0.5 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
                      #{index + 1}
                    </div>
                  </div>
                  <div className="flex items-center mt-1">
                    <div className="flex">
                      {[...Array(5)].map((_, i) => (
                        <Star 
                          key={i} 
                          className={`w-4 h-4 ${i < Math.floor(tool.rating) ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`} 
                        />
                      ))}
                    </div>
                    <span className="text-sm ml-2 text-gray-700">{tool.rating.toFixed(1)}/5.0</span>
                  </div>
                </div>
                
                <div className="ml-auto">
                  <a href={tool.url} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-blue-600 hover:bg-blue-700 rounded-lg">
                      Visit Website <ArrowRight className="ml-2 w-4 h-4" />
                    </Button>
                  </a>
                </div>
              </div>

              {/* Tool Content with simplified design */}
              <div className="p-6">
                <p className="text-gray-700 leading-relaxed mb-8">{tool.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                  {/* Pros and Cons in two columns */}
                  <div className="bg-gray-50 p-5 rounded-lg">
                    <h4 className="font-semibold mb-4 text-gray-900 flex items-center">
                      <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-2">
                        <Check className="w-3 h-3 text-green-700" />
                      </span>
                      Pros
                    </h4>
                    <ul className="space-y-2">
                      {tool.pros.map((pro, i) => (
                        <li key={i} className="flex items-start text-sm">
                          <span className="w-5 h-5 mr-2 rounded-full bg-green-100 flex items-center justify-center mt-0">
                            <Check className="w-3 h-3 text-green-600" />
                          </span>
                          <span className="text-gray-800">{pro}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-5 rounded-lg">
                    <h4 className="font-semibold mb-4 text-gray-900 flex items-center">
                      <span className="w-5 h-5 rounded-full bg-red-100 flex items-center justify-center mr-2">
                        <X className="w-3 h-3 text-red-700" />
                      </span>
                      Cons
                    </h4>
                    <ul className="space-y-2">
                      {tool.cons.map((con, i) => (
                        <li key={i} className="flex items-start text-sm">
                          <span className="w-5 h-5 mr-2 rounded-full bg-red-100 flex items-center justify-center mt-0">
                            <X className="w-3 h-3 text-red-600" />
                          </span>
                          <span className="text-gray-800">{con}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
                
                {/* Features Icons with simplified design */}
                <div className="grid grid-cols-5 gap-3 mb-6 bg-gray-50 p-4 rounded-lg">
                  {[
                    { name: "Auto Responses", icon: <MessageCircle className="w-4 h-4" />, active: tool.features.autoResponses },
                    { name: "Email Sorting", icon: <Inbox className="w-4 h-4" />, active: tool.features.emailSorting },
                    { name: "Scheduling", icon: <Clock className="w-4 h-4" />, active: tool.features.scheduling },
                    { name: "Templates", icon: <FilePlus className="w-4 h-4" />, active: tool.features.templates },
                    { name: "Spam Protection", icon: <Shield className="w-4 h-4" />, active: tool.features.spamProtection }
                  ].map((feature, i) => (
                    <div key={i} className={`flex flex-col items-center p-3 rounded-lg ${feature.active ? 'text-blue-700' : 'text-gray-400'}`}>
                      {feature.icon}
                      <span className="text-xs font-medium text-center mt-1">{feature.name}</span>
                      {feature.active ? (
                        <div className="w-3 h-3 mt-1 rounded-full bg-blue-500"></div>
                      ) : (
                        <div className="w-3 h-3 mt-1 rounded-full bg-gray-300"></div>
                      )}
                    </div>
                  ))}
                </div>
                
                {/* Best suited for section */}
                <div className="mb-6">
                  <h4 className="font-semibold mb-3 text-gray-900 text-sm">Best For:</h4>
                  <div className="flex flex-wrap gap-2">
                    {tool.bestFor.map((user, i) => (
                      <Badge key={i} className="bg-blue-100 text-blue-800 font-medium">
                        {user}
                      </Badge>
                    ))}
                  </div>
                </div>
                
                {/* Footer with simplified design */}
                <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-100">
                  <div className="text-sm">
                    <span className="text-gray-500">Starting Price:</span>
                    <span className="ml-2 font-medium text-gray-900">{tool.pricing.startingPrice}</span>
                    {tool.pricing.free && (
                      <Badge className="ml-2 bg-green-100 text-green-800 font-medium">Free Plan</Badge>
                    )}
                  </div>
                  
                  <a href={tool.url} target="_blank" rel="noopener noreferrer">
                    <Button className="bg-blue-600 hover:bg-blue-700">
                      Try It Now
                    </Button>
                  </a>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Simplified Newsletter Signup */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-lg p-8 text-center shadow-lg">
            <h2 className="text-2xl font-bold mb-3 text-white">Join our newsletter</h2>
            <p className="text-blue-100 mb-6 max-w-2xl mx-auto">Get the latest updates on new AI tools delivered to your inbox.</p>
            <div className="flex max-w-md mx-auto gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-lg border-0 px-4 py-2 focus:ring-2 focus:ring-white focus:ring-opacity-50"
              />
              <Button className="bg-white text-blue-700 hover:bg-gray-100 rounded-lg px-4 py-2 font-medium">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}; 