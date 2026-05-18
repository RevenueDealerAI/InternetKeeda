import React, { useState, useEffect } from "react";
import Image from 'next/image';
import Link from 'next/link'
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import {
  Check,
  Star,
  ChevronRight,
  Brain,
  Clock,
  Calendar,
  Bell,
  LayoutDashboard,
  MessageCircle,
  ArrowRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
interface ADHDTool {
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
    taskManagement: boolean;
    visualPlanning: boolean;
    reminders: boolean;
    focusMode: boolean;
    habitTracking: boolean;
  };
}

const toolsList: ADHDTool[] = [
  {
    id: "1",
    name: "Todoist",
    logo: "https://logo.clearbit.com/todoist.com",
    description: "Task manager with AI capabilities that helps organize priorities and break down complex projects.",
    rating: 4.8,
    bestFor: ["Task organization", "Project breakdown", "Daily planning"],
    pros: ["Clean interface", "Natural language input", "Flexible organization", "Cross-platform"],
    cons: ["Advanced features require premium", "No built-in calendar", "Limited visualization options"],
    pricing: {
      free: true,
      startingPrice: "$4/month"
    },
    url: "https://todoist.com",
    features: {
      taskManagement: true,
      visualPlanning: false,
      reminders: true,
      focusMode: false,
      habitTracking: true
    }
  },
  {
    id: "2",
    name: "Motion",
    logo: "https://logo.clearbit.com/usemotion.com",
    description: "AI-powered planner that automatically schedules tasks based on priority and available time.",
    rating: 4.7,
    bestFor: ["Time management", "Calendar planning", "Meeting scheduling"],
    pros: ["Automatic scheduling", "Calendar integration", "Task prioritization", "Meeting scheduling"],
    cons: ["Expensive", "Limited free plan", "Learning curve", "Sometimes too rigid"],
    pricing: {
      free: true,
      startingPrice: "$19/month"
    },
    url: "https://usemotion.com",
    features: {
      taskManagement: true,
      visualPlanning: true,
      reminders: true,
      focusMode: false,
      habitTracking: false
    }
  },
  {
    id: "3",
    name: "Habitica",
    logo: "https://logo.clearbit.com/habitica.com",
    description: "Gamified productivity app that turns your to-do list into an RPG to make task completion more engaging.",
    rating: 4.6,
    bestFor: ["Habit building", "Gamification lovers", "Visual motivation"],
    pros: ["Gamification increases motivation", "Social accountability", "Fun interface", "Habit building"],
    cons: ["Can be overwhelming", "Not for professional settings", "Limited project management", "Basic mobile experience"],
    pricing: {
      free: true,
      startingPrice: "$5/month"
    },
    url: "https://habitica.com",
    features: {
      taskManagement: true,
      visualPlanning: true,
      reminders: true,
      focusMode: false,
      habitTracking: true
    }
  },
  {
    id: "4",
    name: "Forest",
    logo: "https://logo.clearbit.com/forestapp.cc",
    description: "Focus app that uses the Pomodoro technique with a gamified tree-growing mechanic to help maintain concentration.",
    rating: 4.7,
    bestFor: ["Focus sessions", "Pomodoro technique", "Phone addiction"],
    pros: ["Visual motivation", "Simple to use", "Gamified focus", "Screen time reduction"],
    cons: ["Limited task management", "Basic feature set", "No calendar integration", "Single focus method"],
    pricing: {
      free: true,
      startingPrice: "$1.99 (one-time)"
    },
    url: "https://forestapp.cc",
    features: {
      taskManagement: false,
      visualPlanning: false,
      reminders: true,
      focusMode: true,
      habitTracking: true
    }
  },
  {
    id: "5",
    name: "Notion",
    logo: "https://logo.clearbit.com/notion.so",
    description: "All-in-one workspace with customizable templates specifically designed for ADHD organization and planning.",
    rating: 4.8,
    bestFor: ["Knowledge management", "Visual organization", "Project planning"],
    pros: ["Highly customizable", "Visual organization", "Templates for ADHD", "All-in-one solution"],
    cons: ["Learning curve", "Can be overwhelming", "Requires setup time", "Too flexible for some"],
    pricing: {
      free: true,
      startingPrice: "$8/month"
    },
    url: "https://notion.so",
    features: {
      taskManagement: true,
      visualPlanning: true,
      reminders: true,
      focusMode: false,
      habitTracking: true
    }
  }
];

