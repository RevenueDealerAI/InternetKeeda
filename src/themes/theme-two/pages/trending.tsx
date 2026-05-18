import { useState, useMemo } from "react";
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowUpCircle, ExternalLink, Star, TrendingUp } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useTools } from "@/lib/api/tools";
import { Tool } from "@/types/tool";
import { useToolActions } from "@/hooks/useToolActions";

const TrendingPage = () => {
  const router = useRouter();
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('today');
  const { data, isLoading, error } = useTools({ limit: 500 });
  const tools = data?.data || [];
  const { toggleUpvote, isUpvoted, toggleSave, isSaved } = useToolActions();

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

  const handleCardClick = (productId: string, slug: string) => {
    router.push(`/ai-tools/${slug}`);
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
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

  const getToolLogo = (tool: { logo?: string; name: string }) => {
    if (tool.logo) return tool.logo;
    return `https://ui-avatars.com/api/?name=${encodeURIComponent(tool.name)}&background=6366f1&color=fff&bold=true&format=svg&size=128`;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white min-h-screen"
    >
      <div className="container mx-auto px-4 py-8 mt-20">
        {/* Header Section */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <TrendingUp className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              <span className="text-gray-900">Trending</span>{' '}
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                AI Tools
              </span>
            </h1>
          </div>
          <p className="text-gray-600 text-lg">
            Discover the most popular and trending AI tools based on user engagement and votes.
          </p>
        </div>

        {/* Time Filter Tabs */}
        <Tabs value={timeFilter} onValueChange={(value) => setTimeFilter(value as 'today' | 'week' | 'month')} className="mb-8">
          <TabsList className="grid w-full max-w-md grid-cols-3 bg-gray-100 rounded-full p-1">
            <TabsTrigger value="today" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm">
              Today
            </TabsTrigger>
            <TabsTrigger value="week" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm">
              This Week
            </TabsTrigger>
            <TabsTrigger value="month" className="rounded-full data-[state=active]:bg-white data-[state=active]:text-purple-600 data-[state=active]:shadow-sm">
              This Month
            </TabsTrigger>
          </TabsList>
        </Tabs>

        {/* Tools Grid */}
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
        >
          <AnimatePresence>
            {trendingTools.map((tool, index) => (
              <motion.div
                key={tool.id}
                variants={itemVariants}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
                className="h-[280px]"
              >
                <Link href={`/ai-tools/${tool.slug}`} className="group block h-full">
                  <article
                    className="relative h-full p-[1px] rounded-[1.25rem] overflow-hidden transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl"
                    style={{
                      background: index % 2 === 0
                        ? 'linear-gradient(to bottom, #7D37FF 0%, rgba(255, 255, 255, 0) 100%)'
                        : 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, #7D37FF 100%)'
                    }}
                  >
                    <div className="relative h-full bg-[#F5F5F5] rounded-[1.25rem] p-6 group-hover:bg-white transition-colors duration-300 flex flex-col">
                      {/* Header section */}
                      <div className="flex items-start gap-3 sm:gap-4">
                        {/* Logo container */}
                        <div className="relative shrink-0">
                          <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full overflow-hidden bg-white shadow-md ring-2 ring-gray-100 relative">
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
                              <Badge className="bg-gradient-to-r from-green-500/90 to-green-600/90 text-white border-0 uppercase text-[10px] shadow-sm shadow-green-500/20">
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
                              onClick={(e) => {
                                e.preventDefault();
                                e.stopPropagation();
                                toggleSave(tool.id);
                              }}
                            >
                              <Star className={`w-4 h-4 sm:w-5 sm:h-5 ${isSaved(tool.id) ? "fill-pink-500" : ""}`} />
                            </Button>
                          </div>
                          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                            <Badge variant="secondary" className="bg-gray-100/80 text-gray-600 hover:bg-gray-100 ring-1 ring-black/[0.04] hover:ring-black/[0.08] transition-all shadow-sm text-xs">
                              {tool.category}
                            </Badge>
                            <Badge className={`shadow-md ring-1 ring-black/[0.04] ${convertPricingType(tool.pricing.type) === 'Free' ? 'bg-gradient-to-r from-purple-500/90 to-pink-500/90' : 'bg-gradient-to-r from-purple-500/90 to-pink-500/90'} text-white text-xs`}>
                              {convertPricingType(tool.pricing.type)}
                            </Badge>
                            <Badge className="bg-purple-500 text-white shadow-purple-500/20 text-xs">
                              #{tool.rating || 0}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      {/* Description */}
                      <p className="text-sm sm:text-[15px] leading-relaxed text-gray-600 line-clamp-2 group-hover:line-clamp-3 transition-all duration-300 mb-4">
                        {tool.description.replace(/✅|✔️|✓|🌟|⭐|🔥|💡|🚀|⚡|🎉|✨|💰|🔒|📊|🎯|🌟|💻|📱|🌐|🛡️|⚙️|📈|🔑|📝|🎨|🏆|💪|🎁|🎊|🎭|🎮|🎯|🔥|💯|⭐|🌟|✨/g, '').trim()}
                      </p>

                      {/* Action buttons */}
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3 mt-auto">
                        <Button
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            handleVote(e as React.MouseEvent, tool.id, tool.votes);
                          }}
                          className={`${isUpvoted(tool.id) ? 'bg-gradient-to-r from-purple-600/90 to-purple-700/90' : 'bg-gradient-to-r from-purple-500/90 to-purple-600/90'} text-white hover:from-purple-600 hover:to-purple-700 shadow-sm hover:shadow-md hover:shadow-purple-500/20 transition-all duration-300 h-9 sm:h-10 text-xs sm:text-sm rounded-full`}
                        >
                          <ArrowUpCircle className="w-4 h-4 sm:w-[18px] sm:h-[18px] mr-1.5 sm:mr-2" />
                          {isUpvoted(tool.id) ? 'Voted' : 'Vote'} ({formatNumber(tool.votes || 0)})
                        </Button>
                        <Button
                          variant="outline"
                          className="border-gray-200 text-gray-700 bg-white/80 hover:bg-gray-50 hover:border-gray-300 shadow-sm hover:shadow-md transition-all h-9 sm:h-10 text-xs sm:text-sm rounded-full"
                          onClick={(e) => {
                            e.preventDefault();
                            e.stopPropagation();
                            window.open(tool.websiteUrl, '_blank');
                          }}
                        >
                          <ExternalLink className="w-4 h-4 sm:w-[18px] sm:h-[18px] mr-1.5 sm:mr-2" />
                          Try Now
                        </Button>
                      </div>
                    </div>
                  </article>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      </div>
    </motion.div>
  );
};

export default TrendingPage; 