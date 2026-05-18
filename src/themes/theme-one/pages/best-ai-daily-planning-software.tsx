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
  Clock,
  ListTodo,
  Bell,
  BarChart,
  ArrowRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
interface PlanningTool {
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
    aiAssistant: boolean;
    calendarIntegration: boolean;
    taskPrioritization: boolean;
    timeSuggestions: boolean;
    analytics: boolean;
  };
}

const toolsList: PlanningTool[] = [
  {
    id: "1",
    name: "Motion",
    logo: "https://logo.clearbit.com/usemotion.com",
    description: "AI-powered planner that automatically schedules tasks and meetings based on your priorities and available time.",
    rating: 4.8,
    bestFor: ["Busy professionals", "Managers", "Remote workers"],
    pros: ["AI scheduling", "Auto time-blocking", "Meeting coordination", "Intuitive interface"],
    cons: ["Premium pricing", "Steep learning curve", "Limited mobile app", "Can feel rigid"],
    pricing: {
      free: true,
      startingPrice: "$19/month"
    },
    url: "https://usemotion.com",
    features: {
      aiAssistant: true,
      calendarIntegration: true,
      taskPrioritization: true,
      timeSuggestions: true,
      analytics: true
    }
  },
  {
    id: "2",
    name: "Sunsama",
    logo: "https://logo.clearbit.com/sunsama.com",
    description: "Daily planner that helps you prioritize tasks, estimate time, and maintain work-life balance with a calming interface.",
    rating: 4.7,
    bestFor: ["Knowledge workers", "Task-oriented planners", "Work-life balance seekers"],
    pros: ["Daily focus", "Time estimates", "Task rollover", "Beautiful UI"],
    cons: ["No free tier", "Limited 3rd party integrations", "No AI features yet", "Desktop focus"],
    pricing: {
      free: false,
      startingPrice: "$16/month"
    },
    url: "https://sunsama.com",
    features: {
      aiAssistant: false,
      calendarIntegration: true,
      taskPrioritization: true,
      timeSuggestions: true,
      analytics: true
    }
  },
  {
    id: "3",
    name: "Reclaim.ai",
    logo: "https://logo.clearbit.com/reclaim.ai",
    description: "AI scheduling tool that automatically finds the best time for your tasks, habits, and meetings in your calendar.",
    rating: 4.6,
    bestFor: ["Calendar power users", "Busy schedules", "Habit builders"],
    pros: ["Smart scheduling", "Habit tracking", "Meeting optimization", "Google Calendar integration"],
    cons: ["Calendar-focused only", "Limited without Google Calendar", "Minimal UI", "Can reschedule too often"],
    pricing: {
      free: true,
      startingPrice: "$8/month"
    },
    url: "https://reclaim.ai",
    features: {
      aiAssistant: true,
      calendarIntegration: true,
      taskPrioritization: true,
      timeSuggestions: true,
      analytics: true
    }
  },
  {
    id: "4",
    name: "Akiflow",
    logo: "https://logo.clearbit.com/akiflow.com",
    description: "All-in-one productivity tool that brings together tasks, calendar, and AI scheduling in a unified workspace.",
    rating: 4.7,
    bestFor: ["Productivity enthusiasts", "App consolidators", "Task managers"],
    pros: ["Universal inbox", "Keyboard shortcuts", "Time blocking", "Multiple integrations"],
    cons: ["Complex for beginners", "Premium pricing", "Limited mobile apps", "Occasional sync issues"],
    pricing: {
      free: false,
      startingPrice: "$15/month"
    },
    url: "https://akiflow.com",
    features: {
      aiAssistant: true,
      calendarIntegration: true,
      taskPrioritization: true,
      timeSuggestions: true,
      analytics: false
    }
  },
  {
    id: "5",
    name: "Sorted AI",
    logo: "https://logo.clearbit.com/sortedai.app",
    description: "Task manager with built-in smart time blocking that automatically organizes your day based on task duration.",
    rating: 4.5,
    bestFor: ["Time blockers", "iOS users", "Time management focused"],
    pros: ["Auto-scheduling", "Time tracking", "Clear timeline view", "Task hyper-scheduling"],
    cons: ["iOS focused", "Limited web app", "Less 3rd party integrations", "Premium for full features"],
    pricing: {
      free: true,
      startingPrice: "$14.99/month"
    },
    url: "https://sortedai.app",
    features: {
      aiAssistant: true,
      calendarIntegration: true,
      taskPrioritization: true,
      timeSuggestions: true,
      analytics: false
    }
  }
];

