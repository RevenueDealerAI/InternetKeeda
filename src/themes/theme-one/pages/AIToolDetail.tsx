import { useState, useEffect, useMemo, useCallback } from "react";
import { useParams as useNextParams } from 'next/navigation';
import { useContext } from 'react';
import { ParamsContext } from '@/lib/react-router-compat';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Skeleton } from "@/components/ui/skeleton";
import { motion, AnimatePresence } from "framer-motion";
import { 
  ArrowUpCircle, 
  Share2, 
  ExternalLink, 
  MessageSquare,
  Star,
  Globe,
  Twitter,
  Linkedin,
  Chrome,
  Github,
  ArrowLeft,
  CheckCircle2,
  Users,
  Zap,
  Shield,
  ChevronUp,
  Loader2,
  BookmarkIcon
} from "lucide-react";
import { toast } from "sonner";
import { useToolActions } from "@/hooks/useToolActions";
import { Tool } from "@/types/tool";
import { useSponsoredListings } from "@/contexts/SponsoredListingsContext";
import { SponsoredListing } from "../components/SponsoredListings";
import { DEFAULT_VOTE_COUNT, getToolVoteState } from "@/utils/voteUtils";
import mongoose from 'mongoose';
import ReviewForm from "../components/reviews/ReviewForm";
import ReviewList from "../components/reviews/ReviewList";
import { formatTextIntoParagraphs } from "@/utils/textFormatter";

// Logo cache utilities
const LOGO_CACHE_KEY = 'ai_tools_logo_cache';
const CACHE_EXPIRY = 7 * 24 * 60 * 60 * 1000; // 7 days

interface LogoCacheEntry {
  url: string;
  timestamp: number;
}

interface LogoCache {
  [key: string]: LogoCacheEntry;
}

const getLogoFromCache = (toolId: string): string | null => {
  try {
    const cache = JSON.parse(localStorage.getItem(LOGO_CACHE_KEY) || '{}') as LogoCache;
    const entry = cache[toolId];
    if (entry && Date.now() - entry.timestamp < CACHE_EXPIRY) {
      return entry.url;
    }
    return null;
  } catch {
    return null;
  }
};

const saveLogoToCache = (toolId: string, url: string) => {
  try {
    const cache = JSON.parse(localStorage.getItem(LOGO_CACHE_KEY) || '{}') as LogoCache;
    cache[toolId] = {
      url,
      timestamp: Date.now()
    };
    localStorage.setItem(LOGO_CACHE_KEY, JSON.stringify(cache));
  } catch {
    // Silently fail if localStorage is not available
  }
};

const ToolDetailSkeleton = () => (
  <div className="animate-pulse">
    <div className="flex flex-col items-center sm:items-start sm:flex-row gap-4 sm:gap-6">
      <div className="w-24 h-24 bg-gray-200 rounded-xl" />
      <div className="flex-1 text-center sm:text-left">
        <div className="flex flex-wrap justify-center sm:justify-start gap-2 mb-3">
          <div className="h-6 w-32 bg-gray-200 rounded-full" />
          <div className="h-6 w-24 bg-gray-200 rounded-full" />
        </div>
        <div className="h-8 w-full sm:w-3/4 bg-gray-200 rounded-lg mb-3 mx-auto sm:mx-0" />
        <div className="h-20 bg-gray-200 rounded-lg" />
      </div>
    </div>

    <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-8">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-xl p-3 sm:p-4 border border-gray-200">
          <div className="h-6 w-24 bg-gray-200 rounded mb-2" />
          <div className="h-8 w-16 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  </div>
);

// Define an interface for the expected structure of a populated toolId within a SponsoredListing
interface PopulatedToolInfo {
  _id: string;
  name?: string;
  slug?: string;
  votes?: number;
  views?: number;
  // Add other fields you expect to be populated and might use from toolId
  websiteUrl?: string;
  category?: string;
  tags?: string[];
  logo?: string;
  description?: string;
  pricing?: Tool['pricing'];
  features?: string[];
  status?: Tool['status'];
  isTrending?: boolean;
  isNew?: boolean; // or isNewTool if that's the backend field name
  rating?: number;
  reviews?: number;
  createdAt?: string;
  updatedAt?: string;
}

