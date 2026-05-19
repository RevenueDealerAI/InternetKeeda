import { useState, useMemo } from "react";
import Image from 'next/image';
import { useRouter } from 'next/navigation'
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpCircle, ExternalLink, Star } from "lucide-react";
import { motion, useReducedMotion } from "framer-motion";
import { staggerCardProps } from "@/lib/animations";
import { ToolCardSkeletonGrid } from "../components/ToolCardSkeleton";
import { useTools } from "@/lib/api/tools";
import { Tool } from "@/types/tool";
import { useToolActions } from "@/hooks/useToolActions";
import { getToolLogo } from "@/utils/toolHelpers";

const TrendingPage = () => {
  const router = useRouter();
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('today');
  const { data, isLoading, error } = useTools({ limit: 500 });
  const tools = data?.data || [];
  const { toggleUpvote, isUpvoted, toggleSave, isSaved } = useToolActions();
  const reduceMotion = useReducedMotion();

  // Filter tools by time period
  const trendingTools = useMemo(() => {
    const now = new Date();
    let startDate: Date;

    switch (timeFilter) {
      case 'today':
        startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        break;
      case 'week':
        startDate = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
        break;
      case 'month':
        startDate = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        break;
      default:
        startDate = new Date(0); // All time
    }

    return tools
      .filter(tool => {
        if (!tool.isTrending) return false;
        
        // Filter by createdAt date if available
        if (tool.createdAt) {
          const toolDate = new Date(tool.createdAt);
          return toolDate >= startDate;
        }
        
        // If no createdAt, include it (for backward compatibility)
        return true;
      })
      .sort((a, b) => (b.votes || 0) - (a.votes || 0));
  }, [tools, timeFilter]);

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  const itemVariants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1
    }
  };

  const handleVote = (e: React.MouseEvent, toolId: string, currentVotes: number = 0) => {
    e.stopPropagation();
    toggleUpvote(toolId, currentVotes);
  };

  const handleFavorite = (e: React.MouseEvent, toolId: string) => {
    e.stopPropagation();
    toggleSave(toolId);
  };

  const getPricingColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'free': return 'bg-gradient-to-r from-emerald-500/90 to-teal-500/90 text-white shadow-emerald-500/20';
      case 'freemium': return 'bg-gradient-to-r from-blue-500/90 to-indigo-500/90 text-white shadow-blue-500/20';
      case 'paid': 
      case 'enterprise': return 'bg-gradient-to-r from-green-500/90 to-green-600/90 text-white shadow-green-500/20';
      default: return '';
    }
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return `${(num / 1000000).toFixed(1)}M`;
    if (num >= 1000) return `${(num / 1000).toFixed(1)}K`;
    return num;
  };

  const handleCardClick = (productId: string, slug: string) => {
    router.push(`/ai-tools/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="container mx-auto px-4 py-8 mt-24">
        <ToolCardSkeletonGrid count={9} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-center">
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Error Loading Tools</h2>
          <p className="text-gray-600">Please try again later</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 mt-24">
      <div className="mb-8">
        <h1 className="text-4xl font-bold mb-4">Trending AI Tools</h1>
        <p className="text-gray-600">
          Discover the most popular and trending AI tools based on user engagement and votes.
        </p>
      </div>

      <Tabs value={timeFilter} onValueChange={(value) => setTimeFilter(value as 'today' | 'week' | 'month')} className="mb-8">
        <TabsList>
          <TabsTrigger value="today">
            Today
          </TabsTrigger>
          <TabsTrigger value="week">
            This Week
          </TabsTrigger>
          <TabsTrigger value="month">
            This Month
          </TabsTrigger>
        </TabsList>
      </Tabs>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {trendingTools.map((tool, idx) => (
          <motion.div key={tool.id} {...staggerCardProps(idx, reduceMotion)}>
            <Card 
              onClick={() => handleCardClick(tool.id, tool.slug)}
              className="group relative h-full overflow-hidden bg-gradient-to-b from-white to-gray-50/50 border-0 
              shadow-[0_4px_20px_-4px_rgba(0,0,0,0.1)] 
              hover:shadow-[0_8px_30px_-4px_rgba(0,0,0,0.12)] 
              transition-all duration-300 ease-out rounded-2xl backdrop-blur-xl cursor-pointer"
            >
              <div className="relative p-4 sm:p-6 flex flex-col gap-4 sm:gap-5">
                {/* Header section */}
                <div className="flex items-start gap-3 sm:gap-4">
                  {/* Logo container */}
                  <div className="relative shrink-0">
                    <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-xl sm:rounded-2xl overflow-hidden bg-gradient-to-br from-gray-50 to-gray-100/50 
                      shadow-sm group-hover:shadow-md ring-1 ring-black/[0.04] 
                      group-hover:ring-black/[0.08] transition-all duration-300 relative">
                      <Image
                        src={tool.logo || `https://www.google.com/s2/favicons?domain=${tool.websiteUrl}&sz=128` || `https://ui-avatars.com/api/?name=${encodeURIComponent(tool.name)}`}
                        alt={tool.name}
                        fill
                        className="object-cover transform group-hover:scale-110 transition-all duration-500"
                        unoptimized
                      />
                    </div>
                    {tool.isNew && (
                      <div className="absolute -top-2 -right-2 z-10">
                        <Badge className="bg-gradient-to-r from-green-500/90 to-green-600/90 text-white border-0 
                          uppercase text-[10px] shadow-sm shadow-green-500/20">
                          New
                        </Badge>
                      </div>
                    )}
                  </div>

                  {/* Title and badges */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 truncate">
                        {tool.name}
                      </h3>
                      <Button
                        variant="ghost"
                        size="sm"
                        className={`p-0 h-auto ${isSaved(tool.id) ? "text-pink-500" : "text-gray-400"}`}
                        onClick={(e) => handleFavorite(e, tool.id)}
                      >
                        <Star 
                          className={`w-4 h-4 sm:w-5 sm:h-5 ${isSaved(tool.id) ? "fill-pink-500" : ""}`} 
                        />
                      </Button>
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 sm:gap-2 mb-1">
                      <Badge variant="secondary" 
                        className="bg-gray-100/80 text-gray-600 hover:bg-gray-100 ring-1 ring-black/[0.04] 
                          hover:ring-black/[0.08] transition-all shadow-sm text-xs">
                        {tool.category}
                      </Badge>
                      <Badge className={`shadow-md ring-1 ring-black/[0.04] ${getPricingColor(tool.pricing.type)} text-xs`}>
                        {tool.pricing.type}
                      </Badge>
                      <Badge className="bg-blue-500 text-white shadow-blue-500/20 text-xs">
                        #{tool.rating || 0}
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* Description */}
                <p className="text-sm sm:text-[15px] leading-relaxed text-gray-600 line-clamp-2 
                  group-hover:line-clamp-3 transition-all duration-300">
                  {tool.description_ai || tool.description}
                </p>

                {/* Action buttons - Stacked on mobile, side by side on larger screens */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-auto">
                  <Button
                    onClick={(e) => handleVote(e, tool.id, tool.votes)}
                    className={`${isUpvoted(tool.id) 
                        ? 'bg-gradient-to-r from-green-600/90 to-green-700/90' 
                        : 'bg-gradient-to-r from-green-500/90 to-green-600/90'} 
                      text-white hover:from-green-600 hover:to-green-700 shadow-sm hover:shadow-md 
                      hover:shadow-green-500/20 transition-all duration-300 h-9 sm:h-10 text-xs sm:text-sm ring-1 ring-black/[0.04]`}
                  >
                    <ArrowUpCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px] mr-1.5 sm:mr-2" />
                    {isUpvoted(tool.id) ? 'Voted' : 'Vote'} ({formatNumber(tool.votes || 0)})
                  </Button>
                  <Button
                    variant="outline"
                    className="border-gray-200 text-gray-700 bg-white/80 hover:bg-gray-50 
                      hover:border-gray-300 shadow-sm hover:shadow-md transition-all h-9 sm:h-10 text-xs sm:text-sm
                      ring-1 ring-black/[0.04] hover:ring-black/[0.08] backdrop-blur-sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      window.open(tool.websiteUrl, '_blank');
                    }}
                  >
                    <ExternalLink className="w-4 h-4 sm:w-[18px] sm:h-[18px] mr-1.5 sm:mr-2" />
                    Try Now
                  </Button>
                </div>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default TrendingPage; 