export default function BestAIDailyPlanningSoftware() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  
  return (
    <>
      <Helmet>
        <title>Best AI Daily Planning Software for 2025 - AI Hunt</title>
        <meta name="description" content="Discover the best AI-powered daily planning tools to help you organize your day, prioritize tasks, and achieve your goals more efficiently." />
      </Helmet>

      {/* Hero Section with minimalist design */}
      <div className="bg-gradient-to-br from-emerald-600 to-teal-700 text-white pt-36 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] opacity-5"></div>
        <motion.div 
          className="container mx-auto max-w-4xl relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col items-center text-center mb-12">
            <Badge className="mb-4 bg-emerald-800/60 text-white px-4 py-1 text-sm font-medium">Daily Planning</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Best AI Daily Planning Software for 2025
            </h1>
            <p className="text-lg text-emerald-100 max-w-2xl leading-relaxed">
              Choose your priorities, organize your day, and let AI help you make the most of your time with these intelligent planning tools.
            </p>
            <div className="mt-8 text-sm text-emerald-200 flex items-center">
              <div className="relative w-8 h-8 rounded-full overflow-hidden mr-2 border-2 border-emerald-400"><Image src="https://ui-avatars.com/api/?name=David+Chen&background=10B981&color=fff" alt="David Chen" fill className="object-cover" unoptimized /></div>
              <p>By David Chen • Last updated: May 2025</p>
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
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Plan Smarter, Not Harder</h2>
            <p className="text-gray-700 leading-relaxed mb-0">
              AI-powered daily planning software helps you prioritize tasks, manage your time efficiently, and stay focused on what truly matters. These tools go beyond simple to-do lists by intelligently organizing your day based on your priorities, energy levels, and available time.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Tool Reviews with cleaner design */}
      <div className="py-20 bg-white px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Best AI Daily Planning Software</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">We've evaluated the leading AI-powered planning tools to help you find the perfect solution for your daily organization needs.</p>
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
                    <div className="ml-3 px-2 py-0.5 bg-emerald-100 text-emerald-800 rounded-full text-xs font-medium">
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
                    <Button className="bg-emerald-600 hover:bg-emerald-700 rounded-lg">
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
                    { name: "AI Assistant", icon: <BarChart className="w-4 h-4" />, active: tool.features.aiAssistant },
                    { name: "Calendar", icon: <Calendar className="w-4 h-4" />, active: tool.features.calendarIntegration },
                    { name: "Prioritization", icon: <ListTodo className="w-4 h-4" />, active: tool.features.taskPrioritization },
                    { name: "Time Suggestions", icon: <Clock className="w-4 h-4" />, active: tool.features.timeSuggestions },
                    { name: "Analytics", icon: <BarChart className="w-4 h-4" />, active: tool.features.analytics }
                  ].map((feature, i) => (
                    <div key={i} className={`flex flex-col items-center p-3 rounded-lg ${feature.active ? 'text-emerald-700' : 'text-gray-400'}`}>
                      {feature.icon}
                      <span className="text-xs font-medium text-center mt-1">{feature.name}</span>
                      {feature.active ? (
                        <div className="w-3 h-3 mt-1 rounded-full bg-emerald-500"></div>
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
                      <Badge key={i} className="bg-emerald-100 text-emerald-800 font-medium">
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
                    <Button className="bg-emerald-600 hover:bg-emerald-700">
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
          <div className="bg-gradient-to-r from-emerald-600 to-teal-700 rounded-lg p-8 text-center shadow-lg">
            <h2 className="text-2xl font-bold mb-3 text-white">Join our newsletter</h2>
            <p className="text-emerald-100 mb-6 max-w-2xl mx-auto">Get the latest updates on new AI planning tools delivered to your inbox.</p>
            <div className="flex max-w-md mx-auto gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-lg border-0 px-4 py-2 focus:ring-2 focus:ring-white focus:ring-opacity-50"
              />
              <Button className="bg-white text-emerald-700 hover:bg-gray-100 rounded-lg px-4 py-2 font-medium">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}; 