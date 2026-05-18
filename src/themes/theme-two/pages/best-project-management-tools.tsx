import React, { useState, useEffect } from "react";
import Image from 'next/image';
import Link from 'next/link'
import { Helmet } from "react-helmet";
import { motion } from "framer-motion";
import {
  Check,
  Star,
  ChevronRight,
  CalendarDays,
  Users,
  BarChart3,
  Clock,
  Pencil,
  MessageCircle,
  ArrowRight,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
interface Tool {
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
    teamCollaboration: boolean;
    timeline: boolean;
    reporting: boolean;
    resourceManagement: boolean;
    kanbanBoard: boolean;
    ganttChart: boolean;
    timeTracking: boolean;
    fileSharing: boolean;
  };
}

const toolsList: Tool[] = [
  {
    id: "1",
    name: "Monday.com",
    logo: "https://logo.clearbit.com/monday.com",
    description: "Work OS that powers teams to run processes, projects, and workflows in one digital workspace.",
    rating: 4.8,
    bestFor: ["Project managers", "Marketing teams", "Remote teams"],
    pros: ["Visual and intuitive interface", "Highly customizable", "Many integrations"],
    cons: ["Can be pricey for larger teams", "Steep learning curve for advanced features"],
    pricing: {
      free: true,
      startingPrice: "$8/user/month"
    },
    url: "https://monday.com",
    features: {
      taskManagement: true,
      teamCollaboration: true,
      timeline: true,
      reporting: true,
      resourceManagement: true,
      kanbanBoard: true,
      ganttChart: true,
      timeTracking: true,
      fileSharing: true
    }
  },
  {
    id: "2",
    name: "Asana",
    logo: "https://logo.clearbit.com/asana.com",
    description: "Work management platform designed to help teams organize, track, and manage their work.",
    rating: 4.7,
    bestFor: ["Marketing", "Operations", "Product teams"],
    pros: ["Clean user interface", "Powerful automation", "Great mobile app"],
    cons: ["Limited reporting capabilities", "Can get cluttered with many projects"],
    pricing: {
      free: true,
      startingPrice: "$10.99/user/month"
    },
    url: "https://asana.com",
    features: {
      taskManagement: true,
      teamCollaboration: true,
      timeline: true,
      reporting: true,
      resourceManagement: false,
      kanbanBoard: true,
      ganttChart: true,
      timeTracking: false,
      fileSharing: true
    }
  },
  {
    id: "3",
    name: "Notion",
    logo: "https://logo.clearbit.com/notion.so",
    description: "All-in-one workspace that combines notes, tasks, wikis, and databases.",
    rating: 4.7,
    bestFor: ["Startups", "Knowledge management", "Documentation"],
    pros: ["Extremely flexible", "Great for documentation", "Good free plan"],
    cons: ["Takes time to set up", "Complex for simple task management"],
    pricing: {
      free: true,
      startingPrice: "$8/user/month"
    },
    url: "https://notion.so",
    features: {
      taskManagement: true,
      teamCollaboration: true,
      timeline: false,
      reporting: false,
      resourceManagement: false,
      kanbanBoard: true,
      ganttChart: false,
      timeTracking: false,
      fileSharing: true
    }
  },
  {
    id: "4",
    name: "ClickUp",
    logo: "https://logo.clearbit.com/clickup.com",
    description: "Productivity platform that brings all work into one place.",
    rating: 4.7,
    bestFor: ["Small businesses", "Startups", "Marketing teams"],
    pros: ["Highly customizable", "Feature-rich", "Generous free plan"],
    cons: ["Can be overwhelming at first", "Occasional performance issues"],
    pricing: {
      free: true,
      startingPrice: "$5/user/month"
    },
    url: "https://clickup.com",
    features: {
      taskManagement: true,
      teamCollaboration: true,
      timeline: true,
      reporting: true,
      resourceManagement: true,
      kanbanBoard: true,
      ganttChart: true,
      timeTracking: true,
      fileSharing: true
    }
  },
  {
    id: "5",
    name: "Trello",
    logo: "https://logo.clearbit.com/trello.com",
    description: "Visual collaboration tool that creates a shared perspective on any project.",
    rating: 4.5,
    bestFor: ["Visual planners", "Simple projects", "Personal task management"],
    pros: ["Easy to use", "Visual kanban interface", "Great for simple projects"],
    cons: ["Limited for complex projects", "Basic reporting"],
    pricing: {
      free: true,
      startingPrice: "$5/user/month"
    },
    url: "https://trello.com",
    features: {
      taskManagement: true,
      teamCollaboration: true,
      timeline: false,
      reporting: false,
      resourceManagement: false,
      kanbanBoard: true,
      ganttChart: false,
      timeTracking: false,
      fileSharing: true
    }
  }
];

