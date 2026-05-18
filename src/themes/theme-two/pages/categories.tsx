import { useState, useMemo } from "react";
import Link from 'next/link'
import { Grid, MessageSquare, Image, Code, Video, Music, Brain, Bot, Search, FolderOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTools } from "@/lib/api/tools";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { motion, AnimatePresence } from "framer-motion";

interface Category {
  id: string;
  name: string;
  description: string;
  icon: JSX.Element;
  count: number;
  filterValue: string;
}

export default function Categories() {
  const [searchQuery, setSearchQuery] = useState("");
  
  // Fetch tools from API with pagination
  const { data, isLoading, error } = useTools({ limit: 1000 });
  
  // Get unique categories and their counts
  const categories = useMemo(() => {
    const tools = data?.data || [];
    const categoryMap = new Map<string, number>();
    
    tools.forEach(tool => {
      const category = tool.category;
      categoryMap.set(category, (categoryMap.get(category) || 0) + 1);
    });
    
    return Array.from(categoryMap.entries())
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count);
  }, [data?.data]);

  // Filter categories based on search
  const filteredCategories = useMemo(() => {
    if (!searchQuery) return categories;
    
    return categories.filter(category =>
      category.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [categories, searchQuery]);

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 mt-24">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="container mx-auto px-4 py-8 mt-24">
        <div className="flex justify-center items-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Categories</h2>
            <p className="text-gray-600">Please try again later</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white min-h-screen"
    >
      <div className="container mx-auto px-4 py-8 mt-24">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <FolderOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              <span className="text-gray-900">Browse by</span>{' '}
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                Categories
              </span>
            </h1>
          </div>
          <p className="text-gray-600 text-lg mb-8">
            Explore AI tools organized by categories. Find the perfect tool for your needs.
          </p>
          
          {/* Search */}
          <div className="relative max-w-md">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-purple-500" />
            <input
              type="text"
              placeholder="Search categories..."
              style={{
                borderRadius: '50px',
                background: 'linear-gradient(126deg, #FFF 0.89%, rgba(255, 255, 255, 0.00) 99.4%)',
                boxShadow: '1px 1px 20px -5px rgba(0, 0, 0, 0.30)',
              }}
              className="w-full pl-11 pr-4 py-3 border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300 font-medium"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {filteredCategories.map((category, index) => (
              <motion.div
                key={category.name}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="h-[240px]"
              >
                <Link href={`/category/${encodeURIComponent(category.name.toLowerCase())}`} className="group block h-full">
                  <article 
                    className="relative h-full p-[1px] rounded-[1.25rem] overflow-hidden transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl" 
                    style={{
                      background: index % 2 === 0 
                        ? 'linear-gradient(to bottom, #7D37FF 0%, rgba(255, 255, 255, 0) 100%)'
                        : 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, #7D37FF 100%)'
                    }}
                  >
                    {/* Content container */}
                    <div className="relative h-full bg-[#F5F5F5] rounded-[1.25rem] p-6 group-hover:bg-white transition-colors duration-300 flex flex-col">
                      {/* Title */}
                      <div className="mb-4 flex-1">
                        <h3 className="text-[16px] font-semibold text-gray-900 line-clamp-2 mb-4">
                          {category.name}
                        </h3>
                        
                        {/* Tags Row */}
                        <div className="flex flex-wrap gap-2">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-600 border border-gray-200">
                            {category.name}
                          </span>
                          <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-semibold bg-purple-100 text-purple-700 border border-purple-300 shadow-sm">
                            {category.count} tools
                          </span>
                        </div>
                      </div>
                      
                      {/* Bottom Stats */}
                      <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-auto">
                        <div className="flex items-center gap-4 text-sm text-gray-500">
                          <span className="text-gray-600 font-semibold">{category.count} tool{category.count !== 1 ? 's' : ''}</span>
                        </div>
                        <Link href={`/category/${encodeURIComponent(category.name.toLowerCase())}`}
                          className="px-6 py-2 bg-white text-gray-700 rounded-full text-sm font-medium hover:bg-gray-50 transition-colors border border-gray-200"
                          onClick={(e) => e.stopPropagation()}
                        >
                          View →
                        </Link>
                      </div>
                    </div>
                  </article>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>

        {filteredCategories.length === 0 && searchQuery && (
          <div className="text-center py-12">
            <p className="text-gray-500">No categories found matching "{searchQuery}"</p>
          </div>
        )}
      </div>
    </motion.div>
  );
} 