const getActualDbIdFromSponsored = (listing: SponsoredListing): string | null => {
  const toolIdField = listing.toolId as unknown as PopulatedToolInfo | string;

  if (typeof toolIdField === 'object' && toolIdField !== null && toolIdField._id) {
    const populatedTool = toolIdField;
    if (mongoose.Types.ObjectId.isValid(populatedTool._id)) {
      return populatedTool._id.toString();
    }
  } else if (typeof toolIdField === 'string' && mongoose.Types.ObjectId.isValid(toolIdField)) {
    return toolIdField;
  }
  return null;
};

const API_BASE_URL = '';

export const AIToolDetail = () => {
  const contextParams = useContext(ParamsContext);
  const nextParams = useNextParams();
  const params = { ...contextParams, ...nextParams };
  const slug = params.slug || params.id; // Support both slug and id parameters
  const router = useRouter();
  const [tool, setTool] = useState<Tool | null>(null);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const { isUpvoted, isSaved, toggleUpvote, toggleSave, isLoading: isActionLoading } = useToolActions();
  const { listings: sponsoredListings, isLoading: sponsoredListingsLoading } = useSponsoredListings();

  const currentActualDbId = useMemo(() => {
    return tool && tool._id && mongoose.Types.ObjectId.isValid(tool._id) ? tool._id : null;
  }, [tool]);

  const fetchAndSetTool = useCallback(async () => {
    const normalizedSlug = Array.isArray(slug) ? slug[0] : slug;
    if (!normalizedSlug) {
      setIsLoading(false); return;
    }
    setIsLoading(true);
    setTool(null);

    try {
      let toolToFetchId: string | null = normalizedSlug;
      let isResolvedSponsored = false;

      const sponsoredListingData = sponsoredListings.find(l => l.slug === normalizedSlug);

      if (sponsoredListingData) {
        const underlyingDbId = getActualDbIdFromSponsored(sponsoredListingData);
        if (underlyingDbId) {
          toolToFetchId = underlyingDbId;
          isResolvedSponsored = true;
        }
      }
      
      console.log(`[AIToolDetail] Fetching tool: ${toolToFetchId}`);
      const response = await fetch(`${API_BASE_URL}/api/tools/${toolToFetchId}`);
      if (!response.ok) {
        // If we tried to fetch by ID and failed, and this was a sponsored listing, try fetching by slug as fallback
        if (isResolvedSponsored && toolToFetchId !== normalizedSlug) {
          const fallbackResponse = await fetch(`${API_BASE_URL}/api/tools/${normalizedSlug}`);
          if (fallbackResponse.ok) {
            const fallbackToolData = await fallbackResponse.json() as Tool;
            if (fallbackToolData) {
              fallbackToolData.slug = normalizedSlug;
              setTool(fallbackToolData);
              setIsLoading(false);
              return;
            }
          }
        }
        const errorText = await response.text();
        throw new Error(`Tool not found or API error: ${response.status} (${errorText.substring(0,100)})`);
      }
      const fetchedToolData = await response.json() as Tool;
      
      if (fetchedToolData) {
        if (isResolvedSponsored && fetchedToolData.slug !== normalizedSlug) {
          fetchedToolData.slug = normalizedSlug; 
        }
        console.log(`[AIToolDetail] Tool fetched successfully:`, fetchedToolData.name);
        setTool(fetchedToolData);
      } else {
        throw new Error('Tool data could not be resolved from API response.');
      }

    } catch (error) {
      const typedError = error as Error;
      toast.error(typedError.message || "Failed to load tool details.");
    } finally {
      setIsLoading(false);
    }
  }, [slug, sponsoredListings]);

  useEffect(() => {
    if (!sponsoredListingsLoading) {
      fetchAndSetTool();
    } else {
      console.log('[AIToolDetail] Waiting for sponsored listings to load before fetching tool...');
    }
  }, [slug, sponsoredListingsLoading, fetchAndSetTool]);

  useEffect(() => {
    const handleVotesUpdated = (event: CustomEvent) => {
      const { toolId: updatedToolId, votes: newVoteCount } = event.detail;
      if (currentActualDbId && currentActualDbId === updatedToolId) {
        setTool(prevTool => prevTool ? { ...prevTool, votes: newVoteCount } : null);
      }
    };
    window.addEventListener('toolVotesUpdated', handleVotesUpdated as EventListener);
    return () => window.removeEventListener('toolVotesUpdated', handleVotesUpdated as EventListener);
  }, [currentActualDbId]);
  
  const canUpvoteThisTool = useMemo(() => {
    // Only allow upvoting if we have a valid MongoDB ID and user is signed in (implicitly handled by toggleUpvote)
    return !!currentActualDbId;
  }, [currentActualDbId]);

  if (isLoading || (sponsoredListingsLoading && !tool)) {
    return <div className="p-10"><Skeleton className="w-full h-[400px] rounded-lg" /></div>;
  }
  
  if (!tool) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[calc(100vh-200px)] p-4 text-center">
        <Zap className="w-16 h-16 text-gray-300 mb-4" />
        <h2 className="text-2xl font-semibold text-gray-700 mb-2">Tool Not Found</h2>
        <p className="text-gray-500 mb-6">Sorry, the tool you were looking for could not be loaded.</p>
        <Button onClick={() => router.push('/')}>Go to Homepage</Button>
      </div>
    );
  }

  const displayVotes = tool.votes;
  // Example of conditional default display if votes are 0 (DB is source of truth)
  // const displayVotes = (tool.votes === 0) ? DEFAULT_VOTE_COUNT : tool.votes;

  // Define handleScroll function
  const handleScroll = () => {
    const scrollPosition = window.scrollY;
    setShowQuickActions(scrollPosition > 300);
  };

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied to clipboard!");
    } catch (error) {
      console.error('Error sharing:', error);
      toast.error("Failed to copy link");
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 overflow-x-hidden">
      <main className="pt-16 sm:pt-20 pb-16">
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 py-6 sm:py-8">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ToolDetailSkeleton />
                </motion.div>
              ) : tool && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col lg:flex-row gap-6 sm:gap-12"
                >
                  {/* Left Column - Tool Info */}
                  <div className="flex-1">
                    <div className="flex flex-col gap-6">
                      {/* Back button at top for mobile */}
                      <div className="block sm:hidden mb-2">
                        <Link href="/"
                          className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
                        >
                          <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                          Back to AI Tools
                        </Link>
                      </div>
                      
                      <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6 sm:gap-6">
                        {/* Tool Image - Centered on mobile */}
                        <div className="relative">
                          <div className="w-28 h-28 sm:w-24 sm:h-24 rounded-2xl overflow-hidden bg-gradient-to-br from-green-100 to-blue-50 shadow-sm flex items-center justify-center relative">
                            <Image
                              src={tool.logo || `https://ui-avatars.com/api/?name=${encodeURIComponent(tool.name)}`}
                              alt={tool.name}
                              fill
                              className="object-contain sm:object-cover p-2"
                              unoptimized
                            />
                          </div>
                          <div className="absolute -bottom-3 -right-3 bg-green-100 text-green-700 px-3 py-1 rounded-full text-sm font-medium">
                            #{Math.floor((tool.votes || 0) / 100)}
                          </div>
                        </div>

                        {/* Tool Details */}
                        <div className="flex-1 min-w-0 mt-4 sm:mt-0 text-center sm:text-left">
                          <div className="flex flex-col items-center sm:items-start gap-4">
                            <div>
                              {/* Back button for desktop */}
                              <div className="hidden sm:block mb-4">
                                <Link href="/"
                                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 group"
                                >
                                  <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                  Back to AI Tools
                                </Link>
                              </div>
                              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2 mb-3">
                                {sponsoredListings.some(s => s.slug === slug) && <Badge className="bg-yellow-100 text-yellow-700 border-0">Sponsored</Badge>}
                                <Badge variant="outline" className="text-gray-600 bg-white">
                                  {tool.category}
                                </Badge>
                              </div>
                              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">
                                {tool.name}
                              </h1>
                              <div className="text-base sm:text-lg text-gray-600 leading-relaxed">
                                {formatTextIntoParagraphs(tool.description_ai || tool.description).slice(0, 2).map((paragraph, index) => (
                                  <p key={index} className="mb-4 last:mb-0">
                                    {paragraph}
                                  </p>
                                ))}
                                {formatTextIntoParagraphs(tool.description_ai || tool.description).length > 2 && (
                                  <p className="text-sm text-gray-500 mt-2">
                                    View more details in the About section below...
                                  </p>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-6 sm:mt-8">
                      <div className="bg-white rounded-xl p-3 sm:p-4 flex flex-col items-center text-center">
                        <Users className="w-5 h-5 sm:w-6 sm:h-6 text-green-600 mb-1" />
                        <div className="text-xs sm:text-sm text-gray-500 mb-1">Views</div>
                        <div className="text-lg sm:text-2xl font-bold">{tool.views?.toLocaleString()}+</div>
                      </div>
                      <div className="bg-white rounded-xl p-3 sm:p-4 flex flex-col items-center text-center">
                        <Star className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-500 mb-1" />
                        <div className="text-xs sm:text-sm text-gray-500 mb-1">Rating</div>
                        <div className="text-lg sm:text-2xl font-bold">{tool.rating?.toFixed(1)}/5.0</div>
                      </div>
                      <div className="bg-white rounded-xl p-3 sm:p-4 flex flex-col items-center text-center">
                        <Zap className="w-5 h-5 sm:w-6 sm:h-6 text-blue-500 mb-1" />
                        <div className="text-xs sm:text-sm text-gray-500 mb-1">Votes</div>
                        <div 
                          className="text-lg sm:text-2xl font-bold votes-count"
                          data-tool-id={currentActualDbId}
                        >
                          {displayVotes}
                        </div>
                      </div>
                      <div className="bg-white rounded-xl p-3 sm:p-4 flex flex-col items-center text-center">
                        <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-green-500 mb-1" />
                        <div className="text-xs sm:text-sm text-gray-500 mb-1">Reviews</div>
                        <div className="text-lg sm:text-2xl font-bold">{tool.reviews}</div>
                      </div>
                    </div>

                    {/* Action Buttons with loading states */}
                    <div className="grid grid-cols-2 sm:flex sm:items-center gap-3 mt-6 sm:mt-8">
                      <Button
                        onClick={() => {
                          if (currentActualDbId && canUpvoteThisTool) {
                            toggleUpvote(currentActualDbId, tool.votes || 0);
                          } else {
                            // toggleUpvote in useToolActions already handles isSignedIn check and toasts
                            // This is a fallback if canUpvoteThisTool is false for other reasons (e.g. invalid ID)
                            if (!currentActualDbId) toast.info("Tool ID not available for upvoting.");
                            else toast.info("This tool cannot be upvoted at this moment.");
                          }
                        }}
                        size="default"
                        disabled={!canUpvoteThisTool || isActionLoading}
                        className={`w-full sm:flex-1 sm:max-w-[200px] rounded-xl transition-all duration-300 ${
                          (currentActualDbId && isUpvoted(currentActualDbId))
                            ? "bg-green-100 text-green-700 hover:bg-green-200"
                            : "bg-gradient-to-r from-green-500 to-green-600 text-white hover:from-green-600 hover:to-green-700"
                        }`}
                      >
                        {isActionLoading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" /> : <ArrowUpCircle className={`w-4 h-4 sm:w-5 sm:h-5 mr-2 ${!(currentActualDbId && isUpvoted(currentActualDbId)) ? "animate-bounce" : ""}`} />}
                        {(currentActualDbId && isUpvoted(currentActualDbId)) ? "Upvoted" : "Upvote"}
                      </Button>
                      <Button 
                        variant="outline" 
                        size="default"
                        className={`w-full sm:flex-1 sm:max-w-[200px] rounded-xl ${
                            (currentActualDbId && isSaved(currentActualDbId)) ? "bg-green-50 border-green-200 text-green-700" : "" 
                        }`}
                        onClick={() => currentActualDbId && toggleSave(currentActualDbId)}
                        disabled={!currentActualDbId || isActionLoading}
                      >
                        {isActionLoading ? <Loader2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-spin" /> : <BookmarkIcon className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />}
                        {(currentActualDbId && isSaved(currentActualDbId)) ? "Saved" : "Save"}
                      </Button>
                      <Button
                        variant="outline"
                        size="default"
                        className="w-full sm:flex-1 sm:max-w-[200px] rounded-xl"
                        onClick={handleShare}
                      >
                        <Share2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Share
                      </Button>
                      <Button
                        variant="outline"
                        size="default"
                        className="w-full sm:flex-1 sm:max-w-[200px] rounded-xl"
                        onClick={() => tool.websiteUrl && window.open(tool.websiteUrl, '_blank')}
                      >
                        <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                        Try Now
                      </Button>
                    </div>

                    {/* Tabs Section */}
                    <div className="mt-8 sm:mt-12">
                      <Tabs defaultValue="about" className="w-full">
                        <div className="overflow-x-auto">
                          <TabsList className="w-full justify-start bg-white border-b rounded-none p-0 h-auto">
                            <div className="flex w-full min-w-max">
                              <TabsTrigger
                                value="about"
                                className="flex-1 min-w-[80px] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none py-3 px-4 text-sm"
                              >
                                About
                              </TabsTrigger>
                              <TabsTrigger
                                value="features"
                                className="flex-1 min-w-[80px] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none py-3 px-4 text-sm"
                              >
                                Features
                              </TabsTrigger>
                              <TabsTrigger
                                value="pricing"
                                className="flex-1 min-w-[80px] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none py-3 px-4 text-sm"
                              >
                                Pricing
                              </TabsTrigger>
                              <TabsTrigger
                                value="reviews"
                                className="flex-1 min-w-[80px] data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-green-600 rounded-none py-3 px-4 text-sm"
                              >
                                Reviews
                              </TabsTrigger>
                            </div>
                          </TabsList>
                        </div>
                        <TabsContent value="about" className="mt-6">
                          <div className="prose prose-sm sm:prose-lg max-w-none">
                            <div className="text-base sm:text-lg text-gray-600 leading-relaxed space-y-4">
                              {formatTextIntoParagraphs(tool.description_ai || tool.description).map((paragraph, index) => (
                                <p key={index}>
                                  {paragraph}
                                </p>
                              ))}
                            </div>
                            <div className="mt-6 sm:mt-8">
                              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Key Benefits</h3>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {tool.features.map((feature, index) => (
                                  <div key={index} className="flex items-center gap-3 p-3 bg-green-50 rounded-lg">
                                    <div className="p-1 rounded-full bg-green-100">
                                      <CheckCircle2 className="w-4 h-4 text-green-600" />
                                    </div>
                                    <span className="font-medium text-gray-900">{feature}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                            <div className="mt-6 sm:mt-8">
                              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Use Cases</h3>
                              <div className="flex flex-wrap gap-2">
                                {tool.tags.map((tag, index) => (
                                  <div key={index} className="flex items-center gap-2 px-3 py-2 bg-blue-50 rounded-full">
                                    <Zap className="w-4 h-4 text-blue-600" />
                                    <span className="font-medium text-gray-900 capitalize">{tag}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="features" className="mt-6">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            {tool.features.map((feature, index) => (
                              <div key={index} className="flex items-center gap-3">
                                <CheckCircle2 className="w-4 h-4 sm:w-5 sm:h-5 text-green-500 flex-shrink-0" />
                                <span className="text-sm sm:text-base text-gray-600">{feature}</span>
                              </div>
                            ))}
                          </div>
                        </TabsContent>
                        <TabsContent value="pricing" className="mt-6">
                          <div className="prose prose-sm sm:prose-lg max-w-none">
                            <div className="flex items-center gap-3 mb-4">
                              <Badge variant="outline" className="text-green-600 border-green-200">
                                {tool.pricing.type}
                              </Badge>
                              {tool.pricing.startingPrice > 0 && (
                                <span className="text-sm sm:text-base text-gray-600">Starting from ${tool.pricing.startingPrice}</span>
                              )}
                            </div>
                          </div>
                        </TabsContent>
                        <TabsContent value="reviews" className="mt-6">
                          <div className="prose prose-sm sm:prose-lg max-w-none">
                            <div className="flex items-center gap-3 mb-4">
                              <Star className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-400" />
                              <span className="text-base sm:text-lg font-semibold">{tool.rating}/5.0</span>
                              <span className="text-sm sm:text-base text-gray-600">({tool.reviews} reviews)</span>
                            </div>
                            
                            {/* Reviews List */}
                            <div className="mt-6 border-t border-gray-200 pt-6">
                              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Customer Reviews</h3>
                              <ReviewList toolId={currentActualDbId || ""} />
                            </div>
                            
                            {/* Review Form */}
                            <div className="mt-8 border-t border-gray-200 pt-6">
                              <h3 className="text-lg sm:text-xl font-semibold text-gray-900 mb-4">Write a Review</h3>
                              <ReviewForm 
                                toolId={currentActualDbId || ""} 
                                onSuccess={() => toast.success('Review submitted!')} 
                              />
                            </div>
                          </div>
                        </TabsContent>
                      </Tabs>
                    </div>
                  </div>

                  {/* Right Column - Additional Info */}
                  <div className="w-full lg:w-80 mt-6 lg:mt-0 space-y-6">
                    {/* Highlights Card */}
                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 hover:border-green-200 transition-colors">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Highlights</h3>
                      <div className="space-y-3">
                        {tool.features.slice(0, 4).map((feature, index) => (
                          <div key={index} className="flex items-center gap-2 text-sm sm:text-base text-gray-600">
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                            <span>{feature}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Tags Card */}
                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 hover:border-green-200 transition-colors">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Tags</h3>
                      <div className="flex flex-wrap gap-2">
                        {tool.tags.map((tag, index) => (
                          <Badge
                            key={index}
                            variant="secondary"
                            className="bg-gray-100 text-gray-600 hover:bg-gray-200"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    </div>

                    {/* Links Card */}
                    <div className="bg-white rounded-xl sm:rounded-2xl p-4 sm:p-6 border border-gray-200 hover:border-green-200 transition-colors">
                      <h3 className="text-base sm:text-lg font-semibold text-gray-900 mb-3 sm:mb-4">Links</h3>
                      <div className="space-y-3">
                        <a
                          href={tool.websiteUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm sm:text-base text-gray-600 hover:text-green-600 transition-colors"
                        >
                          <Globe className="w-4 h-4" />
                          <span>Website</span>
                        </a>
                        <a
                          href={`https://twitter.com/intent/tweet?text=Check%20out%20${encodeURIComponent(tool.name)}%20on%20AI-Hunt&url=${encodeURIComponent(window.location.href)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm sm:text-base text-gray-600 hover:text-green-600 transition-colors"
                        >
                          <Twitter className="w-4 h-4" />
                          <span>Share on Twitter</span>
                        </a>
                        <a
                          href={`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(window.location.href)}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-2 text-sm sm:text-base text-gray-600 hover:text-green-600 transition-colors"
                        >
                          <Linkedin className="w-4 h-4" />
                          <span>Share on LinkedIn</span>
                        </a>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </main>

      {/* Quick Actions */}
      <AnimatePresence>
        {showQuickActions && (
          <motion.div
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 right-6 flex items-center gap-3 z-50"
          >
            <Button
              size="icon"
              variant="outline"
              className="h-12 w-12 rounded-xl bg-white shadow-lg"
              onClick={scrollToTop}
            >
              <ChevronUp className="h-6 w-6" />
            </Button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AIToolDetail; 