export default function BestProjectManagementTools() {
  const [selectedTool, setSelectedTool] = useState<string | null>(null);
  
  return (
    <>
      <Helmet>
        <title>Best Project Management Tools for 2025 - AI Hunt</title>
        <meta name="description" content="Discover the best project management tools for team collaboration, task tracking, and efficient workflow management in 2025." />
      </Helmet>

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
            <Badge className="mb-4 bg-purple-800/60 text-white px-4 py-1 text-sm font-medium">Top Picks for 2025</Badge>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 leading-tight">
              Best 10 Project Management Software
            </h1>
            <p className="text-lg text-purple-100 max-w-2xl leading-relaxed">
              Find and compare the top project management tools for your team based on features, pricing, and user reviews.
            </p>
            <div className="mt-8 text-sm text-purple-200 flex items-center">
              <div className="relative w-8 h-8 rounded-full overflow-hidden mr-2 border-2 border-purple-400"><Image src="https://ui-avatars.com/api/?name=Andrew+Lee&background=6466F1&color=fff" alt="Andrew Lee" fill className="object-cover" unoptimized /></div>
              <p>By Andrew Lee • Last updated: June 2025</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Quick Comparison Table with simplified design */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold mb-4">Quick Comparison</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Compare the top project management tools side by side.</p>
          </div>
          <div className="overflow-x-auto rounded-lg shadow-md">
            <table className="w-full border-collapse bg-white">
              <thead>
                <tr className="bg-gray-100">
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">#</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Tool</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Best For</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Free Plan</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Starting Price</th>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700">Rating</th>
                </tr>
              </thead>
              <tbody>
                {toolsList.map((tool, index) => (
                  <motion.tr 
                    key={tool.id} 
                    className="border-t border-gray-200 hover:bg-purple-50/30 transition-colors cursor-pointer"
                    onClick={() => setSelectedTool(selectedTool === tool.id ? null : tool.id)}
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.3, delay: index * 0.05 }}
                  >
                    <td className="px-4 py-3 text-sm text-gray-700 font-medium">{index + 1}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm overflow-hidden border border-gray-100 relative">
                          <Image 
                            src={tool.logo} 
                            alt={tool.name} 
                            fill
                            className="object-contain p-1"
                            unoptimized
                          />
                        </div>
                        <span className="font-semibold text-gray-900">{tool.name}</span>
                      </div>
                    </td>
                    <td className="px-4 py-3 text-sm text-gray-700">{tool.bestFor[0]}</td>
                    <td className="px-4 py-3 text-sm">
                      {tool.pricing.free ? (
                        <span className="text-green-600 font-medium flex items-center">
                          <Check className="w-4 h-4 mr-1" /> Yes
                        </span>
                      ) : (
                        <span className="text-gray-500 flex items-center">
                          <X className="w-4 h-4 mr-1" /> No
                        </span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-sm font-medium text-gray-900">{tool.pricing.startingPrice}</td>
                    <td className="px-4 py-3 text-sm">
                      <div className="flex items-center px-2 py-1 rounded-md w-fit">
                        <Star className="w-4 h-4 text-yellow-500 fill-current mr-1" />
                        <span className="font-semibold text-gray-700">{tool.rating.toFixed(1)}</span>
                      </div>
                    </td>
                  </motion.tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Detailed Tool Reviews with simplified card design */}
      <div className="py-16 bg-white">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="text-center mb-10">
            <h2 className="text-2xl font-bold mb-4">Detailed Tool Reviews</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">We've tested dozens of project management tools to help you find the right fit.</p>
          </div>
          
          <div className="space-y-12">
            {toolsList.map((tool, index) => (
              <motion.div 
                key={tool.id} 
                className="bg-white rounded-lg p-6 shadow-md border border-gray-100 hover:border-purple-100 transition-all"
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
                viewport={{ once: true, margin: "-100px" }}
              >
                <div className="flex flex-col md:flex-row md:items-center gap-4 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-purple-50 rounded-full flex items-center justify-center text-xl font-bold text-purple-600">
                      {index + 1}
                    </div>
                    <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center shadow-sm overflow-hidden border border-gray-100 relative">
                      <Image 
                        src={tool.logo} 
                        alt={tool.name} 
                        fill
                        className="object-contain p-1"
                        unoptimized
                      />
                    </div>
                    <div>
                      <h3 className="text-xl font-bold text-gray-900">{tool.name}</h3>
                      <div className="flex items-center mt-1">
                        {[...Array(5)].map((_, i) => (
                          <Star 
                            key={i} 
                            className={`w-4 h-4 ${i < Math.floor(tool.rating) ? 'text-yellow-400 fill-current' : 'text-gray-300'}`} 
                          />
                        ))}
                        <span className="ml-2 text-sm text-gray-700">{tool.rating.toFixed(1)}/5.0</span>
                      </div>
                    </div>
                  </div>
                  <div className="md:ml-auto">
                    <a href={tool.url} target="_blank" rel="noopener noreferrer">
                      <Button className="bg-purple-600 hover:bg-purple-700 rounded-lg">
                        Visit Website <ArrowRight className="ml-2 w-4 h-4" />
                      </Button>
                    </a>
                  </div>
                </div>
                
                <p className="text-gray-700 leading-relaxed mb-6">{tool.description}</p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                  {/* Features and Pros/Cons */}
                  <div className="bg-gray-50 p-5 rounded-lg">
                    <h4 className="font-semibold mb-3 text-gray-900 flex items-center">
                      <span className="w-5 h-5 rounded-full bg-green-100 flex items-center justify-center mr-2">
                        <Check className="w-3 h-3 text-green-700" />
                      </span>
                      Key Features
                    </h4>
                    <ul className="space-y-2">
                      {Object.entries(tool.features)
                        .filter(([_, hasFeature]) => hasFeature)
                        .slice(0, 5)
                        .map(([feature, _], i) => (
                          <li key={i} className="flex items-center text-sm">
                            <span className="w-5 h-5 mr-2 rounded-full bg-green-100 flex items-center justify-center">
                              <Check className="w-3 h-3 text-green-600" />
                            </span>
                            <span className="text-gray-800">
                              {feature
                                .replace(/([A-Z])/g, ' $1')
                                .replace(/^./, str => str.toUpperCase())}
                            </span>
                          </li>
                        ))}
                    </ul>
                  </div>
                  
                  <div className="bg-gray-50 p-5 rounded-lg">
                    <h4 className="font-semibold mb-3 text-gray-900 flex items-center">
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
                    <h4 className="font-semibold mb-3 text-gray-900 flex items-center">
                      <span className="w-5 h-5 rounded-full bg-blue-100 flex items-center justify-center mr-2">
                        <Users className="w-3 h-3 text-blue-700" />
                      </span>
                      Best For
                    </h4>
                    <div className="flex flex-wrap gap-2">
                      {tool.bestFor.map((bestFor, i) => (
                        <Badge key={i} className="bg-blue-100 text-blue-800 font-medium">
                          {bestFor}
                        </Badge>
                      ))}
                    </div>
                  </div>
                </div>
                
                <div className="flex flex-col sm:flex-row justify-between items-center bg-gray-50 p-4 rounded-lg">
                  <div className="text-sm mb-3 sm:mb-0">
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
              </motion.div>
            ))}
          </div>
        </div>
      </div>

      {/* Simplified Evaluation Section */}
      <div className="py-16 bg-gray-50">
        <div className="container mx-auto max-w-5xl px-4">
          <div className="text-center mb-8">
            <h2 className="text-2xl font-bold mb-4">How We Evaluated</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Our experts thoroughly tested each tool based on these criteria:</p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              {
                icon: <Users className="w-5 h-5 text-purple-600" />,
                title: "Ease of Use",
                description: "Intuitive interface for new and experienced users."
              },
              {
                icon: <BarChart3 className="w-5 h-5 text-purple-600" />,
                title: "Feature Set",
                description: "Breadth and depth of project management capabilities."
              },
              {
                icon: <MessageCircle className="w-5 h-5 text-purple-600" />,
                title: "Collaboration",
                description: "Team communication and collaboration support."
              },
              {
                icon: <Pencil className="w-5 h-5 text-purple-600" />,
                title: "Customization",
                description: "Flexibility for adapting to specific workflows."
              },
              {
                icon: <Clock className="w-5 h-5 text-purple-600" />,
                title: "Performance",
                description: "Speed and reliability with large projects."
              },
              {
                icon: <CalendarDays className="w-5 h-5 text-purple-600" />,
                title: "Value for Money",
                description: "Pricing plans relative to feature offerings."
              }
            ].map((item, index) => (
              <motion.div 
                key={index}
                className="bg-white p-4 rounded-lg shadow-sm border border-gray-100"
                initial={{ opacity: 0, y: 10 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3, delay: index * 0.05 }}
                viewport={{ once: true, margin: "-50px" }}
              >
                <div className="flex items-center mb-2">
                  <div className="w-8 h-8 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
                    {item.icon}
                  </div>
                  <h3 className="font-bold text-base">{item.title}</h3>
                </div>
                <p className="text-gray-600 text-sm pl-11">{item.description}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </div>
      
      {/* Simplified Newsletter Signup */}
      <div className="py-16 bg-white">
        <div className="container mx-auto max-w-3xl px-4">
          <div className="bg-gradient-to-r from-purple-600 to-purple-700 rounded-lg p-8 text-center shadow-lg">
            <h2 className="text-2xl font-bold mb-3 text-white">Join our newsletter</h2>
            <p className="text-purple-100 mb-6 max-w-2xl mx-auto">Get the latest updates on new tools delivered to your inbox.</p>
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
    </>
  );
}; 