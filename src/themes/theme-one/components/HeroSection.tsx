import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Sparkles, ChevronRight, MessageCircle, X, Star } from "lucide-react";
import { SearchDialog } from "./SearchDialog";
import { Tool } from "@/types/tool";
import { motion, AnimatePresence } from "framer-motion";
import { Avatar } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { getToolLogo } from '@/utils/toolHelpers';

// Mock tool data type to match Tool interface
interface MockTool extends Partial<Tool> {
  id: string;
  name: string;
  slug: string;
  logo: string;
  description: string;
  rating: number;
  category: string;
  views: number;
  isTrending: boolean;
  createdAt: string;
}

interface HeroSectionProps {
  searchQuery?: string;
  setSearchQuery?: React.Dispatch<React.SetStateAction<string>>;
  setIsSearchOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  siteDescription?: string;
}

export const HeroSection = ({
  searchQuery: externalSearchQuery,
  setSearchQuery: externalSetSearchQuery,
  setIsSearchOpen: externalSetIsSearchOpen,
  siteDescription
}: HeroSectionProps) => {
  // Use internal state if no external state is provided
  const [internalSearchQuery, setInternalSearchQuery] = useState("");
  const [internalIsSearchOpen, setInternalIsSearchOpen] = useState(false);

  // Use the props if provided, otherwise use internal state
  const searchQuery = externalSearchQuery !== undefined ? externalSearchQuery : internalSearchQuery;
  const setSearchQuery = externalSetSearchQuery || setInternalSearchQuery;
  const setIsSearchOpen = externalSetIsSearchOpen || setInternalIsSearchOpen;

  const [isChatOpen, setIsChatOpen] = useState(false);
  const [chatQuery, setChatQuery] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [recommendations, setRecommendations] = useState<MockTool[]>([]);
  const [toolsCount, setToolsCount] = useState(12114); // Default fallback

  const router = useRouter();

  const API_URL = '';

  // Fetch tools count from API
  useEffect(() => {
    const fetchToolsCount = async () => {
      try {
        const response = await fetch(`${API_URL}/api/tools/stats`);
        if (response.ok) {
          const data = await response.json();
          setToolsCount(data.totalTools || 12114);
        }
      } catch (error) {
        console.log('Using fallback tools count'); // Fallback to default if API fails
      }
    };

    fetchToolsCount();
  }, [API_URL]);

  const handleSearchClick = () => {
    setIsSearchOpen(true);
  };

  const handleSelectTool = (tool: Tool) => {
    router.push(`/ai-tools/${tool.slug}`);
  };

  const handleChatSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatQuery.trim()) return;

    setIsLoading(true);
    setRecommendations([]);

    try {
      const response = await fetch(`${API_URL}/api/tools/ai-search`, {
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
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const formattedTools: MockTool[] = tools.map((tool: any) => ({
        id: tool.id || tool._id,
        _id: tool._id || tool.id,
        name: tool.name,
        slug: tool.slug,
        logo: tool.logo || `https://www.google.com/s2/favicons?domain=${tool.name}&sz=128`,
        description: tool.description,
        rating: tool.rating || 0,
        category: tool.category,
        views: tool.views || 0,
        isTrending: tool.isTrending || false,
        createdAt: tool.createdAt || new Date().toISOString(),
        websiteUrl: tool.websiteUrl || `https://${tool.name.toLowerCase().replace(/\s+/g, '')}.com`,
        tags: tool.tags || [],
        pricing: tool.pricing || { type: 'free' }
      }));

      setRecommendations(formattedTools);
    } catch (error) {
      console.error('Error fetching AI recommendations:', error);
      // Show error message to user
      setRecommendations([]);
    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    setChatQuery("");
    setRecommendations([]);
  };

  // Define platform icons with proper domains for Clearbit
  const platformIcons = [
    { name: 'Google', domain: 'google.com', position: { left: '5%', top: '18%' } },
    { name: 'GitHub', domain: 'github.com', position: { left: '8%', top: '38%' } },
    { name: 'Slack', domain: 'slack.com', position: { right: '12%', top: '20%' } },
    { name: 'Notion', domain: 'notion.so', position: { right: '8%', top: '42%' } },
    { name: 'Figma', domain: 'figma.com', position: { left: '12%', bottom: '22%' } },
    { name: 'OpenAI', domain: 'openai.com', position: { right: '15%', bottom: '28%' } },
    { name: 'Microsoft', domain: 'microsoft.com', position: { left: '18%', top: '25%' } },
    { name: 'Discord', domain: 'discord.com', position: { right: '20%', top: '33%' } },
    { name: 'LinkedIn', domain: 'linkedin.com', position: { left: '15%', bottom: '32%' } },
  ];

  // Function to handle image loading errors
  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>, name: string) => {
    const target = e.target as HTMLImageElement;
    target.onerror = null;
    target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name)}&background=6366f1&color=fff&bold=true&format=svg&size=128`;
  };

  return (
    <div className="relative px-3 sm:px-4 pt-28 pb-16 sm:pb-20 sm:px-6 lg:px-8 lg:pt-40 lg:pb-24 overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 bg-gradient-to-b from-white via-gray-50/50 to-white" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_20%,rgba(56,189,128,0.08),transparent_60%)]" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_70%_60%,rgba(59,130,246,0.08),transparent_60%)]" />

      {/* Platform Icons - Using Clearbit and organized with better spacing */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Desktop icons */}
        {platformIcons.map((icon, index) => (
          <div
            key={icon.domain}
            className="absolute hidden lg:block"
            style={{
              ...icon.position,
              zIndex: 1
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
                className="object-contain p-2"
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

        {/* Mobile icons - only show a few strategic ones */}
        <div className="absolute top-12 right-6 lg:hidden">
          <div className="bg-white/90 shadow-sm backdrop-blur-sm rounded-xl p-2 w-10 h-10 flex items-center justify-center relative">
            <Image
              src={`https://www.google.com/s2/favicons?domain=github.com&sz=128`}
              alt="GitHub"
              fill
              className="object-contain p-1.5"
              unoptimized
            />
          </div>
        </div>
        <div className="absolute bottom-20 left-6 lg:hidden">
          <div className="bg-white/90 shadow-sm backdrop-blur-sm rounded-xl p-2 w-10 h-10 flex items-center justify-center relative">
            <Image
              src={`https://www.google.com/s2/favicons?domain=openai.com&sz=128`}
              alt="OpenAI"
              fill
              className="object-contain p-1.5"
              unoptimized
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="relative max-w-5xl mx-auto text-center">
        {/* Decorative element */}
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
          className="inline-flex items-center justify-center p-1.5 rounded-full bg-gradient-to-r from-emerald-500/10 via-blue-500/10 to-orange-500/10 backdrop-blur-sm mb-6"
        >
          <div className="px-4 py-1.5 rounded-full bg-white border border-gray-100 shadow-sm">
            <div className="flex items-center space-x-2">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <span className="text-sm font-medium text-gray-800">{toolsCount.toLocaleString()} AI Tools Available</span>
            </div>
          </div>
        </motion.div>

        {/* Hero headline */}
        <motion.h1
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.1 }}
          className="text-4xl sm:text-5xl md:text-7xl font-bold tracking-tight text-gray-900 mb-4 sm:mb-6 leading-tight"
        >
          <span className="inline-block">Every piece of AI</span><br />
          <span className="inline-block bg-gradient-to-r from-emerald-600 to-emerald-500 bg-clip-text text-transparent">worth knowing</span>
          <span className="inline-block">—one click away</span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mx-auto mt-6 sm:mt-8 max-w-2xl text-lg sm:text-xl text-gray-600 leading-relaxed px-2 sm:px-0"
        >
          {siteDescription || "Discover and compare the best AI tools for your needs. From productivity apps to development tools, we've got you covered."}
        </motion.p>

        {/* Search and Chat Options */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="mt-8 sm:mt-12 max-w-xl sm:max-w-2xl mx-auto grid grid-cols-1 gap-3 sm:gap-4 px-1 sm:px-0"
        >
          {/* Search Bar */}
          <div className="relative group" onClick={handleSearchClick}>
            <div className="absolute -inset-1 bg-gradient-to-r from-emerald-500 via-blue-500 to-orange-500 rounded-full blur opacity-10 group-hover:opacity-25 transition duration-1000 group-hover:duration-200"></div>
            <div className="relative flex items-center cursor-pointer">
              <div className="relative w-full">
                <div className="absolute inset-y-0 left-0 flex items-center pl-3 sm:pl-4 pointer-events-none">
                  <Search className="h-4 w-4 sm:h-5 sm:w-5 text-gray-500" />
                </div>
                <Input
                  type="text"
                  readOnly
                  placeholder="Search for any tool..."
                  className="pl-10 sm:pl-12 pr-3 sm:pr-4 py-3 sm:py-4 h-12 sm:h-14 w-full border-gray-200 rounded-full bg-white shadow-sm hover:shadow-md transition-shadow duration-200 focus:border-emerald-500 focus:ring-0 cursor-pointer text-sm sm:text-base"
                  onClick={handleSearchClick}
                />
                <div className="absolute right-4 top-1/2 -translate-y-1/2 hidden sm:flex items-center gap-1 px-2 py-1 rounded-lg bg-gray-100/80 border border-gray-200/60">
                  <span className="text-xs font-medium text-gray-700">⌘</span>
                  <span className="text-xs font-medium text-gray-700">K</span>
                </div>
              </div>
            </div>
          </div>

          {/* AI Assistant Button and Chat Panel */}
          <div className="relative w-full">
            {!isChatOpen ? (
              <Button
                onClick={() => setIsChatOpen(true)}
                className="w-full h-12 sm:h-14 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white rounded-full shadow-sm flex items-center justify-center gap-2 group px-3 sm:px-4"
              >
                <MessageCircle className="h-4 w-4 sm:h-5 sm:w-5 transition-transform group-hover:scale-110 flex-shrink-0" />
                <span className="font-medium text-sm sm:text-base truncate">Ask AI to recommend tools</span>
              </Button>
            ) : (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                className="bg-white rounded-xl sm:rounded-2xl shadow-lg border border-gray-200 p-3 sm:p-4 w-full"
              >
                <div className="flex justify-between items-center mb-4">
                  <div className="flex items-center gap-2">
                    <Avatar className="h-8 w-8 bg-orange-100 flex items-center justify-center">
                      <MessageCircle className="h-4 w-4 text-[#FF5A1F]" />
                    </Avatar>
                    <h3 className="font-medium text-gray-900">InternetKeeda AI</h3>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 rounded-full"
                    onClick={() => {
                      setIsChatOpen(false);
                      resetChat();
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                {recommendations.length === 0 ? (
                  <form onSubmit={handleChatSubmit} className="mb-2">
                    <div className="relative">
                      <Input
                        value={chatQuery}
                        onChange={(e) => setChatQuery(e.target.value)}
                        placeholder="e.g., I need tools for content writing"
                        className="pr-24 py-2 h-12 border-gray-200 rounded-lg"
                        disabled={isLoading}
                      />
                      <Button
                        type="submit"
                        className="absolute right-1 top-1 h-10 bg-green-500 hover:bg-green-600 text-white rounded-md"
                        disabled={isLoading || !chatQuery.trim()}
                      >
                        {isLoading ? (
                          <div className="flex items-center gap-2">
                            <div className="h-4 w-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            <span>Finding...</span>
                          </div>
                        ) : (
                          <span>Find Tools</span>
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-gray-500 mt-2">
                      Describe your use case or the problem you're trying to solve
                    </p>
                  </form>
                ) : (
                  <div className="mb-4">
                    <div className="bg-green-50 rounded-lg p-3 mb-4">
                      <p className="text-sm text-gray-700">
                        <span className="font-medium">Your query:</span> {chatQuery}
                      </p>
                    </div>
                    <div className="text-sm font-medium text-gray-700 mb-2">Recommended tools for you:</div>
                    <p className="text-xs text-gray-600 mb-3 italic">
                      {recommendations.length > 4
                        ? `Here are the top ${recommendations.length} AI tools that match your needs.`
                        : recommendations.length === 1
                          ? "Here's the best AI tool that matches your query."
                          : `Here are ${recommendations.length} AI tools that best match your requirements.`}
                      {recommendations[0].category && ` These focus on ${recommendations[0].category.toLowerCase()}`}
                      {recommendations.length > 1 && recommendations[1].category && recommendations[1].category !== recommendations[0].category && ` and ${recommendations[1].category.toLowerCase()}`}.
                    </p>
                    <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                      {recommendations.map((tool) => (
                        <div
                          key={tool.id}
                          className="bg-white border border-gray-200 rounded-lg p-3 flex items-start hover:border-green-200 hover:shadow-sm transition-all"
                          onClick={() => router.push(`/ai-tools/${tool.slug}`)}
                        >
                          <div className="w-10 h-10 bg-white rounded-md flex items-center justify-center overflow-hidden mr-3 border border-gray-100 relative">
                            <Image
                              src={getToolLogo(tool as Tool)}
                              alt={`${tool.name} logo`}
                              fill
                              className="object-contain p-1.5"
                              unoptimized
                            />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center justify-between">
                              <h3 className="text-base font-semibold text-gray-900 truncate">{tool.name}</h3>
                              <div className="flex items-center">
                                <Star className="w-3.5 h-3.5 text-yellow-400 fill-yellow-400" />
                                <span className="text-xs text-gray-700 ml-1">{tool.rating}</span>
                              </div>
                            </div>
                            <p className="text-xs text-gray-600 line-clamp-2">
                              {tool.description}
                            </p>
                            <div className="mt-1">
                              <Badge variant="outline" className="text-xs bg-gray-50 text-gray-600 border-gray-100 rounded-full">
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
                      className="w-full mt-3 border-gray-200"
                      onClick={resetChat}
                    >
                      Ask another question
                    </Button>
                  </div>
                )}
              </motion.div>
            )}
          </div>
        </motion.div>

        {/* Feature tags */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.4 }}
          className="flex flex-wrap justify-center gap-2.5 mt-10"
        >
          <div className="inline-flex items-center px-5 py-2 rounded-full text-sm bg-gradient-to-r from-emerald-500/10 to-emerald-500/20 text-emerald-700 font-medium border border-emerald-100 shadow-sm">
            <span>✦ Find the perfect tool for your workflow</span>
          </div>
          <Button
            variant="link"
            className="text-sm text-emerald-600 hover:text-emerald-700 flex items-center font-medium"
            onClick={() => router.push('/categories')}
          >
            Browse categories <ChevronRight className="h-4 w-4 ml-1" />
          </Button>
        </motion.div>
      </div>

      {/* Search Dialog */}
      <SearchDialog
        open={internalIsSearchOpen}
        onOpenChange={setInternalIsSearchOpen}
        onSelectTool={handleSelectTool}
      />
    </div>
  );
}; 