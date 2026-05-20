import { TrendingUp, Star, Filter } from "lucide-react";
import Image from 'next/image';
import { useRouter } from 'next/navigation'
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ProductCard } from "../components/ProductCard";
import { useState } from "react";
import { useTools } from "@/lib/api/tools";
import { useToolActions } from "@/hooks/useToolActions";
import { motion, useReducedMotion } from "framer-motion";
import { staggerCardProps } from "@/lib/animations";
import { ToolCardSkeletonGrid } from "../components/ToolCardSkeleton";

const getPricingColor = (type: string) => {
  switch (type.toLowerCase()) {
    case 'free': return 'bg-gradient-to-r from-emerald-500/90 to-teal-500/90 text-white shadow-emerald-500/20';
    case 'freemium': return 'bg-gradient-to-r from-blue-500/90 to-indigo-500/90 text-white shadow-blue-500/20';
    case 'paid': 
    case 'enterprise': return 'bg-gradient-to-r from-orange-500/90 to-pink-500/90 text-white shadow-orange-500/20';
    default: return '';
  }
};

export const TopProducts = () => {
  const router = useRouter();
  const [timeFilter, setTimeFilter] = useState<'all' | 'month' | 'week'>('all');
  const [sortBy, setSortBy] = useState<'votes' | 'trending' | 'recent'>('trending');
  const { data, isLoading, error } = useTools({ limit: 500 });
  const reduceMotion = useReducedMotion();
  const tools = data?.data || [];
  const { toggleUpvote, isUpvoted, toggleSave, isSaved } = useToolActions();

  // Top Products derivation: Wilson-style ranking that weights rating by
  // log(votes+1) so a 5★ tool with 1 vote can't outrank a 4.7★ tool with
  // 800 votes. Editorial `isTopRated=true` tools pin to the top so admins
  // can override the data ranking. The sort dropdown still works — it
  // toggles between the derived score, raw votes, and recency.
  const getFilteredAndSortedTools = () => {
    let filteredTools = [...tools];

    if (timeFilter !== 'all') {
      const now = new Date();
      filteredTools = filteredTools.filter(tool => {
        const toolDate = new Date(tool.createdAt);
        const diffDays = (now.getTime() - toolDate.getTime()) / (1000 * 60 * 60 * 24);
        return timeFilter === 'week' ? diffDays <= 7 : diffDays <= 30;
      });
    }

    const wilsonScore = (t: typeof filteredTools[number]) =>
      (t.rating || 0) * Math.log((t.votes || 0) + 1);
    // Editorial pin: isTopRated tools always float above the derived list.
    const PIN = 1_000_000;

    switch (sortBy) {
      case 'votes':
        filteredTools.sort((a, b) =>
          ((b.isTopRated ? PIN : 0) + (b.votes || 0)) -
          ((a.isTopRated ? PIN : 0) + (a.votes || 0))
        );
        break;
      case 'recent':
        filteredTools.sort((a, b) =>
          ((b.isTopRated ? PIN : 0) + new Date(b.createdAt).getTime() / 1e10) -
          ((a.isTopRated ? PIN : 0) + new Date(a.createdAt).getTime() / 1e10)
        );
        break;
      case 'trending':
      default:
        filteredTools.sort((a, b) =>
          ((b.isTopRated ? PIN : 0) + wilsonScore(b)) -
          ((a.isTopRated ? PIN : 0) + wilsonScore(a))
        );
        break;
    }

    return filteredTools.slice(0, 50);
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
      <div className="container mx-auto px-4 py-8 mt-24">
        <ToolCardSkeletonGrid count={9} className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" />
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
    <div className="relative">
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[360px] bg-gradient-to-b from-red-50/60 via-white to-white"
      />
      <div className="relative container mx-auto px-4 py-16 mt-20">
        <div className="flex flex-col items-center text-center mb-12">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-orange-600 mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            Wilson-style ranking
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900 mb-4">
            The <span className="gradient-text">top</span> AI tools.
          </h1>
          <p className="text-gray-600 max-w-2xl text-lg leading-relaxed">
            Ranked by rating weighted by vote volume — so heavily-loved tools rise to the top without one-vote ratings dominating.
          </p>
        </div>

      {/* Filters and Sort */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="flex flex-wrap gap-4">
          <Button 
            variant={timeFilter === 'all' ? "default" : "outline"} 
            className={`rounded-xl ${timeFilter === 'all' ? '' : 'hover:bg-orange-50'}`}
            onClick={() => handleTimeFilterChange('all')}
          >
            All Time
          </Button>
          <Button 
            variant={timeFilter === 'month' ? "default" : "outline"} 
            className={`rounded-xl ${timeFilter === 'month' ? '' : 'hover:bg-orange-50'}`}
            onClick={() => handleTimeFilterChange('month')}
          >
            This Month
          </Button>
          <Button 
            variant={timeFilter === 'week' ? "default" : "outline"} 
            className={`rounded-xl ${timeFilter === 'week' ? '' : 'hover:bg-orange-50'}`}
            onClick={() => handleTimeFilterChange('week')}
          >
            This Week
          </Button>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
            <select 
              className="rounded-xl border border-gray-200 pl-10 pr-8 py-2 text-gray-600 focus:outline-none focus:ring-2 focus:ring-orange-500 appearance-none bg-white min-w-[160px]"
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
        <div className="bg-gradient-to-br from-orange-50 to-blue-50 rounded-2xl p-6 mb-12">
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
              <p className="text-gray-600">{featuredTool.description_ai || featuredTool.description}</p>
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
        {visibleTools.slice(1).map((tool, idx) => (
          <motion.div key={tool.id} {...staggerCardProps(idx, reduceMotion)}>
            <ProductCard
              id={tool.id}
              slug={tool.slug}
              name={tool.name}
              description={tool.description_ai || tool.description}
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
          </motion.div>
        ))}
      </div>

      </div>
    </div>
  );
}; 