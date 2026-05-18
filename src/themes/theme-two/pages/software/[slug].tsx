import React, { useState, useEffect, useContext } from 'react';
import { useParams as useNextParams } from 'next/navigation';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ParamsContext } from '@/lib/react-router-compat';
import { useTools } from '@/lib/api/tools';
import { useToolActions } from '@/hooks/useToolActions';
import { useSoftwarePages, SoftwarePage } from '@/contexts/SoftwarePagesContext';
import { ProductCard } from '../../components/ProductCard';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  ArrowLeft, 
  Filter, 
  Zap, 
  Check, 
  ArrowUpCircle, 
  Star,
  CalendarClock,
  PenTool, 
  Users, 
  Mail,
  Briefcase,
  Target,
  Brain,
  MessageSquare,
  BarChart3,
  FileText,
  Folder,
  Github,
  Headphones,
  Image,
  LucideIcon
} from 'lucide-react';
import { toast } from 'sonner';
import { Tool } from '@/types/tool';
import { SoftwareSidebar } from "../../components/SoftwareSidebar";

// Types for filtering and sorting options
type SortOption = 'popular' | 'newest' | 'rating';
type PricingFilter = 'all' | 'free' | 'paid';

// Component props
interface SoftwarePageDetailProps {
  staticSlug?: string; // Optional prop to override the URL parameter
}

// Icon mapping for dynamic rendering
const iconComponents: Record<string, LucideIcon> = {
  Zap,
  PenTool,
  Users,
  Mail, 
  CalendarClock,
  Briefcase,
  Target,
  Brain,
  MessageSquare,
  BarChart3,
  FileText,
  Folder,
  Github,
  Headphones,
  Image,
  ArrowUpCircle,
  Check,
  Star
};

// Helper function to get icon component
const getIconComponent = (iconName: string | undefined): LucideIcon => {
  if (!iconName) return Zap;
  
  // Try to find the icon in our map
  const IconComponent = iconComponents[iconName];
  
  // If not found, return Zap as fallback
  return IconComponent || Zap;
};

// Helper function to convert pricing type
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

