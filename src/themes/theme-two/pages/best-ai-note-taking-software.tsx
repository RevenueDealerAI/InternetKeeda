import React, { useState, useEffect } from "react";
import Image from 'next/image';
import Link from 'next/link'
import { motion } from "framer-motion";
import { Helmet } from "react-helmet";
import {
  Check,
  Star,
  ChevronRight,
  Brain,
  Pencil,
  Search,
  Users,
  Sparkles,
  Zap,
  ArrowRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
interface NoteTakingTool {
  id: string;
  name: string;
  logo: string;
  description: string;
  rating: number;
  bestFor: string[];
  pricing: {
    free: boolean;
    startingPrice: string;
  };
  url: string;
  features: {
    smartWriting: boolean;
    autoOrganization: boolean;
    smartSearch: boolean;
    aiSuggestions: boolean;
    collaboration: boolean;
  };
  keyFeatures: string[];
  pros: string[];
  cons: string[];
}

const toolsList: NoteTakingTool[] = [
  {
    id: "1",
    name: "Notion AI",
    logo: "https://logo.clearbit.com/notion.so",
    description: "A powerful workspace that enhances note-taking with smart writing capabilities, automations, and organization.",
    rating: 4.8,
    bestFor: ["Knowledge management", "Team collaboration", "Project docs"],
    pricing: {
      free: true,
      startingPrice: "$8/month + $10/month for AI"
    },
    url: "https://notion.so",
    features: {
      smartWriting: true,
      autoOrganization: true,
      smartSearch: true,
      aiSuggestions: true,
      collaboration: true
    },
    keyFeatures: [
      "AI writing assistant",
      "Smart suggestions",
      "Content summarization",
      "Meeting notes help",
      "Database generation"
    ],
    pros: [
      "Powerful AI features",
      "Flexible templates",
      "Mobile apps",
      "Great integrations",
      "Excellent free tier"
    ],
    cons: [
      "Learning curve",
      "Can feel overwhelming",
      "AI features cost extra",
      "Mobile app can be slow"
    ]
  },
  {
    id: "2",
    name: "Mem.ai",
    logo: "https://logo.clearbit.com/mem.ai",
    description: "AI note-taking app that automatically organizes your thoughts and creates connections between notes.",
    rating: 4.7,
    bestFor: ["Personal knowledge", "Research", "Networked organization"],
    pricing: {
      free: true,
      startingPrice: "$8/month"
    },
    url: "https://mem.ai",
    features: {
      smartWriting: true,
      autoOrganization: true,
      smartSearch: true,
      aiSuggestions: true,
      collaboration: true
    },
    keyFeatures: [
      "AI organization",
      "Networked thinking",
      "Projects",
      "Smart search",
      "Timeline organization"
    ],
    pros: [
      "Powerful AI search",
      "Natural writing flow",
      "Good for ADHD",
      "Auto-organization"
    ],
    cons: [
      "Lacks formatting options",
      "Limited offline mode",
      "Basic collaboration",
      "Less structured than alternatives"
    ]
  },
  {
    id: "3",
    name: "Reflect",
    logo: "https://logo.clearbit.com/reflect.app",
    description: "Networked note-taking app that helps you build a personal knowledge base with automatic connections.",
    rating: 4.6,
    bestFor: ["Personal knowledge", "Networked thinking", "Daily notes"],
    pricing: {
      free: false,
      startingPrice: "$15/month"
    },
    url: "https://reflect.app",
    features: {
      smartWriting: true,
      autoOrganization: true,
      smartSearch: true,
      aiSuggestions: true,
      collaboration: false
    },
    keyFeatures: [
      "Networked notes",
      "Automatic connections",
      "Graph view",
      "Daily journaling",
      "Smart summaries"
    ],
    pros: [
      "Clean interface",
      "Auto-connections",
      "Great for research",
      "Focus on privacy"
    ],
    cons: [
      "No free tier",
      "Limited export options",
      "No team features",
      "Fewer integrations"
    ]
  },
  {
    id: "4",
    name: "Tana",
    logo: "https://logo.clearbit.com/tana.inc",
    description: "A structured personal knowledge management system with rich data and smart organization.",
    rating: 4.6,
    bestFor: ["Knowledge management", "Project management", "Research"],
    pricing: {
      free: false,
      startingPrice: "$10/month"
    },
    url: "https://tana.inc",
    features: {
      smartWriting: true,
      autoOrganization: true,
      smartSearch: true,
      aiSuggestions: true,
      collaboration: false
    },
    keyFeatures: [
      "Smart templates",
      "Powerful organization",
      "Flexible structure",
      "Knowledge graphs",
      "Tagged content"
    ],
    pros: [
      "Powerful organization",
      "Flexible structures",
      "Great for complex data",
      "Strong search"
    ],
    cons: [
      "Steep learning curve",
      "No free tier",
      "Limited mobile apps",
      "Complex for simple notes"
    ]
  },
  {
    id: "5",
    name: "Anytype",
    logo: "https://logo.clearbit.com/anytype.io",
    description: "Privacy-focused note-taking app with AI features and local-first storage approach.",
    rating: 4.5,
    bestFor: ["Privacy-focused users", "Personal knowledge", "Research"],
    pricing: {
      free: true,
      startingPrice: "Free, open source"
    },
    url: "https://anytype.io",
    features: {
      smartWriting: true,
      autoOrganization: true,
      smartSearch: true,
      aiSuggestions: true,
      collaboration: false
    },
    keyFeatures: [
      "Local-first storage",
      "Open source",
      "Custom objects",
      "Encrypted notes",
      "Offline access"
    ],
    pros: [
      "Privacy focused",
      "Complete ownership",
      "No subscription",
      "Local-first approach"
    ],
    cons: [
      "Early development",
      "Limited mobile apps",
      "Basic AI features",
      "Fewer integrations"
    ]
  }
];

export default function BestAINoteTrackingSoftware() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  
  return (
    <>
      <Helmet>
        <title>Best AI Note-Taking Software for 2025 - AI Hunt</title>
        <meta name="description" content="Discover AI-powered note-taking tools that help you capture, organize, and enhance your thoughts with intelligent features." />
      </Helmet>
      
      <div className="min-h-screen bg-white">
        {/* Hero Section with minimalist design */}
        <div className="bg-gradient-to-br from-purple-700 to-purple-900 text-white pt-36 pb-20 px-4 relative overflow-hidden">
          <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] opacity-5"></div>
          <motion.div 
            className="container mx-auto max-w-4xl relative z-10"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <div className="flex flex-col items-center text-center mb-12">
              <Badge className="mb-4 bg-purple-800/60 text-white px-4 py-1 text-sm font-medium">AI-Powered Productivity</Badge>
              <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
                Best AI Note-Taking Software for 2025
              </h1>
              <p className="text-lg text-purple-100 max-w-2xl leading-relaxed">
                Discover intelligent note-taking tools that help you capture, organize, and enhance your thoughts.
              </p>
              <div className="mt-8 text-sm text-purple-200 flex items-center">
                <div className="relative w-8 h-8 rounded-full overflow-hidden mr-2 border-2 border-purple-400"><Image src="https://ui-avatars.com/api/?name=Emily+Chen&background=6466F1&color=fff" alt="Emily Chen" fill className="object-cover" unoptimized /></div>
                <p>By Emily Chen • Last updated: May 2025</p>
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
              <h2 className="text-2xl font-bold mb-6 text-gray-900">The AI Revolution in Note-Taking</h2>
              <p className="text-gray-700 leading-relaxed mb-0">
                AI note-taking software revolutionizes how we capture and organize information, helping you focus on thinking and creating while the AI handles organization.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Tool Reviews with cleaner design */}
        <div className="py-20 bg-white px-4">
          <div className="container mx-auto max-w-4xl">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold mb-4">Best AI Note-Taking Tools</h2>
              <p className="text-gray-600 max-w-2xl mx-auto">We've evaluated the leading AI-powered note-taking solutions to help you find the perfect tool.</p>
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
                      <div className="ml-3 px-2 py-0.5 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
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
                      <Button className="bg-purple-600 hover:bg-purple-700 rounded-lg">
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
                      { name: "Smart Writing", icon: <Pencil className="w-4 h-4" />, active: tool.features.smartWriting },
                      { name: "Auto Organization", icon: <Zap className="w-4 h-4" />, active: tool.features.autoOrganization },
                      { name: "Smart Search", icon: <Search className="w-4 h-4" />, active: tool.features.smartSearch },
                      { name: "AI Suggestions", icon: <Sparkles className="w-4 h-4" />, active: tool.features.aiSuggestions },
                      { name: "Collaboration", icon: <Users className="w-4 h-4" />, active: tool.features.collaboration }
                    ].map((feature, i) => (
                      <div key={i} className={`flex flex-col items-center p-3 rounded-lg ${feature.active ? 'text-green-700' : 'text-gray-400'}`}>
                        {feature.icon}
                        <span className="text-xs font-medium text-center mt-1">{feature.name}</span>
                        {feature.active ? (
                          <div className="w-3 h-3 mt-1 rounded-full bg-green-500"></div>
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
                      <Button className="bg-purple-600 hover:bg-purple-700">
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
            <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-8 text-center shadow-lg">
              <h2 className="text-2xl font-bold mb-3 text-white">Join our newsletter</h2>
              <p className="text-purple-100 mb-6 max-w-2xl mx-auto">Get the latest updates on new AI tools delivered to your inbox.</p>
              <div className="flex max-w-md mx-auto gap-3">
                <input
                  type="email"
                  placeholder="Enter your email"
                  className="flex-1 rounded-lg border-0 px-4 py-2 focus:ring-2 focus:ring-white focus:ring-opacity-50"
                />
                <Button className="bg-white text-purple-700 hover:bg-gray-100 rounded-lg px-4 py-2 font-medium">
                  Subscribe
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}; 