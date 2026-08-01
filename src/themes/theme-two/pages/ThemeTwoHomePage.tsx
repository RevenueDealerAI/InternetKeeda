import React, { useRef } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { useState, useMemo, useEffect, useCallback } from 'react';
import { useTools } from '@/lib/api/tools';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { Star, Heart, TrendingUp, Sparkles, Tag, Zap, Eye, ArrowUp, ChevronDown, Users, MessageSquare, ExternalLink, Search, X } from 'lucide-react';
import { FilterBar } from '../components/FilterBar';
import { ThemeTwoSponsoredListings } from '../components/ThemeTwoSponsoredListings';
import { SearchDialog } from '../components/SearchDialog';
import { useSponsoredListings } from '@/contexts/SponsoredListingsContext';
import { getToolLogo } from '@/utils/toolHelpers';
import { Tool } from '@/types/tool';
import { useCategories } from '@/hooks/useCategories';
import { useSiteConfig } from '@/contexts/SiteConfigContext';
import '../styles/theme-two.css';

interface MockTool {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  rating: number;
  category: string;
  views: number;
  isTrending?: boolean;
  tags: string[];
  pricing: { type: string };
}

const FOMO_ACTIVITIES = [
  { type: 'view' as const, message: 'Someone from New York is viewing' },
  { type: 'upvote' as const, message: 'John D. just upvoted' },
  { type: 'visit' as const, message: 'A developer from India visited' },
  { type: 'share' as const, message: 'People shared' },
  { type: 'comment' as const, message: 'New review added by Sarah' },
];

type FomoActivityType = typeof FOMO_ACTIVITIES[number];

const AnimatedCounter = ({ value, className }: { value: string | number; className?: string }) => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    const numericValue = typeof value === 'string'
      ? parseInt(value.replace(/[^0-9]/g, ''), 10)
      : value;

    const duration = 1000;
    const steps = 20;
    const stepValue = numericValue / steps;
    let current = 0;

    const timer = setInterval(() => {
      current += stepValue;
      if (current >= numericValue) {
        setCount(numericValue);
        clearInterval(timer);
      } else {
        setCount(Math.floor(current));
      }
    }, duration / steps);

    return () => clearInterval(timer);
  }, [value]);

  return (
    <span className={className}>
      {typeof value === 'string' && value.includes('K')
        ? `${(count / 1000).toFixed(1)}K`
        : count}
    </span>
  );
};

