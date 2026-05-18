import { TrendingUp, Star, Filter } from "lucide-react";
import Image from 'next/image';
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "../components/ProductCard";
import { useState } from "react";
import { useTools } from "@/lib/api/tools";
import { useToolActions } from "@/hooks/useToolActions";

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
    <div className="container mx-auto px-4 py-8 mt-20">
      {/* Header */}
      <div className="flex flex-col items-center text-center mb-12">
        <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-purple-100 mb-4">
          <TrendingUp className="w-8 h-8 text-purple-600" />
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-4">
          Top AI Tools
        </h1>
        <p className="text-gray-600 max-w-2xl">
          Explore the most popular and highly-rated AI tools, curated based on user reviews and engagement.
        </p>
      </div>

      {/* Filters and Sort */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex flex-wrap gap-4">
          <Button 
            variant={timeFilter === 'all' ? "default" : "outline"} 
            className={`rounded-xl ${timeFilter === 'all' ? '' : 'hover:bg-purple-50'}`}
            onClick={() => handleTimeFilterChange('all')}
          >
            All Time
          </Button>
          <Button 
            variant={timeFilter === 'month' ? "default" : "outline"} 
            className={`rounded-xl ${timeFilter === 'month' ? '' : 'hover:bg-purple-50'}`}
            onClick={() => handleTimeFilterChange('month')}
          >
            This Month
          </Button>
          <Button 
            variant={timeFilter === 'week' ? "default" : "outline"} 
            className={`rounded-xl ${timeFilter === 'week' ? '' : 'hover:bg-purple-50'}`}
            onClick={() => handleTimeFilterChange('week')}
          >
            This Week
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select 
              className="rounded-xl border border-gray-200 pl-10 pr-8 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-purple-500 appearance-none bg-white min-w-[160px]"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'votes' | 'trending' | 'recent')}
            >
              <option value="votes">Most Votes</option>
              <option value="trending">Trending</option>
              <option value="recent">Recently Added</option>
            </select>
            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
              <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </div>
          </div>
        </div>
      </div>

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
                  className="flex-1"
                  onClick={() => window.open(featuredTool.websiteUrl, '_blank')}
                >
                  Try Now
                </Button>
                <Button 
                  variant="outline"
                  className="flex-1"
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {visibleTools.slice(1).map((tool) => (
          <ProductCard 
            key={tool.id}
            id={tool.id}
            slug={tool.slug}
            name={tool.name}
            description={tool.description}
            category={tool.category}
            votes={tool.votes}
            imageUrl={tool.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(tool.name)}`}
            onVote={(e) => handleVote(e, tool.id, tool.votes)}
            isFavorite={isSaved(tool.id)}
            onFavorite={(e) => {
              e.preventDefault();
              handleFavorite(tool.id);
            }}
            pricing={convertPricingType(tool.pricing.type)}
            isNew={tool.isNew}
          />
        ))}
      </div>

      {/* Load More */}
      {visibleTools.length < getFilteredAndSortedTools().length && (
        <div className="flex justify-center mt-12">
          <Button 
            variant="outline"
            className="rounded-xl hover:bg-purple-50 border-purple-200"
            onClick={() => {
              // Implement load more functionality
              console.log('Load more clicked');
            }}
          >
            Load More
          </Button>
        </div>
      )}
    </div>
  );
}; 