export default function BestProductivityToolsForADHD() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  
  return (
    <>
      <Helmet>
        <title>Best Productivity Tools for ADHD in 2025 - AI Hunt</title>
        <meta name="description" content="Discover the best productivity tools designed for people with ADHD to improve focus, organization, and task management." />
      </Helmet>

      {/* Hero Section with minimalist design */}
      <div className="bg-gradient-to-br from-indigo-700 to-orange-900 text-white pt-36 pb-20 px-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-[url('/img/grid-pattern.svg')] opacity-5"></div>
        <motion.div 
          className="container mx-auto max-w-4xl relative z-10"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          <div className="flex flex-col items-center text-center mb-12">
            <Badge className="mb-4 bg-indigo-800/60 text-white px-4 py-1 text-sm font-medium">ADHD-Friendly Tools</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Best Productivity Tools for ADHD in 2025
            </h1>
            <p className="text-lg text-indigo-100 max-w-2xl leading-relaxed">
              Work better with your ADHD with productivity tools specifically designed to help with focus, organization, and task management.
            </p>
            <div className="mt-8 text-sm text-indigo-200 flex items-center">
              <div className="relative w-8 h-8 rounded-full overflow-hidden mr-2 border-2 border-indigo-400"><Image src="https://ui-avatars.com/api/?name=Alex+Rivera&background=818CF8&color=fff" alt="Alex Rivera" fill className="object-cover" unoptimized /></div>
              <p>By Alex Rivera • Last updated: June 2025</p>
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
            <h2 className="text-2xl font-bold mb-6 text-gray-900">Tools That Work With Your Brain, Not Against It</h2>
            <p className="text-gray-700 leading-relaxed mb-0">
              Living with ADHD presents unique challenges for productivity and organization. The right tools can make a significant difference by providing structure, reducing overwhelm, and helping maintain focus on what matters most.
            </p>
          </motion.div>
        </div>
      </div>

      {/* Tool Reviews with cleaner design */}
      <div className="py-20 bg-white px-4">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Best Productivity Tools for ADHD</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">We've evaluated the leading productivity tools designed specifically with ADHD needs in mind.</p>
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
                    <div className="ml-3 px-2 py-0.5 bg-indigo-100 text-indigo-800 rounded-full text-xs font-medium">
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
                    <Button className="bg-indigo-600 hover:bg-indigo-700 rounded-lg">
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
                    { name: "Task Management", icon: <LayoutDashboard className="w-4 h-4" />, active: tool.features.taskManagement },
                    { name: "Visual Planning", icon: <Brain className="w-4 h-4" />, active: tool.features.visualPlanning },
                    { name: "Reminders", icon: <Bell className="w-4 h-4" />, active: tool.features.reminders },
                    { name: "Focus Mode", icon: <Clock className="w-4 h-4" />, active: tool.features.focusMode },
                    { name: "Habit Tracking", icon: <Calendar className="w-4 h-4" />, active: tool.features.habitTracking }
                  ].map((feature, i) => (
                    <div key={i} className={`flex flex-col items-center p-3 rounded-lg ${feature.active ? 'text-indigo-700' : 'text-gray-400'}`}>
                      {feature.icon}
                      <span className="text-xs font-medium text-center mt-1">{feature.name}</span>
                      {feature.active ? (
                        <div className="w-3 h-3 mt-1 rounded-full bg-indigo-500"></div>
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
                      <Badge key={i} className="bg-indigo-100 text-indigo-800 font-medium">
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
                    <Button className="bg-indigo-600 hover:bg-indigo-700">
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
          <div className="bg-gradient-to-r from-indigo-600 to-orange-700 rounded-lg p-8 text-center shadow-lg">
            <h2 className="text-2xl font-bold mb-3 text-white">Join our newsletter</h2>
            <p className="text-indigo-100 mb-6 max-w-2xl mx-auto">Get the latest updates on new ADHD productivity tools delivered to your inbox.</p>
            <div className="flex max-w-md mx-auto gap-3">
              <input
                type="email"
                placeholder="Enter your email"
                className="flex-1 rounded-lg border-0 px-4 py-2 focus:ring-2 focus:ring-white focus:ring-opacity-50"
              />
              <Button className="bg-white text-indigo-700 hover:bg-gray-100 rounded-lg px-4 py-2 font-medium">
                Subscribe
              </Button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}; 