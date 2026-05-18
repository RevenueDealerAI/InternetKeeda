import { useEffect, useState } from "react";
import Image from 'next/image';
import { useParams as useNextParams } from 'next/navigation'
import { useContext } from 'react'
import { ParamsContext } from '@/lib/react-router-compat'
import Link from 'next/link'
import { usePathname, useSearchParams } from 'next/navigation'
import { useTools } from "@/lib/api/tools";
import { useToolActions } from "@/hooks/useToolActions";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowLeft, Star, ExternalLink, ArrowUp } from "lucide-react";

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

  // Get category name from state or from ID
  const categoryFromState = location.state?.category;
  const [categoryName, setCategoryName] = useState<string>("");
  
  useEffect(() => {
    // Set category name based on ID if not available from state
    if (categoryFromState) {
      setCategoryName(categoryFromState);
    } else if (id) {
      // Decode the ID to get the actual category name
      const decodedCategory = decodeURIComponent(id);
      
      // Map known slugs to category names
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
      
      // If it's a known slug, use the mapped value, otherwise try to find matching category
      if (categoryMap[id.toLowerCase()]) {
        setCategoryName(categoryMap[id.toLowerCase()]);
      } else {
        // Try to find a matching category from the tools list (case-insensitive)
        const matchingCategory = tools.find(tool => 
          tool.category.toLowerCase() === decodedCategory.toLowerCase()
        )?.category;
        
        if (matchingCategory) {
          setCategoryName(matchingCategory);
        } else {
          // Fallback: use decoded category name as-is
          setCategoryName(decodedCategory);
        }
      }
    }
  }, [id, categoryFromState, tools]);

  // Filter tools by category (case-insensitive matching) and status
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
        <div className="mb-8">
          <Button 
            variant="ghost" 
            className="mb-4"
            onClick={() => window.history.back()}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4">
            <span className="text-gray-900">{getFriendlyCategoryName()}</span>
            <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent"> Tools</span>
          </h1>
          <p className="text-gray-600 text-lg">
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
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8"
            >
              {visibleTools.map((tool, index) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                  className="h-[320px] lg:h-[320px] xl:h-[320px]"
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
                        <div className="flex items-start gap-3 mb-3">
                          <div className="relative shrink-0">
                            <div className="w-16 h-16 rounded-full overflow-hidden bg-white shadow-md ring-2 ring-gray-100 relative">
                              <Image
                                src={getToolLogo(tool)}
                                alt={tool.name}
                                fill
                                className="object-cover"
                                unoptimized
                              />
                            </div>
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-[18px] font-semibold text-gray-900 line-clamp-2">
                              {tool.name}
                            </h3>
                          </div>
                        </div>
                        
                        <p className="text-base text-gray-600 line-clamp-3 mb-4">
                          {tool.description}
                        </p>

                        <div className="flex flex-wrap gap-2 mb-4">
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-600 border border-gray-200">
                            {tool.category}
                          </span>
                          <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                            {convertPricingType(tool.pricing.type)}
                          </span>
                        </div>
                        
                        <div className="flex items-center justify-between pt-4 border-t border-gray-200 mt-auto">
                          <button 
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              handleVote(e, tool.id, tool.votes);
                            }}
                            className="flex items-center gap-2 text-gray-700 hover:text-purple-600 transition-colors"
                          >
                            <ArrowUp className={`w-4 h-4 ${isUpvoted(tool.id) ? 'text-purple-600 fill-purple-600' : ''}`} />
                            <span className="text-sm font-medium">{tool.votes}</span>
                          </button>
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
            </motion.div>

            {visibleTools.length < filteredTools.length && (
              <div className="flex justify-center mt-12">
                <Button 
                  variant="outline"
                  className="rounded-full px-8 py-3 border-purple-200 hover:bg-purple-50 hover:border-purple-300 font-medium"
                  onClick={loadMore}
                >
                  Load More
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </motion.div>
  );
} 