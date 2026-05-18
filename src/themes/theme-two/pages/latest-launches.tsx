import { Zap, Star, ArrowUpCircle, ExternalLink } from "lucide-react";
import { ProductCard } from "../components/ProductCard";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { useTools } from "@/lib/api/tools";
import { useToolActions } from "@/hooks/useToolActions";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

// Helper function to convert pricing type
const convertPricingType = (type: string): 'Free' | 'Freemium' | 'Paid' => {
  const normalized = type.toLowerCase();
  switch (normalized) {
    case 'free': return 'Free';
    case 'freemium': return 'Freemium';
    case 'paid':
    case 'enterprise': return 'Paid';
    default: return 'Paid';
  }
};

export const LatestLaunches = () => {
  const [timeFilter, setTimeFilter] = useState<'all' | 'week' | 'month'>('all');
  const { data, isLoading, error } = useTools({ limit: 500 });
  const tools = data?.data || [];
  const [pageSize, setPageSize] = useState(9);
  const { toggleUpvote, isUpvoted, toggleSave, isSaved, isLoading: isActionLoading } = useToolActions();

  const getFilteredTools = () => {
    // Get all tools that are published and sort by creation date (newest first)
    const allTools = tools
      .filter(tool => tool.status === 'published')
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    
    
    if (timeFilter === 'all') {
      // For "All Time", prioritize tools marked as new, then show recent tools
      const newTools = allTools.filter(tool => tool.isNew);
      const otherTools = allTools.filter(tool => !tool.isNew);
      return [...newTools, ...otherTools];
    }

    const now = new Date();
    const msPerDay = 24 * 60 * 60 * 1000;
    let daysBack = 30; // default for month
    
    if (timeFilter === 'week') {
      daysBack = 7;
    }
    
    const cutoffTime = now.getTime() - (daysBack * msPerDay);

    const filteredByDate = allTools.filter(tool => {
      const toolDate = new Date(tool.createdAt);
      const isInRange = toolDate.getTime() >= cutoffTime;
      return isInRange;
    });
    
    return filteredByDate;
  };

  const filteredTools = getFilteredTools();
  const visibleTools = filteredTools.slice(0, pageSize);

  const handleTimeFilterChange = (filter: 'all' | 'week' | 'month') => {
    setTimeFilter(filter);
    setPageSize(9); // Reset page size when filter changes
  };

  const handleLoadMore = () => {
    setPageSize(prev => prev + 9);
  };

  const handleVote = (e: React.MouseEvent | undefined, toolId: string, currentVotes: number = 0) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    toggleUpvote(toolId, currentVotes);
  };

  const handleFavorite = (e: React.MouseEvent, toolId: string) => {
    e.preventDefault();
    e.stopPropagation();
    toggleSave(toolId);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Tools</h2>
          <p className="text-gray-600">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <motion.div 
      className="theme-two min-h-screen bg-white relative"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="container mx-auto px-4 py-8 mt-20 relative">
        {/* Header */}
        <motion.div 
          className="flex flex-col items-center text-center mb-12"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
        >
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-purple-100 to-pink-100 mb-4">
            <Zap className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Latest <span className="bg-gradient-to-r from-[#8039fd] via-[#a855f7] to-[#f5a5ad] bg-clip-text text-transparent">AI Tool Launches</span>
          </h1>
          <p className="text-gray-600 max-w-2xl text-lg">
            Discover the newest AI tools and innovations. Be among the first to explore and try out these cutting-edge solutions.
          </p>
        </motion.div>

        {/* Filters */}
        <motion.div 
          className="flex flex-wrap gap-4 mb-8 justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <Button 
            variant={timeFilter === 'all' ? "default" : "outline"} 
            className={`rounded-full px-6 h-10 ${timeFilter === 'all' ? 'bg-purple-600 text-white hover:bg-purple-700' : 'hover:bg-purple-50 border-purple-200'}`}
            onClick={() => handleTimeFilterChange('all')}
          >
            All Time
          </Button>
          <Button 
            variant={timeFilter === 'month' ? "default" : "outline"} 
            className={`rounded-full px-6 h-10 ${timeFilter === 'month' ? 'bg-purple-600 text-white hover:bg-purple-700' : 'hover:bg-purple-50 border-purple-200'}`}
            onClick={() => handleTimeFilterChange('month')}
          >
            This Month
          </Button>
          <Button 
            variant={timeFilter === 'week' ? "default" : "outline"} 
            className={`rounded-full px-6 h-10 ${timeFilter === 'week' ? 'bg-purple-600 text-white hover:bg-purple-700' : 'hover:bg-purple-50 border-purple-200'}`}
            onClick={() => handleTimeFilterChange('week')}
          >
            This Week
          </Button>
        </motion.div>

      {/* Products Grid */}
      <motion.div 
        layout
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
      >
        <AnimatePresence>
          {visibleTools.map((tool, index) => (
            <motion.div
              key={tool.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              transition={{ duration: 0.2, delay: index * 0.05 }}
              className="h-[280px] lg:h-[280px] xl:h-[280px]"
            >
              <Link href={`/ai-tools/${tool.slug}`} className="group block h-full">
                <article className="relative h-full p-[1px] rounded-[1.25rem] overflow-hidden transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl" style={{
                  background: index % 2 === 0 
                    ? 'linear-gradient(to bottom, #7D37FF 0%, rgba(255, 255, 255, 0) 100%)'
                    : 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, #7D37FF 100%)'
                }}>
                  {/* Content container */}
                  <div className="relative h-full bg-[#F5F5F5] rounded-[1.25rem] p-6 group-hover:bg-white transition-colors duration-300 flex flex-col">
                    {/* Header with Image and Title */}
                    <div className="flex items-start justify-between gap-4 mb-3">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="relative shrink-0">
                          <div className="w-16 h-16 rounded-full overflow-hidden bg-white shadow-md ring-2 ring-gray-100 relative">
                            <Image
                              src={tool.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(tool.name)}&background=6366f1&color=fff&bold=true&format=svg&size=128`}
                              alt={tool.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          {tool.isNew && (
                            <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
                              <div className="bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-1">
                                <span className="text-[8px] text-white font-bold">NEW</span>
                              </div>
                            </div>
                          )}
                        </div>
                        
                        <div className="flex-1 min-w-0">
                          <h3 className="text-[18px] font-semibold text-gray-900 line-clamp-2">
                            {tool.name}
                          </h3>
                        </div>
                      </div>
                      
                      <div className="flex items-center gap-1 shrink-0">
                        <Star className="w-4 h-4 text-yellow-500 fill-current" />
                        <span className="text-sm font-medium text-gray-700">{tool.rating}</span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-base text-gray-600 mb-3 line-clamp-2">
                      {tool.description}
                    </p>

                    {/* Tags Row */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-600 border border-gray-200">
                        {tool.category}
                      </span>
                      <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                        <Zap className="w-3 h-3 text-purple-600" />
                        {convertPricingType(tool.pricing.type)}
                      </span>
                    </div>
                    
                    {/* Bottom Stats */}
                    <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-auto">
                      <div className="flex items-center gap-4 text-sm text-gray-500">
                        <div className="flex items-center gap-1">
                          <ArrowUpCircle className="w-4 h-4" />
                          <span>{tool.votes || 0}</span>
                        </div>
                      </div>
                      
                      <button
                        onClick={(e) => {
                          e.preventDefault();
                          e.stopPropagation();
                          window.open(tool.websiteUrl, '_blank');
                        }}
                        className="px-3 py-1.5 bg-white text-gray-900 text-xs font-medium rounded-full border border-gray-200 hover:bg-gray-50 transition-colors flex items-center gap-1 shadow-sm"
                      >
                        Try Now
                        <ExternalLink className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </article>
              </Link>
            </motion.div>
          ))}
        </AnimatePresence>
      </motion.div>

      {/* Empty state if no tools match filters */}
      {visibleTools.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
            <Zap className="w-8 h-8 text-purple-600" />
          </div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">No tools found</h3>
          <p className="text-gray-600 max-w-md mb-6">
            There are no new tools matching your current filter. Try changing the time filter or check back later!
          </p>
          <Button 
            variant="outline"
            className="rounded-xl hover:bg-purple-50"
            onClick={() => handleTimeFilterChange('all')}
          >
            View All Tools
          </Button>
        </div>
      )}

      {/* Load More */}
      {visibleTools.length < filteredTools.length && (
        <div className="flex justify-center mt-12 relative z-50">
          <Button 
            variant="outline"
            className="rounded-full px-8 h-12 hover:bg-purple-50 border-purple-200 relative z-50 cursor-pointer font-medium"
            onClick={handleLoadMore}
          >
            Load More Tools
          </Button>
        </div>
      )}
      </div>
    </motion.div>
  );
}; 