export const ThemeTwoHomePage: React.FC = () => {
  const [selectedCategory, setSelectedCategory] = useState('all');

  // Fetch tools from API with category filter when category is selected
  const { data, isLoading: isToolsLoading, error: toolsError } = useTools({
    limit: selectedCategory !== "all" ? 10000 : 1000, // Higher limit when category is selected
    category: selectedCategory !== "all" ? selectedCategory : undefined,
    status: 'published'
  });
  const tools = useMemo(() => data?.data || [], [data?.data]);
  const { data: categoriesData } = useCategories(true);
  const { listings } = useSponsoredListings();
  const router = useRouter();
  const { config } = useSiteConfig();

  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState('trending');
  const [selectedPricing, setSelectedPricing] = useState<'Free' | 'Freemium' | 'Paid' | 'All'>('All');
  const [selectedRating, setSelectedRating] = useState<1 | 2 | 3 | 4 | 5 | null>(null);
  const [selectedSpecialFilter, setSelectedSpecialFilter] = useState<'new' | 'trending' | 'bookmarked' | null>(null);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [visibleTools, setVisibleTools] = useState<Tool[]>([]);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState('');
  const [isChatLoading, setIsChatLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<MockTool[]>([]);
  const [initialLoad, setInitialLoad] = useState(true);
  const initializedRef = useRef(false);
  const [recentSearches, setRecentSearches] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('recentSearches') || '[]');
    } catch {
      return [];
    }
  });
  const [currentFomo, setCurrentFomo] = useState<{ tool: Tool, activity: FomoActivityType } | null>(null);
  const [showFomo, setShowFomo] = useState(false);
  const [mousePosition, setMousePosition] = useState({ x: 50, y: 50 });
  const heroRef = useRef<HTMLElement | null>(null);

  const ITEMS_PER_PAGE = 40;
  const LOAD_DELAY = 200;

  // Track mouse position for hero blur effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (heroRef.current) {
        const rect = heroRef.current.getBoundingClientRect();
        const x = ((e.clientX - rect.left) / rect.width) * 100;
        const y = ((e.clientY - rect.top) / rect.height) * 100;
        setMousePosition({ x, y });
      }
    };

    const heroSection = heroRef.current;
    if (heroSection) {
      heroSection.addEventListener('mousemove', handleMouseMove);
    }

    return () => {
      if (heroSection) {
        heroSection.removeEventListener('mousemove', handleMouseMove);
      }
    };
  }, []);

  // Use categories from API only
  const categories = useMemo(() => {
    const apiCategories = categoriesData?.data || [];

    const categoryList = apiCategories
      .filter(cat => cat.isActive)
      .map(category => ({
        value: category.name,
        label: `${category.name} (${category.toolCount || 0})`
      }))
      .sort((a, b) => {
        const aCount = parseInt(a.label.match(/\((\d+)\)$/)?.[1] || '0');
        const bCount = parseInt(b.label.match(/\((\d+)\)$/)?.[1] || '0');
        return bCount - aCount;
      });

    return [
      { value: "all", label: `All Tools (${tools.length})` },
      ...categoryList
    ];
  }, [tools, categoriesData]);

  // Filter tools
  const filteredTools = useMemo(() => {
    let filtered = [...tools];
    if (selectedCategory !== "all") {
      // Use case-insensitive exact matching (API already filters, this is a safety check)
      const selectedCategoryLower = selectedCategory.toLowerCase().trim();
      filtered = filtered.filter(tool => {
        const toolCategory = (tool.category || '').toLowerCase().trim();
        return toolCategory === selectedCategoryLower;
      });
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(tool =>
        tool.name.toLowerCase().includes(query) ||
        tool.description.toLowerCase().includes(query)
      );
    }
    if (selectedPricing !== "All") {
      filtered = filtered.filter(tool => {
        const toolPricing = tool.pricing?.type?.toLowerCase() || 'free';
        switch (selectedPricing) {
          case "Free": return toolPricing === 'free';
          case "Freemium": return toolPricing === 'freemium';
          case "Paid": return toolPricing === 'paid' || toolPricing === 'premium' || toolPricing === 'enterprise';
          default: return true;
        }
      });
    }
    if (selectedRating) {
      filtered = filtered.filter(tool => tool.rating >= selectedRating);
    }
    if (selectedSpecialFilter === 'new') {
      filtered = filtered.filter(tool => tool.isNew);
    }
    if (selectedSpecialFilter === 'trending') {
      filtered = filtered.filter(tool => tool.isTrending);
    }
    return filtered;
  }, [tools, selectedCategory, searchQuery, selectedPricing, selectedRating, selectedSpecialFilter]);

  // Reset filters
  const resetFilters = () => {
    setSelectedCategory('all');
    setSortBy('trending');
    setSearchQuery('');
    setSelectedPricing('All');
    setSelectedRating(null);
    setSelectedSpecialFilter(null);
  };

  // Chat functionality
  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;

    setIsChatLoading(true);
    setRecommendations([]);

    try {
      const response = await fetch('/api/tools/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ query: chatQuery }),
      });

      if (!response.ok) {
        throw new Error('Failed to get AI recommendations');
      }

      const data = await response.json();
      const tools = data.tools || [];

      // Convert API response to MockTool format
      const formattedTools: MockTool[] = tools.map((tool: any) => ({
        id: tool.id || tool._id,
        name: tool.name,
        slug: tool.slug,
        logo: tool.logo || `https://www.google.com/s2/favicons?domain=${tool.name}&sz=128`,
        description: tool.description,
        rating: tool.rating || 0,
        category: tool.category,
        views: tool.views || 0,
        isTrending: tool.isTrending || false,
        tags: tool.tags || [],
        pricing: tool.pricing || { type: 'free' }
      }));

      setRecommendations(formattedTools);
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      setRecommendations([]);
    } finally {
      setIsChatLoading(false);
    }
  };

  const resetChat = () => {
    setChatQuery('');
    setRecommendations([]);
  };

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, name: string) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&bold=true&format=svg&size=128`;
  };

  const handleSearchClick = () => {
    setIsSearchOpen(true);
  };

  const handleSelectTool = (tool: Tool) => {
    router.push(`/ai-tools/${tool.slug}`);
  };

  const handleSearch = (value: string) => {
    setSearchQuery(value);
  };

  const handleCategoryChange = (value: string) => {
    setSelectedCategory(value);
  };

  // Load more data
  const fetchMoreData = useCallback(() => {
    if (loading) return;

    setLoading(true);
    const nextPage = page + 1;

    requestAnimationFrame(() => {
      setTimeout(() => {
        const newTools = filteredTools.slice(0, nextPage * ITEMS_PER_PAGE);
        setVisibleTools(newTools);
        setPage(nextPage);
        setHasMore(filteredTools.length > nextPage * ITEMS_PER_PAGE);
        setLoading(false);
      }, LOAD_DELAY);
    });
  }, [page, loading, filteredTools]);

  useEffect(() => {
    if (!isToolsLoading && tools.length > 0) {
      const initialTools = filteredTools.slice(0, ITEMS_PER_PAGE);
      setVisibleTools(initialTools);
      setHasMore(initialTools.length < filteredTools.length);
      setPage(1);

      if (!initializedRef.current) {
        initializedRef.current = true;
        setTimeout(() => setInitialLoad(false), 500);
      }
    } else if (!isToolsLoading && tools.length === 0) {
      setInitialLoad(false);
    }
  }, [filteredTools, isToolsLoading, tools.length]);

  // FOMO notifications
  useEffect(() => {
    const interval = setInterval(() => {
      if (tools.length > 0) {
        const randomTool = tools[Math.floor(Math.random() * tools.length)];
        const randomActivity = FOMO_ACTIVITIES[Math.floor(Math.random() * FOMO_ACTIVITIES.length)];

        setCurrentFomo({ tool: randomTool, activity: randomActivity });
        setShowFomo(true);

        setTimeout(() => setShowFomo(false), 5000);
      }
    }, 8000);

    return () => clearInterval(interval);
  }, [tools]);

  // Keyboard shortcut for search (⌘K or Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isToolsLoading) {
    return (
      <div className="theme-two flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading AI tools...</p>
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
      {/* Custom Hero Section based on Figma - Background starts from top of page */}
      <section
        ref={heroRef}
        className="hero-section relative min-h-screen flex items-center justify-center overflow-hidden"
        style={{
          position: 'relative',
          top: 0,
          paddingTop: '80px',
          paddingBottom: '60px',
          backgroundImage: "url('/theme-two/images/hero_bg.jpg')",
          backgroundSize: "cover",
          backgroundPosition: "top center",
          backgroundRepeat: "no-repeat",
          backgroundAttachment: "fixed",
          border: 'none',
          borderTop: 'none',
          borderBottom: 'none',
          boxShadow: 'none'
        }}
        onMouseMove={(e) => {
          if (heroRef.current) {
            const rect = heroRef.current.getBoundingClientRect();
            const x = ((e.clientX - rect.left) / rect.width) * 100;
            const y = ((e.clientY - rect.top) / rect.height) * 100;
            setMousePosition({ x, y });
          }
        }}
      >
        {/* Overlay for better text readability */}
        <div className="absolute inset-0 bg-white/10"></div>

        {/* Grid Pattern Background */}
        <div className="absolute inset-0" style={{ border: 'none', borderTop: 'none', borderBottom: 'none' }}>
          <div className="grid grid-cols-20 h-full w-full gap-1">
            {Array.from({ length: 400 }).map((_, i) => {
              const row = Math.floor(i / 20);
              const col = i % 20;
              const cellX = (col + 0.5) * (100 / 20);
              const cellY = (row + 0.5) * (100 / 20);

              const distance = Math.sqrt(
                Math.pow(mousePosition.x - cellX, 2) +
                Math.pow(mousePosition.y - cellY, 2)
              );

              const isNear = distance < 12;
              const isVeryNear = distance < 5;

              return (
                <div
                  key={i}
                  className={`aspect-square transition-all duration-300 ${isVeryNear
                    ? 'border-[2px] border-white'
                    : isNear
                      ? 'border border-white/80'
                      : 'border border-gray-400/40'
                    }`}
                />
              );
            })}
          </div>
        </div>

        {/* Mouse Follow Blur Effect */}
        <div
          className="pointer-events-none absolute rounded-full opacity-30 blur-[80px] transition-all duration-100"
          style={{
            width: '30%',
            height: '40%',
            background: 'radial-gradient(circle, #8039fd 0%, transparent 70%)',
            left: `${mousePosition.x}%`,
            top: `${mousePosition.y}%`,
            transform: 'translate(-50%, -50%)',
            willChange: 'transform'
          }}
        />

        {/* Platform Icons */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none z-20">
          {[
            { name: 'Google', domain: 'google.com', position: { left: '5%', top: '18%' } },
            { name: 'GitHub', domain: 'github.com', position: { left: '8%', top: '38%' } },
            { name: 'Slack', domain: 'slack.com', position: { right: '12%', top: '20%' } },
            { name: 'Notion', domain: 'notion.so', position: { right: '8%', top: '42%' } },
            { name: 'Figma', domain: 'figma.com', position: { left: '12%', bottom: '22%' } },
            { name: 'OpenAI', domain: 'openai.com', position: { right: '15%', bottom: '28%' } },
            { name: 'Microsoft', domain: 'microsoft.com', position: { left: '18%', top: '25%' } },
            { name: 'Discord', domain: 'discord.com', position: { right: '20%', top: '33%' } },
            { name: 'LinkedIn', domain: 'linkedin.com', position: { left: '15%', bottom: '32%' } },
          ].map((icon, index) => (
            <div
              key={icon.domain}
              className="absolute hidden lg:block"
              style={{
                ...icon.position,
                zIndex: 20
              }}
            >
              <motion.div
                initial={{ opacity: 0, y: index % 2 === 0 ? -10 : 10 }}
                animate={{ opacity: 0.9, y: 0 }}
                transition={{
                  duration: 0.6,
                  delay: 0.15 * index,
                  ease: "easeOut"
                }}
                className="bg-white/90 shadow-md backdrop-blur-sm rounded-xl p-2.5 w-14 h-14 flex items-center justify-center border border-gray-100 relative"
                style={{ minHeight: '56px', minWidth: '56px' }}
              >
                <Image
                  src={`https://www.google.com/s2/favicons?domain=${icon.domain}&sz=128`}
                  alt={icon.name}
                  fill
                  className="object-contain"
                  unoptimized
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.onerror = null;
                    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(icon.name)}&background=6366f1&color=fff&bold=true&format=svg`;
                  }}
                />
              </motion.div>
            </div>
          ))}
        </div>

        {/* Floating Icons - Left Side */}
        <div className="hidden xl:block absolute top-20 left-28 w-20 h-20 animate-float-slow z-10 pointer-events-none">
          <Image src="/theme-two/icons/floating_icons_hero/1.png" alt="" fill className="object-contain drop-shadow-lg" unoptimized />
        </div>

        <div className="hidden xl:block absolute bottom-80 left-48 w-24 h-24 animate-float-slow-delay z-10 pointer-events-none">
          <Image src="/theme-two/icons/floating_icons_hero/2.png" alt="" fill className="object-contain drop-shadow-lg" unoptimized />
        </div>

        {/* Floating Icons - Right Side */}
        <div className="hidden xl:block absolute top-24 right-28 w-20 h-20 animate-float-slow z-10 pointer-events-none">
          <Image src="/theme-two/icons/floating_icons_hero/3.png" alt="" fill className="object-contain drop-shadow-lg" unoptimized />
        </div>

        <div className="hidden xl:block absolute bottom-80 right-48 w-24 h-24 animate-float-slow-delay z-10 pointer-events-none">
          <Image src="/theme-two/icons/floating_icons_hero/4.png" alt="" fill className="object-contain drop-shadow-lg" unoptimized />
        </div>

        {/* Decorative Elements - Bottom Left (Listing Badge) */}
        <div className="hidden xl:block absolute bottom-16 left-32 z-10 animate-float-left-right w-32 h-auto pointer-events-none">
          <Image
            src="/theme-two/images/left_listing.png"
            alt="Listing"
            width={128}
            height={128}
            className="w-32 h-auto object-contain drop-shadow-lg"
            unoptimized
          />
        </div>

        {/* Decorative Elements - Bottom Right (Tools Badge) */}
        <div className="hidden xl:block absolute bottom-24 right-24 z-10 animate-float-right-left w-32 h-auto pointer-events-none">
          <Image
            src="/theme-two/images/right_tools.png"
            alt="Tools"
            width={128}
            height={128}
            className="w-48 h-auto object-contain drop-shadow-lg"
            unoptimized
          />
        </div>

        {/* Main Content - centered */}
        <div className="relative z-40 w-full max-w-4xl mx-auto px-4 pb-40 text-center" style={{ position: 'relative', zIndex: 40, marginTop: '-60px' }}>
          {/* Stats Badge */}
          <div className="relative inline-flex items-center gap-3 px-6 py-3 rounded-full mb-4">
            <span className="text-purple-600 font-bold text-xl">
              {tools.length > 0 ? `${tools.length.toLocaleString()}+` : '12,000+'}
            </span>
            <span className="text-black font-semibold uppercase text-sm tracking-wide">AI TOOLS AVAILABLE</span>
            <div className="hidden sm:block absolute bottom-0 left-1/2 -translate-x-1/2 w-64 h-[2px] bg-gradient-to-r from-transparent via-purple-500 to-transparent opacity-50"></div>
          </div>

          {/* Main Heading */}
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold mb-4 leading-tight">
            <span className="block text-gray-900">Everything Your Business Needs to</span>
            <span className="block">
              <span className="text-gray-900">Master AI, </span>
              <span className="bg-gradient-to-r from-[#8039fd] via-[#a855f7] to-[#f5a5ad] bg-clip-text text-transparent">All in One Place.</span>
            </span>
          </h1>

          {/* Subheading */}
          <p className="text-xl sm:text-2xl text-gray-600 mb-12 max-w-3xl mx-auto">
            {config?.siteDescription || "Explore top AI tools and learn how to use them effectively."}
          </p>

          {/* Search Bar */}
          <div className="relative max-w-3xl mx-auto">
            <div
              onClick={handleSearchClick}
              className="bg-white rounded-full shadow-2xl flex items-center gap-4 px-6 border border-gray-200 h-[60px] cursor-pointer hover:shadow-3xl transition-all"
            >
              <Search className="w-6 h-6 text-gray-400 flex-shrink-0" />
              <input
                type="text"
                placeholder="Search for any tool..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                onClick={handleSearchClick}
                className="flex-1 text-lg border-none outline-none bg-transparent placeholder-gray-400 h-full cursor-pointer"
              />
              <div className="flex items-center gap-1.5 bg-gray-100 px-3 py-1.5 rounded-lg border border-gray-200 flex-shrink-0">
                <kbd className="text-xs font-semibold text-gray-600">⌘</kbd>
                <kbd className="text-xs font-semibold text-gray-600">K</kbd>
              </div>
            </div>

            {/* AI Assistant Panel */}
            <AnimatePresence>
              {!isChatOpen && !recommendations.length ? (
                <Button
                  onClick={() => setIsChatOpen(true)}
                  className="w-full h-12 sm:h-14 text-white rounded-full shadow-sm flex items-center justify-center gap-2 group mt-4 transition-all duration-300 hover:shadow-lg hover:scale-[1.02]"
                  style={{
                    background: 'linear-gradient(90deg, #8039fd 0%, #f5a5ad 100%)'
                  }}
                >
                  <MessageSquare className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:scale-110 flex-shrink-0" />
                  <span className="font-medium text-sm sm:text-base">Ask AI to recommend tools</span>
                </Button>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="bg-white rounded-2xl shadow-xl border border-gray-100 p-6 w-full mt-4"
                >
                  <div className="flex justify-between items-center mb-6">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-10 w-10 bg-gradient-to-br from-purple-100 to-pink-100 flex items-center justify-center border border-purple-200">
                        <MessageSquare className="h-5 w-5 text-purple-600" />
                      </Avatar>
                      <h3 className="font-semibold text-gray-900 text-lg">AI Tool Finder</h3>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 rounded-full hover:bg-gray-100"
                      onClick={() => {
                        setIsChatOpen(false);
                        resetChat();
                      }}
                    >
                      <X className="h-4 w-4 text-gray-500" />
                    </Button>
                  </div>

                  {recommendations.length === 0 ? (
                    <form onSubmit={handleChatSubmit}>
                      <div className="relative">
                        <Input
                          value={chatQuery}
                          onChange={(e) => setChatQuery(e.target.value)}
                          placeholder="e.g., I need tools for content writing"
                          className="w-full py-3 h-14 border-purple-200 rounded-full focus-visible:ring-purple-500 focus-visible:ring-2 focus-visible:border-purple-500 text-base"
                          disabled={isChatLoading}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !isChatLoading && chatQuery.trim()) {
                              handleChatSubmit(e);
                            }
                          }}
                        />
                      </div>
                      <p className="text-xs text-gray-500 mt-3 px-1">
                        Describe your use case or the problem you're trying to solve
                      </p>
                    </form>
                  ) : (
                    <div className="mb-4">
                      <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-xl p-4 mb-4 border border-purple-100">
                        <p className="text-sm text-gray-700">
                          <span className="font-semibold text-purple-700">Your query:</span> <span className="text-gray-800">{chatQuery}</span>
                        </p>
                      </div>
                      <div className="text-sm font-semibold text-gray-900 mb-3">Recommended tools for you:</div>
                      <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                        {recommendations.map((tool) => (
                          <div
                            key={tool.id}
                            className="bg-white border border-gray-200 rounded-xl p-4 flex items-start hover:border-purple-300 hover:shadow-md transition-all cursor-pointer group"
                            onClick={() => router.push(`/ai-tools/${tool.slug}`)}
                          >
                            <div className="w-12 h-12 bg-white rounded-lg flex items-center justify-center overflow-hidden mr-4 border border-gray-100 group-hover:border-purple-200 transition-colors relative">
                              <Image
                                src={getToolLogo(tool as Tool)}
                                alt={`${tool.name} logo`}
                                fill
                                className="object-contain p-2"
                                unoptimized
                              />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center justify-between mb-1">
                                <h3 className="text-base font-semibold text-gray-900 truncate group-hover:text-purple-600 transition-colors">{tool.name}</h3>
                                <div className="flex items-center">
                                  <Star className="w-4 h-4 text-yellow-400 fill-yellow-400" />
                                  <span className="text-xs text-gray-700 ml-1 font-medium">{tool.rating}</span>
                                </div>
                              </div>
                              <p className="text-xs text-gray-600 line-clamp-2 mb-2">
                                {tool.description}
                              </p>
                              <div className="mt-1">
                                <Badge variant="outline" className="text-xs bg-purple-50 text-purple-700 border-purple-200 rounded-full">
                                  {tool.category}
                                </Badge>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full mt-4 border-purple-200 text-purple-700 hover:bg-purple-50 hover:border-purple-300 rounded-full font-medium"
                        onClick={resetChat}
                      >
                        Ask another question
                      </Button>
                    </div>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </section>

      {/* Rounded White Shape Behind Sponsored Listings */}
      <div
        className="absolute w-full bg-white"
        style={{
          borderRadius: '3.75rem 3.75rem 0 0',
          marginTop: '-60px',
          height: '350px',
          zIndex: 40,
        }}
      />

      {/* Use Theme Two SponsoredListings component */}
      {listings.length > 0 && (
        <div style={{ position: 'relative', zIndex: 50 }}>
          <ThemeTwoSponsoredListings listings={listings} />
        </div>
      )}

      {/* Section Title and Filter Bar */}
      <div className="container mx-auto px-4 py-12 relative z-50">
        {/* Title and Subtitle */}
        <div className="mb-8">
          <h2 className="text-5xl text-gray-900 mb-3" style={{ fontWeight: '700' }}>
            AI Tools <span className="bg-gradient-to-r from-[#8039fd] via-[#a855f7] to-[#f5a5ad] bg-clip-text text-transparent">Directory</span>
          </h2>
          <p className="text-lg text-gray-600">
            Discover and explore <span className="text-[#8039fd] font-semibold">{filteredTools.length}+ AI tools</span>
          </p>
        </div>

        {/* Filter Bar */}
        <div className="mb-8 theme-two">
          <FilterBar
            categories={categories}
            selectedCategory={selectedCategory}
            onCategoryChange={handleCategoryChange}
            sortBy={sortBy}
            onSortChange={setSortBy}
            searchQuery={searchQuery}
            onSearch={handleSearch}
            resetFilters={resetFilters}
            totalResults={filteredTools.length}
            onSearchOpen={() => setIsSearchOpen(true)}
            selectedPricing={selectedPricing}
            onPricingChange={setSelectedPricing}
            selectedRating={selectedRating}
            onRatingChange={setSelectedRating}
            selectedSpecialFilter={selectedSpecialFilter}
            onSpecialFilterChange={setSelectedSpecialFilter}
            viewMode={viewMode}
            onViewModeChange={setViewMode}
          />
        </div>

        {/* Tools Grid/List */}
        <AnimatePresence mode="popLayout">
          {(initialLoad || isToolsLoading) ? (
            // Loading skeletons
            <div className={viewMode === 'grid'
              ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8"
              : "flex flex-col gap-4"
            }>
              {[...Array(8)].map((_, i) => (
                <div key={i} className="bg-white rounded-2xl p-6">
                  <div className="flex gap-4 mb-4">
                    <Skeleton className="w-16 h-16 rounded-xl" />
                    <div className="flex-1">
                      <Skeleton className="h-6 w-3/4 mb-2" />
                      <Skeleton className="h-4 w-1/2" />
                    </div>
                  </div>
                  <Skeleton className="h-4 w-full mb-2" />
                  <Skeleton className="h-4 w-2/3" />
                </div>
              ))}
            </div>
          ) : visibleTools.length === 0 && filteredTools.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="w-16 h-16 bg-purple-100 rounded-full flex items-center justify-center mb-4">
                <Zap className="w-8 h-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No tools found</h3>
              <p className="text-gray-600 max-w-md mb-6">
                {toolsError ? 'Error loading tools. Please try again later.' : 'No tools match your current filters. Try adjusting your search or filters.'}
              </p>
              <Button
                variant="outline"
                className="rounded-xl hover:bg-purple-50"
                onClick={resetFilters}
              >
                Reset Filters
              </Button>
            </div>
          ) : (
            <motion.div
              layout
              className={viewMode === 'grid'
                ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 2xl:grid-cols-4 gap-8"
                : "flex flex-col gap-4"
              }
            >
              <AnimatePresence mode="popLayout">
                {visibleTools.map((tool, index) => (
                  <motion.div
                    key={tool.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 20 }}
                    transition={{ duration: 0.2, delay: index * 0.05 }}
                    className={viewMode === 'grid'
                      ? "h-[280px] lg:h-[280px] xl:h-[280px]"
                      : "min-h-[120px]"
                    }
                  >
                    <Link href={`/ai-tools/${tool.slug}`} className="group block h-full">
                      <article className="relative h-full p-[1px] rounded-[1.25rem] overflow-hidden transition-all duration-300 group hover:scale-[1.02] hover:shadow-xl" style={{
                        background: index % 2 === 0
                          ? 'linear-gradient(to bottom, #7D37FF 0%, rgba(255, 255, 255, 0) 100%)'
                          : 'linear-gradient(to bottom, rgba(255, 255, 255, 0) 0%, #7D37FF 100%)'
                      }}>
                        {/* Content container */}
                        <div className={`relative h-full bg-[#F5F5F5] rounded-[1.25rem] p-6 group-hover:bg-white transition-colors duration-300 ${viewMode === 'grid' ? 'flex flex-col' : 'flex flex-row items-center gap-6'
                          }`}>
                          {/* Header with Image and Title */}
                          {viewMode === 'grid' ? (
                            <>
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex items-center gap-3">
                                  <div className="relative shrink-0">
                                    <div className="w-16 h-16 rounded-full overflow-hidden bg-white shadow-md ring-2 ring-gray-100 relative">
                                      <Image
                                        src={getToolLogo(tool)}
                                        alt={tool.name}
                                        fill
                                        className="object-cover"
                                        unoptimized
                                        onError={(e) => {
                                          const target = e.target as HTMLImageElement;
                                          target.onerror = null;
                                          target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(tool.name)}&background=6366f1&color=fff&bold=true&format=svg`;
                                        }}
                                      />
                                    </div>
                                    {(tool.isTrending || tool.isNew) && (
                                      <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
                                        {tool.isTrending ? (
                                          <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-full p-1">
                                            <TrendingUp className="w-3 h-3 text-white" />
                                          </div>
                                        ) : (
                                          <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full p-1">
                                            <Sparkles className="w-3 h-3 text-white" />
                                          </div>
                                        )}
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
                            </>
                          ) : (
                            <>
                              <div className="flex items-center gap-3 flex-shrink-0">
                                <div className="relative shrink-0">
                                  <div className="w-16 h-16 rounded-full overflow-hidden bg-white shadow-md ring-2 ring-gray-100 relative">
                                    <Image
                                      src={getToolLogo(tool)}
                                      alt={tool.name}
                                      fill
                                      className="object-cover"
                                      unoptimized
                                      onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.onerror = null;
                                        target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(tool.name)}&background=6366f1&color=fff&bold=true&format=svg`;
                                      }}
                                    />
                                  </div>
                                  {(tool.isTrending || tool.isNew) && (
                                    <div className="absolute -bottom-1 -right-1 bg-white rounded-full p-1 shadow-md">
                                      {tool.isTrending ? (
                                        <div className="bg-gradient-to-r from-orange-500 to-pink-500 rounded-full p-1">
                                          <TrendingUp className="w-3 h-3 text-white" />
                                        </div>
                                      ) : (
                                        <div className="bg-gradient-to-r from-green-500 to-emerald-500 rounded-full p-1">
                                          <Sparkles className="w-3 h-3 text-white" />
                                        </div>
                                      )}
                                    </div>
                                  )}
                                </div>

                                <div>
                                  <h3 className="text-[18px] font-semibold text-gray-900">
                                    {tool.name}
                                  </h3>
                                  <div className="flex items-center gap-1 mt-1">
                                    <Star className="w-4 h-4 text-yellow-500 fill-current" />
                                    <span className="text-sm font-medium text-gray-700">{tool.rating}</span>
                                  </div>
                                </div>
                              </div>
                            </>
                          )}

                          {/* Description */}
                          {viewMode === 'grid' && (
                            <>
                              <p className="text-base text-gray-600 mb-3 line-clamp-2">
                                {tool.description}
                              </p>

                              {/* Tags Row */}
                              <div className="flex flex-wrap gap-2 mb-4">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-600 border border-gray-200">
                                  {tool.category}
                                </span>
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                                  <Zap className="w-3 h-3 text-purple-600" />
                                  {tool.pricing.type}
                                </span>
                              </div>
                            </>
                          )}

                          {/* Description for List View */}
                          {viewMode === 'list' && (
                            <div className="flex-1 flex flex-col gap-3">
                              <p className="text-base text-gray-600 line-clamp-1">
                                {tool.description}
                              </p>
                              <div className="flex flex-wrap gap-2">
                                <span className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-white text-gray-600 border border-gray-200">
                                  {tool.category}
                                </span>
                                <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium bg-purple-50 text-purple-700 border border-purple-200">
                                  <Zap className="w-3 h-3 text-purple-600" />
                                  {tool.pricing.type}
                                </span>
                              </div>
                            </div>
                          )}

                          {/* Bottom Stats */}
                          <div className={`flex items-center justify-between ${viewMode === 'grid'
                            ? 'pt-4 border-t border-gray-200 mt-auto'
                            : 'gap-4'
                            }`}>
                            <div className="flex items-center gap-4 text-sm text-gray-500">
                              <div className="flex items-center gap-1">
                                <Eye className="w-4 h-4" />
                                <AnimatedCounter value={tool.views} className="text-sm" />
                              </div>
                              <div className="flex items-center gap-1">
                                <ArrowUp className="w-4 h-4" />
                                <AnimatedCounter value={tool.votes} className="text-sm" />
                              </div>
                            </div>
                            <button
                              onClick={(e) => {
                                e.preventDefault();
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
          )}
        </AnimatePresence>

        {/* Load More Button */}
        {(hasMore || loading) && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="py-12 text-center relative z-10"
          >
            <Button
              onClick={fetchMoreData}
              variant="ghost"
              className="w-full bg-purple-50 hover:bg-purple-100 text-purple-500 hover:text-purple-600 flex items-center justify-center gap-2 py-6 rounded-xl"
            >
              Load More Tools <ChevronDown className="h-5 w-5" />
            </Button>
          </motion.div>
        )}
      </div>

      {/* FOMO Notification */}
      <AnimatePresence>
        {showFomo && currentFomo && (
          <motion.div
            initial={{ opacity: 0, x: -100 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -100 }}
            className="fixed bottom-6 left-6 z-50"
          >
            <Link href={`/ai-tools/${currentFomo.tool.slug}`}
              className="flex items-center gap-3 bg-white/90 backdrop-blur-sm p-4 rounded-xl shadow-lg border border-purple-100 hover:shadow-purple-100/50 transition-all duration-300 group hover:translate-x-1"
            >
              <div className="relative">
                <div className="w-12 h-12 rounded-lg overflow-hidden bg-gradient-to-br from-purple-100 to-blue-50 relative">
                  <Image
                    src={getToolLogo(currentFomo.tool)}
                    alt={currentFomo.tool.name}
                    fill
                    className="object-cover"
                    unoptimized
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(currentFomo.tool.name)}&background=6366f1&color=fff&bold=true&format=svg`;
                    }}
                  />
                </div>
                <div className="absolute -bottom-2 -right-2 bg-white rounded-full p-1 shadow-md">
                  {currentFomo.activity.type === 'view' && (
                    <div className="bg-blue-500 rounded-full p-1">
                      <Users className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {currentFomo.activity.type === 'upvote' && (
                    <div className="bg-red-500 rounded-full p-1">
                      <Heart className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {currentFomo.activity.type === 'visit' && (
                    <div className="bg-green-500 rounded-full p-1">
                      <ExternalLink className="w-3 h-3 text-white" />
                    </div>
                  )}
                  {currentFomo.activity.type === 'comment' && (
                    <div className="bg-yellow-500 rounded-full p-1">
                      <MessageSquare className="w-3 h-3 text-white" />
                    </div>
                  )}
                </div>
              </div>
              <div className="pr-4">
                <p className="text-sm text-gray-600">{currentFomo.activity.message}</p>
                <p className="text-sm font-medium text-gray-900">{currentFomo.tool.name}</p>
              </div>
              <div className="flex items-center self-stretch pl-4 border-l border-gray-100">
                <div className="text-xs font-medium text-purple-600 opacity-0 group-hover:opacity-100 transition-opacity">
                  View →
                </div>
              </div>
            </Link>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Search Dialog */}
      <SearchDialog
        open={isSearchOpen}
        onOpenChange={setIsSearchOpen}
        onSelectTool={handleSelectTool}
      />
    </motion.div>
  );
};