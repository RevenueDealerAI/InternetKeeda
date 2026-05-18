import { useEffect, useState } from "react";
import { useParams as useNextParams } from 'next/navigation'
import { useContext } from 'react'
import { ParamsContext } from '@/lib/react-router-compat'
import { usePathname, useSearchParams } from 'next/navigation'
import { ProductCard } from "../../components/ProductCard";
import { useTools } from "@/lib/api/tools";
import { useToolActions } from "@/hooks/useToolActions";
import { Button } from "@/components/ui/button";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowLeft } from "lucide-react";
import { staggerCardProps } from "@/lib/animations";

export default function CategoryPage() {
  const contextParams = useContext(ParamsContext);
  const nextParams = useNextParams();
  const params = { ...contextParams, ...nextParams } as { id?: string };
  const { id } = params;
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const location = { pathname: pathname || '/', search: searchParams ? `?${searchParams.toString()}` : '', hash: '', state: null };
  const { data, isLoading, error } = useTools({ limit: 1000 });
  const tools = data?.data || [];
  const { toggleUpvote, isUpvoted, toggleSave, isSaved } = useToolActions();
  const [pageSize, setPageSize] = useState(9);
  const reduceMotion = useReducedMotion();

  // Get category name from state or from ID
  const categoryFromState = location.state?.category;
  const [categoryName, setCategoryName] = useState<string>("");
  
  useEffect(() => {
    // Set category name based on ID if not available from state
    if (categoryFromState) {
      setCategoryName(categoryFromState);
    } else if (id) {
      const decodedCategory = decodeURIComponent(id);
      
      const categoryMap: { [key: string]: string } = {
        "chatbots": "AI Chatbots and Assistants",
        "image": "AI for Image Generation",
        "code": "AI for Coding and Development",
        "video": "AI for Video Generation",
        "audio": "AI for Audio Enhancement",
        "research": "AI Search Engines and Research Tools",
        "productivity": "AI for Productivity",
        "automation": "AI for Automation",
      };
      
      if (categoryMap[id.toLowerCase()]) {
        setCategoryName(categoryMap[id.toLowerCase()]);
      } else {
        const matchingCategory = tools.find(tool => 
          tool.category.toLowerCase() === decodedCategory.toLowerCase()
        )?.category;
        
        if (matchingCategory) {
          setCategoryName(matchingCategory);
        } else {
          setCategoryName(decodedCategory);
        }
      }
    }
  }, [id, categoryFromState, tools]);

  const filteredTools = tools.filter(tool => {
    // Only show published or approved tools
    const allowedStatuses = ['published', 'approved'] as const;
    if (!allowedStatuses.includes(tool.status as typeof allowedStatuses[number])) {
      return false;
    }
    
    if (!categoryName) return false; // Don't show all tools if category name is not set
    
    // Handle special cases with multiple category name variations
    if (id === "code") {
      return (
        tool.category === "AI for Coding and Development" ||
        tool.category === "AI for Development" ||
        tool.category.toLowerCase() === "code & development"
      );
    } else if (id === "video") {
      return (
        tool.category === "AI for Video Generation" ||
        tool.category === "AI for Video Editing"
      );
    } else if (id === "audio") {
      return (
        tool.category === "AI for Audio Enhancement" ||
        tool.category === "AI for Music Generation" ||
        tool.category === "AI for Voice Generation"
      );
    } else {
      // Case-insensitive exact match
      return tool.category.toLowerCase() === categoryName.toLowerCase();
    }
  });

  const visibleTools = filteredTools.slice(0, pageSize);

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

  const loadMore = () => {
    setPageSize(prev => prev + 9);
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
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-orange-500"></div>
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

  // Get friendly category name for display
  const getFriendlyCategoryName = () => {
    switch (id) {
      case "chatbots": return "Chatbots & Assistants";
      case "image": return "Image Generation";
      case "code": return "Code & Development";
      case "video": return "Video & Animation";
      case "audio": return "Audio & Music";
      case "research": return "Research & Analysis";
      case "productivity": return "Productivity";
      case "automation": return "Automation";
      default: return categoryName;
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 mt-20">
      <div className="mb-8">
        <Button 
          variant="ghost" 
          className="mb-4"
          onClick={() => window.history.back()}
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
        <h1 className="text-4xl font-bold mb-4">
          {getFriendlyCategoryName()} Tools
        </h1>
        <p className="text-gray-600">
          Explore the best AI tools for {getFriendlyCategoryName().toLowerCase()}.
        </p>
      </div>

      {filteredTools.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">No tools found in this category</h2>
          <p className="text-gray-600 mb-6">We couldn't find any tools in this category at the moment.</p>
          <Button onClick={() => window.history.back()}>
            Go Back
          </Button>
        </div>
      ) : (
        <>
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {visibleTools.map((tool, idx) => (
              <motion.div key={tool.id} {...staggerCardProps(idx, reduceMotion)}>
                <ProductCard
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
              </motion.div>
            ))}
          </motion.div>

          {/* Load More */}
          {visibleTools.length < filteredTools.length && (
            <div className="flex justify-center mt-12">
              <Button 
                variant="outline"
                className="rounded-xl hover:bg-orange-50 border-orange-200"
                onClick={loadMore}
              >
                Load More
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
} 