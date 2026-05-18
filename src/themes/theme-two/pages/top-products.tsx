import { TrendingUp, Star, Filter, Zap, ArrowUpCircle, ExternalLink } from "lucide-react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "../components/ProductCard";
import { useState } from "react";
import { useTools } from "@/lib/api/tools";
import { useToolActions } from "@/hooks/useToolActions";
import { motion, AnimatePresence } from "framer-motion";

const getPricingColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'free': return 'bg-gradient-to-r from-emerald-500/90 to-teal-500/90 text-white shadow-emerald-500/20';
    case 'freemium': return 'bg-gradient-to-r from-blue-500/90 to-indigo-500/90 text-white shadow-blue-500/20';
    case 'paid': 
    case 'enterprise': return 'bg-gradient-to-r from-purple-500/90 to-pink-500/90 text-white shadow-purple-500/20';
    default: return '';
  }
};

export const TopProducts = () => {
  const router = useRouter();
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');
  const [sortBy, setSortBy] = useState<'votes' | 'trending' | 'recent'>('votes');
  const { data, isLoading, error } = useTools({ limit: 500 });
  const tools = data?.data || [];
  const { toggleUpvote, isUpvoted, toggleSave, isSaved } = useToolActions();

  const getFilteredAndSortedTools = () => {
    let filteredTools = tools.filter(tool => tool.isTopRated);

    // Apply time filter if needed
    if (timeFilter !== 'all') {
      const now = new Date();
      filteredTools = filteredTools.filter(tool => {
        const toolDate = new Date(tool.createdAt);
        const diffTime = Math.abs(now.getTime() - toolDate.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        
        switch (timeFilter) {
          case 'week':
            return diffDays <= 7;
          case 'month':
            return diffDays <= 30;
          default:
            return true;
        }
      });
    }

    // Apply sorting
    switch (sortBy) {
      case 'votes':
        return filteredTools.sort((a, b) => (b.votes || 0) - (a.votes || 0));
      case 'trending':
        return filteredTools.sort((a, b) => (b.rating || 0) - (a.rating || 0));
      case 'recent':
        return filteredTools.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      default:
        return filteredTools;
    }
  };

  const visibleTools = getFilteredAndSortedTools().slice(0, 9);
  const featuredTool = visibleTools[0];

  const handleTimeFilterChange = (filter: 'all' | 'month' | 'week') => {
    setTimeFilter(filter);
  };

  const handleVote = (e: React.MouseEvent | undefined, toolId: string, currentVotes: number = 0) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    toggleUpvote(toolId, currentVotes);
  };

  const handleFavorite = (toolId: string) => {
    toggleSave(toolId);
  };

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
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Top <span className="bg-gradient-to-r from-[#8039fd] via-[#a855f7] to-[#f5a5ad] bg-clip-text text-transparent">AI Tools</span>
          </h1>
          <p className="text-gray-600 max-w-2xl text-lg">
            Explore the most popular and highly-rated AI tools, curated based on user reviews and engagement.
          </p>
        </motion.div>

        {/* Filters and Sort */}
        <motion.div 
          className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
        >
          <div className="flex flex-wrap gap-4 justify-center">
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
          </div>

          <div className="flex items-center gap-4">
            <div className="relative">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-purple-500 pointer-events-none z-10" />
              <select 
                style={{
                  borderRadius: '50px',
                  background: 'linear-gradient(126deg, #FFF 0.89%, rgba(255, 255, 255, 0.00) 99.4%)',
                  boxShadow: '1px 1px 20px -5px rgba(0, 0, 0, 0.30)',
                }}
                className="border border-purple-200 pl-10 pr-8 py-2.5 text-sm font-medium text-gray-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300 appearance-none bg-white min-w-[180px] hover:border-purple-300 transition-all cursor-pointer font-semibold"
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value as 'votes' | 'trending' | 'recent')}
              >
                <option value="votes">Most Votes</option>
                <option value="trending">Trending</option>
                <option value="recent">Recently Added</option>
              </select>
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none z-10">
                <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
      </motion.div>

      {/* Featured Product */}
      {featuredTool && (
        <div className="bg-gradient-to-br from-purple-50 to-blue-50 rounded-2xl p-6 mb-12">
          <div className="flex flex-col md:flex-row gap-8 items-center">
            <div className="w-full md:w-1/2">
              <div className="aspect-video rounded-xl bg-white shadow-lg overflow-hidden relative">
                <Image 
                  src={featuredTool.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(featuredTool.name)}`}
                  alt={featuredTool.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </div>
            </div>
            <div className="w-full md:w-1/2 space-y-4">
              <h2 className="text-2xl font-bold">{featuredTool.name}</h2>
              <p className="text-gray-600">{featuredTool.description}</p>
              <div className="flex flex-wrap gap-2">
                <Badge variant="secondary" className="bg-gray-100">
                  {featuredTool.category}
                </Badge>
                <Badge className={getPricingColor(featuredTool.pricing.type)}>
                  {featuredTool.pricing.type}
                </Badge>
              </div>
              <div className="flex gap-4">
                <Button 
                  style={{
                    background: 'linear-gradient(90deg, #8039fd 0%, #f5a5ad 100%)',
                  }}
                  className="flex-1 rounded-full text-white hover:shadow-lg transition-all"
                  onClick={() => window.open(featuredTool.websiteUrl, '_blank')}
                >
                  Try Now
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1 rounded-full border-purple-200 text-purple-600 hover:bg-purple-50 hover:border-purple-300"
                  onClick={() => router.push(`/ai-tools/${featuredTool.slug}`)}
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </div>
      )}

        {/* Products Grid */}
        <motion.div 
          layout
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <AnimatePresence>
            {visibleTools.slice(1).map((tool, index) => (
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
                    <div className="relative h-full bg-gradient-to-br from-gray-50 to-white rounded-[1.25rem] p-6 group-hover:bg-white transition-colors duration-300 flex flex-col">
                      {/* Header with Image and Title */}
                      <div className="flex items-start justify-between gap-4 mb-3">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                          <div className="relative shrink-0">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-gradient-to-br from-purple-100 to-pink-50 shadow-lg ring-2 ring-purple-100 flex items-center justify-center relative">
                              <Image
                                src={tool.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(tool.name)}&background=8039fd&color=fff&bold=true&format=svg&size=128`}
                                alt={tool.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                            {tool.isNew && (
                              <div className="absolute -bottom-1 -right-1 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full p-1 shadow-md">
                                <span className="text-[8px] text-white font-bold">NEW</span>
                              </div>
                            )}
                            {tool.isTopRated && (
                              <div className="absolute -top-1 -left-1 bg-gradient-to-r from-orange-500 to-pink-500 rounded-full p-1 shadow-md">
                                <Star className="w-3 h-3 text-white fill-current" />
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
                        <span className="inline-flex items-center px-3 py-1.5 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-300 shadow-sm">
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

        {/* Load More */}
        {visibleTools.length < getFilteredAndSortedTools().length && (
          <div className="flex justify-center mt-12">
            <Button 
              variant="outline"
              className="rounded-full px-8 h-12 hover:bg-purple-50 border-purple-200 relative z-50 cursor-pointer font-medium"
              onClick={() => {
                // Implement load more functionality
                console.log('Load more clicked');
              }}
            >
              Load More Tools
            </Button>
          </div>
        )}
      </div>
    </motion.div>
  );
}; 