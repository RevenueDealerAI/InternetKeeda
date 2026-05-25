import React, { useState, useEffect } from "react";
import Image from 'next/image';
import Link from 'next/link'
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import {
  Check,
  Star,
  ChevronRight,
  Calendar,
  Users,
  Mic,
  Clock,
  Presentation,
  MessageCircle,
  ArrowRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
interface MeetingTool {
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
    transcription: boolean;
    actionItems: boolean;
    summaries: boolean;
    recording: boolean;
    scheduling: boolean;
  };
}

const toolsList: MeetingTool[] = [
  {
    id: "1",
    name: "Otter.ai",
    logo: "https://logo.clearbit.com/otter.ai",
    description: "AI-powered meeting assistant that transcribes in real time, identifies speakers, and captures action items.",
    rating: 4.7,
    bestFor: ["Remote teams", "Meeting documentation", "Researchers"],
    pros: ["Accurate transcription", "Real-time notes", "Action item tracking", "Easy sharing"],
    cons: ["Limited free plan", "Occasional accuracy issues with accents", "Can drain battery"],
    pricing: {
      free: true,
      startingPrice: "$8.33/month"
    },
    url: "https://otter.ai",
    features: {
      transcription: true,
      actionItems: true,
      summaries: true,
      recording: true,
      scheduling: false
    }
  },
  {
    id: "2",
    name: "Fireflies.ai",
    logo: "https://logo.clearbit.com/fireflies.ai",
    description: "AI assistant that joins your meetings to record, transcribe, and create searchable notes.",
    rating: 4.8,
    bestFor: ["Sales teams", "Remote collaboration", "Customer support"],
    pros: ["Works with most meeting platforms", "Searchable recordings", "Automated summaries", "Topic extraction"],
    cons: ["Premium features require upgrade", "Processing time for longer meetings", "Limited third-party integrations"],
    pricing: {
      free: true,
      startingPrice: "$10/month"
    },
    url: "https://fireflies.ai",
    features: {
      transcription: true,
      actionItems: true,
      summaries: true,
      recording: true,
      scheduling: false
    }
  },
  {
    id: "3",
    name: "Fathom",
    logo: "https://logo.clearbit.com/fathom.video",
    description: "AI meeting assistant that records, transcribes, and automatically takes notes so you can focus on the conversation.",
    rating: 4.6,
    bestFor: ["Managers", "Team leads", "Client meetings"],
    pros: ["Highlights important moments", "Great UI/UX", "Quick sharing", "Privacy-focused"],
    cons: ["Limited free usage", "No mobile app", "Fewer integrations than competitors"],
    pricing: {
      free: true,
      startingPrice: "$12/month"
    },
    url: "https://fathom.video",
    features: {
      transcription: true,
      actionItems: true,
      summaries: true,
      recording: true,
      scheduling: false
    }
  },
  {
    id: "4",
    name: "Notion AI",
    logo: "https://logo.clearbit.com/notion.so",
    description: "All-in-one workspace with AI capabilities for meeting notes, summaries, and action item tracking.",
    rating: 4.7,
    bestFor: ["Teams using Notion", "Knowledge workers", "Project teams"],
    pros: ["Integrated in Notion workspace", "Good for documentation", "Versatile AI tools", "Great templates"],
    cons: ["Requires Notion subscription", "AI features cost extra", "Not specialized for meetings only"],
    pricing: {
      free: true,
      startingPrice: "$8/month + $10/month for AI"
    },
    url: "https://notion.so",
    features: {
      transcription: false,
      actionItems: true,
      summaries: true,
      recording: false,
      scheduling: false
    }
  },
  {
    id: "5",
    name: "Calendly with AI",
    logo: "https://logo.clearbit.com/calendly.com",
    description: "Scheduling automation platform with AI enhancements for smart scheduling and meeting preparations.",
    rating: 4.5,
    bestFor: ["Professionals", "Sales teams", "Customer success"],
    pros: ["Easy scheduling", "Reduces email back-and-forth", "Time zone intelligence", "Multiple meeting types"],
    cons: ["Limited AI features", "Premium features require paid plan", "Not focused on meeting content"],
    pricing: {
      free: true,
      startingPrice: "$8/month"
    },
    url: "https://calendly.com",
    features: {
      transcription: false,
      actionItems: false,
      summaries: false,
      recording: false,
      scheduling: true
    }
  }
];

export default function BestAIMeetingTools() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  
  return (
    <>
      <Helmet>
        <title>Best AI Meeting Tools for 2025 — Internet Keeda</title>
        <meta name="description" content="Discover the best AI meeting tools for 2025 to help streamline your meetings, automate notes, and improve collaboration." />
      </Helmet>

      {/* Hero Section with minimalist design */}
      <div className="bg-gradient-to-br from-green-700 to-green-900 text-white pt-36 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] opacity-5"></div>
        <motion.div 
          className="container mx-auto max-w-4xl relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col items-center text-center mb-12">
            <Badge className="mb-4 bg-green-800/60 text-white px-4 py-1 text-sm font-medium">AI-Powered Productivity</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Best AI Meeting Tools for 2025
            </h1>
            <p className="text-lg text-green-100 max-w-2xl leading-relaxed">
              Enhance your meetings and reduce preparation time with AI tools that transcribe, summarize, and track action items.
            </p>
            <div className="mt-8 text-sm text-green-200 flex items-center">
              <div className="relative w-8 h-8 rounded-full overflow-hidden mr-2 border-2 border-green-400"><Image src="https://ui-avatars.com/api/?name=Michael+Johnson&background=22C55E&color=fff" alt="Michael Johnson" fill className="object-cover" unoptimized /></div>
              <p>By Michael Johnson • Last updated: June 2025</p>
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
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Meetings, Reimagined with AI</h2>
            <p className="text-gray-700 leading-relaxed mb-0">
              AI meeting tools are transforming how we conduct and follow up on meetings, capturing key points automatically so you can focus on the conversation instead of taking notes.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Tool Reviews with cleaner design */}
      <div className="py-20 bg-white px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Best AI Meeting Tools</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">We've evaluated the leading AI-powered meeting solutions to help you find the perfect tool.</p>
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
                    <div className="ml-3 px-2 py-0.5 bg-green-100 text-green-800 rounded-full text-xs font-medium">
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
                    <Button className="bg-green-600 hover:bg-green-700 rounded-lg">
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
                    { name: "Transcription", icon: <Mic className="w-4 h-4" />, active: tool.features.transcription },
                    { name: "Action Items", icon: <Check className="w-4 h-4" />, active: tool.features.actionItems },
                    { name: "Summaries", icon: <MessageCircle className="w-4 h-4" />, active: tool.features.summaries },
                    { name: "Recording", icon: <Presentation className="w-4 h-4" />, active: tool.features.recording },
                    { name: "Scheduling", icon: <Calendar className="w-4 h-4" />, active: tool.features.scheduling }
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
                    <Button className="bg-green-600 hover:bg-green-700">
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
          <div className="bg-gradient-to-r from-green-600 to-green-700 rounded-lg p-8 text-center shadow-lg">
            <h2 className="text-2xl font-bold mb-3 text-white">Join our newsletter</h2>
            <p className="text-green-100 mb-6 max-w-2xl mx-auto">Get the latest updates on new AI tools delivered to your inbox.</p>
            <div className="flex max-w-md mx-auto gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-lg border-0 px-4 py-2 focus:ring-2 focus:ring-white focus:ring-opacity-50"
              />
              <Button className="bg-white text-green-700 hover:bg-gray-100 rounded-lg px-4 py-2 font-medium">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}; 