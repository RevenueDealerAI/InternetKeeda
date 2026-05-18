import { Card } from "@/components/ui/card";
import Link from 'next/link'
import {
  Image,
  Pencil,
  Code,
  Video,
  AudioLines,
  Bot,
  Brain,
  Database,
  BarChart,
  Search,
  MessageSquare,
  Layers,
  ArrowRight,
} from "lucide-react";
import { motion } from "framer-motion";

const categories = [
  { id: 1, name: "Image Generation", icon: Image, color: "pink", count: 150 },
  { id: 2, name: "Writing & Content", icon: Pencil, color: "blue", count: 120 },
  { id: 3, name: "Code & Development", icon: Code, color: "green", count: 85 },
  { id: 4, name: "Video Creation", icon: Video, color: "orange", count: 65 },
  { id: 5, name: "Audio & Speech", icon: AudioLines, color: "purple", count: 45 },
  { id: 6, name: "Chatbots", icon: Bot, color: "indigo", count: 95 },
  { id: 7, name: "Machine Learning", icon: Brain, color: "fuchsia", count: 75 },
  { id: 8, name: "Data Analysis", icon: Database, color: "cyan", count: 55 },
  { id: 9, name: "Business & Analytics", icon: BarChart, color: "teal", count: 40 },
  { id: 10, name: "Research Tools", icon: Search, color: "violet", count: 35 },
  { id: 11, name: "Language Models", icon: MessageSquare, color: "blue", count: 60 },
  { id: 12, name: "Integrations", icon: Layers, color: "rose", count: 30 }
];

export const Categories = () => {
  const container = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const item = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 }
  };

  return (
    <section className="py-16 relative bg-gradient-to-b from-white via-gray-50/50 to-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(139,92,246,0.05),transparent_25%)]" />
      <div className="container mx-auto px-4">
        <div className="text-center mb-12">
          <motion.h2 
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-3xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent inline-block"
          >
            Explore Categories
          </motion.h2>
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="text-gray-600 mt-2"
          >
            Discover tools for every need
          </motion.p>
        </div>

        <motion.div 
          variants={container}
          initial="hidden"
          animate="show"
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4"
        >
          {categories.map((category) => (
            <motion.div key={category.id} variants={item}>
              <Link href={`/category/${category.id}`}
                className="block group"
              >
                <Card className="relative overflow-hidden border border-gray-100 hover:border-gray-200 shadow-sm hover:shadow-md transition-all duration-300 h-full">
                  {/* Gradient background on hover */}
                  <div className={`absolute inset-0 bg-${category.color}-50/50 opacity-0 group-hover:opacity-100 transition-all duration-500`} />
                  
                  {/* Shine effect */}
                  <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-all duration-700">
                    <div className="absolute inset-0 translate-x-[-100%] group-hover:translate-x-[100%] bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000" />
                  </div>

                  <div className="relative p-4 flex flex-col items-center gap-4">
                    {/* Icon container with pulse effect */}
                    <div className={`p-3 rounded-xl bg-${category.color}-100/80 group-hover:bg-${category.color}-100 
                      ring-2 ring-${category.color}-100/50 group-hover:ring-${category.color}-200 
                      shadow-lg shadow-${category.color}-100/20 
                      transform group-hover:scale-110 transition-all duration-300`}
                    >
                      <category.icon className={`w-6 h-6 text-${category.color}-500 group-hover:text-${category.color}-600 transition-colors duration-300`} />
                    </div>
                    
                    {/* Category info */}
                    <div className="text-center space-y-1">
                      <h3 className={`text-sm font-semibold text-gray-800 group-hover:text-${category.color}-600 transition-colors duration-300`}>
                        {category.name}
                      </h3>
                      <p className="text-xs text-gray-500 group-hover:text-gray-600">
                        {category.count} tools
                      </p>
                    </div>

                    {/* Arrow indicator */}
                    <div className="absolute right-2 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transform translate-x-2 group-hover:translate-x-0 transition-all duration-300">
                      <ArrowRight className={`w-4 h-4 text-${category.color}-500`} />
                    </div>
                  </div>
                </Card>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}; 