export default function SoftwarePageDetail({ staticSlug }: SoftwarePageDetailProps) {
  const contextParams = useContext(ParamsContext);
  const nextParams = useNextParams();
  const params = { ...contextParams, ...nextParams } as { slug?: string };
  const urlSlug = params?.slug;
  const router = useRouter();
  const { pages } = useSoftwarePages();
  const { data, isLoading: toolsLoading } = useTools({ limit: 1000 });
  const allTools = data?.data || [];
  const { toggleUpvote, isUpvoted, toggleSave, isSaved } = useToolActions();
  
  // Use static slug if provided, otherwise use URL parameter
  const slug = staticSlug || urlSlug;
  
  // State for the current software page
  const [softwarePage, setSoftwarePage] = useState<SoftwarePage | null>(null);
  
  // Filter and sort states
  const [sortOption, setSortOption] = useState<SortOption>('popular');
  const [pricingFilter, setPricingFilter] = useState<PricingFilter>('all');
  const [showFilters, setShowFilters] = useState(false);
  
  // Find the software page by slug
  useEffect(() => {
    if (!slug || !pages.length) return;
    
    const page = pages.find(p => p.slug === slug);
    if (page) {
      setSoftwarePage(page);
      // Set page title
      document.title = `${page.title} - AI Hunt`;
    } else {
      console.warn(`Software page with slug "${slug}" not found`);
      // Only navigate away if we're on a dynamic route (not a staticSlug)
      if (!staticSlug) {
        toast.error("Software page not found");
        router.push('/');
      }
    }
  }, [slug, pages, router, staticSlug]);
  
  // Filter tools relevant to this software page based on category and tags
  const getRelevantTools = () => {
    if (!softwarePage || !allTools.length) return [];
    
    // Extract keywords from the title and description
    const titleWords = softwarePage.title.toLowerCase().split(/\s+/);
    const descWords = softwarePage.description.toLowerCase().split(/\s+/);
    const keywords = [...new Set([...titleWords, ...descWords])].filter(
      word => word.length > 3 && !['and', 'the', 'for', 'with', 'your'].includes(word)
    );
    
    // Find tools that match the keywords in their name, description, category, or tags
    const relevantTools = allTools.filter(tool => {
      // Skip non-published tools
      if (tool.status !== 'published') return false;
      
      // Check pricing filter
      if (pricingFilter !== 'all') {
        const isPaid = tool.pricing.type.toLowerCase() === 'paid' || 
                      tool.pricing.type.toLowerCase() === 'enterprise';
        if (pricingFilter === 'free' && isPaid) return false;
        if (pricingFilter === 'paid' && !isPaid) return false;
      }
      
      // Check if any of the keywords match
      const toolName = tool.name.toLowerCase();
      const toolDesc = tool.description.toLowerCase();
      const toolCategory = tool.category.toLowerCase();
      const toolTags = tool.tags.map(tag => tag.toLowerCase());
      
      return keywords.some(keyword => 
        toolName.includes(keyword) || 
        toolDesc.includes(keyword) || 
        toolCategory.includes(keyword) || 
        toolTags.some(tag => tag.includes(keyword))
      );
    });
    
    // Sort the tools
    return sortTools(relevantTools);
  };
  
  // Sort tools based on sortOption
  const sortTools = (tools: Tool[]) => {
    switch (sortOption) {
      case 'popular':
        return [...tools].sort((a, b) => b.votes - a.votes);
      case 'newest':
        return [...tools].sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
      case 'rating':
        return [...tools].sort((a, b) => b.rating - a.rating);
      default:
        return tools;
    }
  };
  
  const relevantTools = getRelevantTools();
  
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
  
  if (!softwarePage) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
      </div>
    );
  }
  
  const formattedDate = softwarePage.content?.lastUpdated || 
    new Date(softwarePage.updatedAt).toLocaleDateString('en-US', { 
      year: 'numeric', month: 'long' 
    });
  
  return (
    <div className="min-h-screen bg-white pb-16">
      {/* Hero Section */}
      <div className={`pt-32 pb-16 px-4 ${softwarePage.bgColor || 'bg-purple-50'}`}>
        <div className="container mx-auto max-w-5xl">
          <Link href="/" className="inline-flex items-center text-gray-600 hover:text-gray-900 mb-8">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to home
          </Link>
          
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            <div className={`w-16 h-16 rounded-2xl ${softwarePage.bgColor || 'bg-purple-100'} flex items-center justify-center flex-shrink-0`}>
              {softwarePage.icon ? (
                <span className={`${softwarePage.iconColor || 'text-purple-600'}`}>
                  {/* Render icon component dynamically using our helper function */}
                  {React.createElement(getIconComponent(softwarePage.icon), { className: "w-8 h-8" })}
                </span>
              ) : (
                <Zap className={`w-8 h-8 ${softwarePage.iconColor || 'text-purple-600'}`} />
              )}
            </div>
            
            <div>
              <h1 className="text-3xl md:text-4xl font-bold text-gray-900 mb-3">
                {softwarePage.title}
              </h1>
              <p className="text-lg text-gray-600 max-w-3xl">
                {softwarePage.description}
              </p>
              
              {softwarePage.content?.author && (
                <div className="flex items-center mt-6">
                  <Avatar className="w-8 h-8 mr-2 border border-gray-200">
                    <AvatarImage src={softwarePage.content.authorImage || ''} alt={softwarePage.content.author} />
                    <AvatarFallback>{softwarePage.content.author.charAt(0)}</AvatarFallback>
                  </Avatar>
                  <div className="flex items-center text-sm text-gray-500">
                    <span className="font-medium text-gray-900 mr-1">
                      {softwarePage.content.author}
                    </span>
                    · Last updated: {formattedDate}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
      
      {/* Introduction */}
      {softwarePage.content?.introduction && (
        <div className="py-12 px-4 bg-white">
          <div className="container mx-auto max-w-3xl">
            <div className="prose prose-lg max-w-none">
              <p>{softwarePage.content.introduction}</p>
            </div>
          </div>
        </div>
      )}
      
      {/* Main Content with Sidebar */}
      <div className="px-4 bg-gray-50">
        <div className="container mx-auto max-w-5xl">
          {/* Mobile Sidebar - only visible below md breakpoint */}
          <div className="block md:hidden mb-8 pt-8">
            <SoftwareSidebar />
          </div>
          
          <div className="flex flex-col md:flex-row gap-8">
            {/* Sidebar - only visible on md screens and up */}
            <div className="hidden md:block w-64 shrink-0">
              <div className="sticky top-32">
                <SoftwareSidebar />
              </div>
            </div>
            
            {/* Main Content */}
            <div className="flex-1 py-12">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
                <div>
                  <h2 className="text-2xl font-bold text-gray-900 mb-2">
                    {softwarePage.content?.toolsHeading || 'Top Tools'}
                  </h2>
                  {softwarePage.content?.toolsDescription && (
                    <p className="text-gray-600 max-w-2xl">
                      {softwarePage.content.toolsDescription}
                    </p>
                  )}
                </div>
                
                {/* Filters Toggle Button */}
                <Button
                  variant="outline"
                  className="flex items-center gap-2"
                  onClick={() => setShowFilters(!showFilters)}
                >
                  <Filter className="w-4 h-4" />
                  Filters
                </Button>
              </div>
              
              {/* Filters Section */}
              {showFilters && (
                <div className="bg-white p-4 rounded-xl shadow-sm mb-8 border border-gray-100">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Sort Options */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Sort By</h3>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={sortOption === 'popular' ? 'default' : 'outline'}
                          size="sm"
                          className="rounded-full"
                          onClick={() => setSortOption('popular')}
                        >
                          Most Popular
                        </Button>
                        <Button
                          variant={sortOption === 'newest' ? 'default' : 'outline'}
                          size="sm"
                          className="rounded-full"
                          onClick={() => setSortOption('newest')}
                        >
                          Newest First
                        </Button>
                        <Button
                          variant={sortOption === 'rating' ? 'default' : 'outline'}
                          size="sm"
                          className="rounded-full"
                          onClick={() => setSortOption('rating')}
                        >
                          Top Rated
                        </Button>
                      </div>
                    </div>
                    
                    {/* Pricing Filter */}
                    <div>
                      <h3 className="text-sm font-medium text-gray-700 mb-3">Pricing</h3>
                      <div className="flex flex-wrap gap-2">
                        <Button
                          variant={pricingFilter === 'all' ? 'default' : 'outline'}
                          size="sm"
                          className="rounded-full"
                          onClick={() => setPricingFilter('all')}
                        >
                          All Pricing
                        </Button>
                        <Button
                          variant={pricingFilter === 'free' ? 'default' : 'outline'}
                          size="sm"
                          className="rounded-full"
                          onClick={() => setPricingFilter('free')}
                        >
                          Free
                        </Button>
                        <Button
                          variant={pricingFilter === 'paid' ? 'default' : 'outline'}
                          size="sm"
                          className="rounded-full"
                          onClick={() => setPricingFilter('paid')}
                        >
                          Paid
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
              
              {/* Tools Grid */}
              {toolsLoading ? (
                <div className="flex items-center justify-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-purple-500"></div>
                </div>
              ) : relevantTools.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {relevantTools.map((tool) => (
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
                      onFavorite={(e) => handleFavorite(e, tool.id)}
                      pricing={convertPricingType(tool.pricing.type)}
                      isNew={tool.isNew}
                    />
                  ))}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center bg-white rounded-xl shadow-sm border border-gray-100">
                  <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                    <Zap className="w-8 h-8 text-gray-400" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 mb-2">No tools found</h3>
                  <p className="text-gray-600 max-w-md mb-6">
                    We couldn't find any tools matching your criteria. Try adjusting your filters or check back later!
                  </p>
                  <div className="flex gap-3">
                    <Button
                      variant="outline"
                      className="rounded-xl"
                      onClick={() => {
                        setPricingFilter('all');
                        setSortOption('popular');
                      }}
                    >
                      Reset Filters
                    </Button>
                    <Button
                      className="rounded-xl"
                      onClick={() => router.push('/add-product')}
                    >
                      Submit a Tool
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 