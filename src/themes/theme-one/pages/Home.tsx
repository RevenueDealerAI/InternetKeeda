import { Button } from "@/components/ui/button";
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { ProductCard } from "../components/ProductCard";
import { Search, Star, TrendingUp, Sparkles, ArrowRight } from "lucide-react";
import { useState } from "react";
import { useTools } from "@/lib/api/tools";
import { SoftwareCategories } from "../components/home/SoftwareCategories";
import { useToolActions } from "@/hooks/useToolActions";

export const Home = () => {
  const router = useRouter();
  // Use a more efficient approach - limit tools loaded for homepage
  const { data, isLoading, error } = useTools({ 
    limit: 100, // Only load 100 most recent tools for homepage
    sortBy: 'createdAt',
    sortOrder: 'desc'
  });
  const tools = data?.data || [];
  const { toggleUpvote, isUpvoted, toggleSave, isSaved } = useToolActions();

  const trendingTools = tools.filter(tool => tool.isTrending).slice(0, 6);
  const newTools = tools.filter(tool => tool.isNew).slice(0, 6);
  const topRatedTools = [...tools]
    .sort((a, b) => b.rating - a.rating)
    .slice(0, 6);

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

  const convertPricingType = (type: string) => {
    switch (type.toLowerCase()) {
      case "free":
      case "freemium":
        return "Free";
      case "paid":
      case "premium":
      case "enterprise":
      case "subscription":
        return "Paid";
      default:
        return "Paid";
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-green-500"></div>
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
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      {/* Hero Section */}
      <section className="text-center pt-40 pb-16">
        <h1 className="text-4xl sm:text-5xl font-bold bg-gradient-to-r from-green-500 to-green-600 bg-clip-text text-transparent mb-6">
          Discover the Best AI Tools
        </h1>
        <p className="text-gray-600 text-lg max-w-2xl mx-auto mb-12">
          Explore our curated collection of AI-powered tools to enhance your workflow
        </p>
        <div className="flex justify-center gap-4">
          <Button 
            size="lg"
            className="bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
            onClick={() => router.push("/ai-tools")}
          >
            <Search className="w-4 h-4 mr-2" />
            Explore Tools
          </Button>
          <Button 
            size="lg"
            variant="outline"
            className="border-2 border-green-200 text-green-600 hover:bg-green-50"
            onClick={() => router.push("/add-product")}
          >
            Submit Tool
          </Button>
        </div>
      </section>

      {/* Featured Sections */}
      <div className="container mx-auto px-4 py-16 space-y-24">
        {/* Trending Tools */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                <TrendingUp className="w-6 h-6 text-green-600" />
                Trending Tools
              </h2>
              <p className="text-gray-600">Discover what's popular in the AI community</p>
            </div>
            <Link href="/top-products"
              className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {trendingTools.map((tool) => (
              <ProductCard 
                key={tool.id}
                id={tool.id}
                slug={tool.slug}
                name={tool.name}
                description={tool.description_ai || tool.description}
                category={tool.category}
                votes={tool.votes}
                imageUrl={tool.logo || ""}
                onVote={(e) => handleVote(e, tool.id, tool.votes)}
                isFavorite={isSaved(tool.id)}
                onFavorite={(e) => handleFavorite(e, tool.id)}
                pricing={convertPricingType(tool.pricing.type)}
                isNew={tool.isNew}
              />
            ))}
          </div>
        </section>

        {/* New Releases */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                <Sparkles className="w-6 h-6 text-green-600" />
                New Releases
              </h2>
              <p className="text-gray-600">The latest AI tools and innovations</p>
            </div>
            <Link href="/latest-launches"
              className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {newTools.map((tool) => (
              <ProductCard 
                key={tool.id}
                id={tool.id}
                slug={tool.slug}
                name={tool.name}
                description={tool.description_ai || tool.description}
                category={tool.category}
                votes={tool.votes}
                imageUrl={tool.logo || ""}
                onVote={(e) => handleVote(e, tool.id, tool.votes)}
                isFavorite={isSaved(tool.id)}
                onFavorite={(e) => handleFavorite(e, tool.id)}
                pricing={convertPricingType(tool.pricing.type)}
                isNew={tool.isNew}
              />
            ))}
          </div>
        </section>

        {/* Software Categories Section */}
        {/* Temporarily commented out
        <SoftwareCategories />
        */}

        {/* Top Rated */}
        <section>
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 flex items-center gap-2 mb-2">
                <Star className="w-6 h-6 text-green-600" />
                Top Rated
              </h2>
              <p className="text-gray-600">Highest rated tools by our community</p>
            </div>
            <Link href="/top-products"
              className="flex items-center gap-1 text-green-600 hover:text-green-700 font-medium"
            >
              View All
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {topRatedTools.map((tool) => (
              <ProductCard 
                key={tool.id}
                id={tool.id}
                slug={tool.slug}
                name={tool.name}
                description={tool.description_ai || tool.description}
                category={tool.category}
                votes={tool.votes}
                imageUrl={tool.logo || ""}
                onVote={(e) => handleVote(e, tool.id, tool.votes)}
                isFavorite={isSaved(tool.id)}
                onFavorite={(e) => handleFavorite(e, tool.id)}
                pricing={convertPricingType(tool.pricing.type)}
                isNew={tool.isNew}
              />
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}; 