import { useState, useMemo } from "react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { TrendingUp } from "lucide-react";
import { ToolCardSkeletonGrid } from "../components/ToolCardSkeleton";
import { ProductCard } from "../components/ProductCard";
import { useTools } from "@/lib/api/tools";
import { Tool } from "@/types/tool";
import { useToolActions } from "@/hooks/useToolActions";

const TrendingPage = () => {
  const [timeFilter, setTimeFilter] = useState<'today' | 'week' | 'month'>('today');
  const { data, isLoading, error } = useTools({ limit: 500 });
  const tools = data?.data || [];
  const { toggleUpvote, toggleSave, isSaved } = useToolActions();

  // Trending derivation: top by total views, with the time filter narrowing
  // to tools added in that window. Editorial `isTrending=true` tools pin
  // to the top regardless of view count so admins can override the data
  // ranking. Default is "Today" tab → narrowest window, but if that's
  // empty we silently expand so the page never reads as broken.
  const trendingTools = useMemo(() => {
    const now = new Date();
    const windowMs = timeFilter === 'today' ? 24 * 60 * 60 * 1000
      : timeFilter === 'week' ? 7 * 24 * 60 * 60 * 1000
      : 30 * 24 * 60 * 60 * 1000;
    const cutoff = now.getTime() - windowMs;

    const inWindow = tools.filter(tool => {
      if (!tool.createdAt) return false;
      return new Date(tool.createdAt).getTime() >= cutoff;
    });

    // Sort: editorial pins first (preserve admin order via views fallback),
    // then everyone else by total views desc.
    const rank = (t: Tool) =>
      (t.isTrending ? 1_000_000_000 : 0) + (t.views || 0);

    const ranked = [...inWindow].sort((a, b) => rank(b) - rank(a));
    // Fallback: if the window is empty (fresh site, narrow tab), expand
    // to all-time so the user always sees something to engage with.
    const finalList = ranked.length > 0
      ? ranked
      : [...tools].sort((a, b) => rank(b) - rank(a));

    return finalList.slice(0, 50);
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
    const t = type.toLowerCase();
    if (t === 'free') return 'Free';
    if (t === 'freemium') return 'Freemium';
    return 'Paid';
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
    <div className="relative">
      {/* Light gradient page-top wash */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 top-0 h-[320px] bg-gradient-to-b from-orange-50/60 via-white to-white"
      />

      <div className="relative container mx-auto px-4 py-16 mt-20">
        <div className="max-w-3xl mb-10">
          <span className="inline-flex items-center gap-1.5 text-xs font-semibold uppercase tracking-[0.18em] text-orange-600 mb-3">
            <TrendingUp className="w-3.5 h-3.5" />
            Live ranking
          </span>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-bold tracking-tight text-gray-900">
            What everyone's <span className="gradient-text">trying</span>.
          </h1>
          <p className="text-gray-600 mt-4 text-lg leading-relaxed max-w-2xl">
            Top tools ranked by total views, narrowed by the time window you pick. Admin-pinned picks always float at the top.
          </p>
        </div>

        <Tabs value={timeFilter} onValueChange={(value) => setTimeFilter(value as 'today' | 'week' | 'month')} className="mb-10">
          <TabsList className="bg-white border border-gray-200">
            <TabsTrigger value="today">Today</TabsTrigger>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>
        </Tabs>

        {trendingTools.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Nothing trending yet</h3>
            <p className="text-gray-600">Switch to a wider time window to see more tools.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingTools.map((tool, index) => (
              <div
                key={tool.id}
                className="card-reveal"
                style={{ animationDelay: `${Math.min(index * 40, 400)}ms` }}
              >
                <ProductCard
                  id={tool.id}
                  slug={tool.slug}
                  name={tool.name}
                  description={tool.description_ai || tool.description}
                  category={tool.category}
                  votes={tool.votes}
                  imageUrl={tool.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(tool.name)}&background=DC2626&color=fff&bold=true&format=svg`}
                  onVote={(e) => handleVote(e, tool.id, tool.votes)}
                  isFavorite={isSaved(tool.id)}
                  onFavorite={(e) => {
                    e.preventDefault();
                    handleFavorite(tool.id);
                  }}
                  pricing={convertPricingType(tool.pricing.type)}
                  isNew={tool.isNew}
                />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default TrendingPage; 