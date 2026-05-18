import { useState, useEffect } from "react";
import Image from 'next/image';
import { useParams as useNextParams } from 'next/navigation'
import { useContext } from 'react'
import { ParamsContext } from '@/lib/react-router-compat'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
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
  Loader2
} from "lucide-react";
import { MOCK_PRODUCTS } from "@/data/mockData";
import { toast } from "sonner";

const ProductDetailSkeleton = () => (
  <div className="animate-pulse">
    {/* Product Image and Title */}
    <div className="flex items-start gap-6">
      <div className="w-32 h-32 bg-gray-200 rounded-3xl" />
      <div className="flex-1">
        <div className="flex gap-2 mb-3">
          <div className="h-6 w-32 bg-gray-200 rounded-full" />
          <div className="h-6 w-24 bg-gray-200 rounded-full" />
        </div>
        <div className="h-8 w-3/4 bg-gray-200 rounded-lg mb-3" />
        <div className="h-20 bg-gray-200 rounded-lg" />
      </div>
    </div>

    {/* Stats Grid */}
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
      {[...Array(4)].map((_, i) => (
        <div key={i} className="bg-white rounded-2xl p-4 border border-gray-200">
          <div className="h-6 w-24 bg-gray-200 rounded mb-2" />
          <div className="h-8 w-16 bg-gray-200 rounded" />
        </div>
      ))}
    </div>
  </div>
);

const ProductDetail = () => {
  const contextParams = useContext(ParamsContext);
  const nextParams = useNextParams();
  const params = { ...contextParams, ...nextParams } as { id?: string };
  const { id } = params;
  const router = useRouter();
  const [isVoted, setIsVoted] = useState(false);
  const [product, setProduct] = useState(MOCK_PRODUCTS.find(p => p.id === id));
  const [voteCount, setVoteCount] = useState(product?.votes || 0);
  const [showQuickActions, setShowQuickActions] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isVoting, setIsVoting] = useState(false);
  const [isSharing, setIsSharing] = useState(false);

  useEffect(() => {
    if (!product) {
      router.push("/");
    }
    // Simulate initial loading
    const timer = setTimeout(() => {
      setIsLoading(false);
    }, 1000);
    return () => clearTimeout(timer);
  }, [product, router]);

  useEffect(() => {
    const handleScroll = () => {
      const scrollPosition = window.scrollY;
      setShowQuickActions(scrollPosition > 300);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleVote = async () => {
    if (!isVoted && !isVoting) {
      setIsVoting(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800));
      setVoteCount(prev => prev + 1);
      setIsVoted(true);
      setIsVoting(false);
      toast.success("Thanks for your vote!");
    }
  };

  const handleShare = async () => {
    if (!isSharing) {
      setIsSharing(true);
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500));
      await navigator.clipboard.writeText(window.location.href);
      setIsSharing(false);
      toast.success("Link copied to clipboard!");
    }
  };

  if (!product) return null;

  return (
    <div className="min-h-screen bg-gray-50 pt-[5rem]">
      <main>
        {/* Hero Section */}
        <div className="bg-white">
          <div className="max-w-7xl mx-auto px-4 py-8">
            <AnimatePresence mode="wait">
              {isLoading ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <ProductDetailSkeleton />
                </motion.div>
              ) : (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.4 }}
                  className="flex flex-col lg:flex-row gap-12"
                >
                  {/* Left Column - Product Info */}
                  <div className="flex-1">
                    <div className="flex flex-col gap-6">
                      <div className="flex items-start gap-6">
                        {/* Product Image */}
                        <div className="relative group">
                          <div className="w-32 h-32 rounded-3xl overflow-hidden bg-gradient-to-br from-purple-50 to-purple-100/50 
                            shadow-lg ring-1 ring-black/[0.08] flex-shrink-0 transition-transform duration-300 group-hover:scale-105 relative">
                            <Image
                              src={product.imageUrl}
                              alt={product.name}
                              fill
                              className="object-cover"
                              unoptimized
                            />
                          </div>
                          <div className="absolute -bottom-3 -right-3 bg-purple-100 text-purple-700 px-3 py-1 rounded-full text-sm font-medium">
                            #{Math.floor(voteCount / 100)}
                          </div>
                        </div>

                        {/* Product Details */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-start justify-between gap-4">
                            <div>
                              <Link href="/"
                                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg transition-all duration-200 mb-4 group"
                              >
                                <ArrowLeft className="w-4 h-4 transition-transform group-hover:-translate-x-1" />
                                Back to Products
                              </Link>
                              <div className="flex items-center gap-2 mb-3">
                                <Badge className="bg-gradient-to-r from-purple-500 to-purple-600 text-white border-0">
                                  Product of the Day
                                </Badge>
                                <Badge variant="outline" className="text-gray-600 bg-white">
                                  {product.category}
                                </Badge>
                              </div>
                              <h1 className="text-3xl font-bold text-gray-900 mb-3 leading-tight">
                                {product.name}
                              </h1>
                              <p className="text-lg text-gray-600 leading-relaxed">
                                {product.description}
                                <br /><br />
                                This powerful AI model excels at understanding context and generating human-like responses across a wide range of topics and tasks.
                                It can assist with everything from creative writing to technical analysis, making it a versatile tool for both casual users and professionals.
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-10">
                      <div className="bg-white rounded-2xl p-4 border border-gray-200 hover:border-purple-200 transition-colors">
                        <div className="flex items-center gap-3 mb-1">
                          <div className="bg-purple-100 p-2 rounded-lg">
                            <Users className="w-5 h-5 text-purple-600" />
                          </div>
                          <span className="text-sm font-medium text-gray-600">Users</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">50K+</div>
                      </div>
                      <div className="bg-white rounded-2xl p-4 border border-gray-200 hover:border-purple-200 transition-colors">
                        <div className="flex items-center gap-3 mb-1">
                          <Star className="w-5 h-5 text-purple-600" />
                          <span className="text-sm font-medium text-gray-600">Rating</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">4.8/5.0</div>
                      </div>
                      <div className="bg-white rounded-2xl p-4 border border-gray-200 hover:border-purple-200 transition-colors">
                        <div className="flex items-center gap-3 mb-1">
                          <Zap className="w-5 h-5 text-purple-600" />
                          <span className="text-sm font-medium text-gray-600">Launch</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">2023</div>
                      </div>
                      <div className="bg-white rounded-2xl p-4 border border-gray-200 hover:border-purple-200 transition-colors">
                        <div className="flex items-center gap-3 mb-1">
                          <Shield className="w-5 h-5 text-purple-600" />
                          <span className="text-sm font-medium text-gray-600">Verified</span>
                        </div>
                        <div className="text-2xl font-bold text-gray-900">Yes</div>
                      </div>
                    </div>

                    {/* Action Buttons with loading states */}
                    <div className="flex items-center gap-4 mt-8">
                      <Button
                        onClick={handleVote}
                        size="lg"
                        disabled={isVoting || isVoted}
                        className={`flex-1 max-w-[200px] rounded-xl transition-all duration-300 ${
                          isVoted
                            ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                            : "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800"
                        }`}
                      >
                        {isVoting ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                          <ArrowUpCircle className={`w-5 h-5 mr-2 ${isVoted ? "" : "animate-bounce"}`} />
                        )}
                        {isVoted ? "Upvoted" : "Upvote"} ({voteCount})
                      </Button>
                      <Button 
                        variant="outline" 
                        size="lg"
                        disabled={isSharing}
                        onClick={handleShare}
                        className="flex-1 max-w-[200px] rounded-xl border-2 hover:bg-gray-50"
                      >
                        {isSharing ? (
                          <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                        ) : (
                          <Share2 className="w-5 h-5 mr-2" />
                        )}
                        Share
                      </Button>
                    </div>
                  </div>

                  {/* Right Column - Quick Info */}
                  <div className="lg:w-80">
                    <div className="sticky top-20 space-y-4">
                      <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-purple-200 transition-colors">
                        <h3 className="text-sm font-medium text-gray-900 mb-4">Highlights</h3>
                        <div className="space-y-3">
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="bg-green-100 p-1 rounded-lg">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            </div>
                            <span>Free plan available</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="bg-green-100 p-1 rounded-lg">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            </div>
                            <span>API access</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="bg-green-100 p-1 rounded-lg">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            </div>
                            <span>24/7 support</span>
                          </div>
                          <div className="flex items-center gap-2 text-gray-600">
                            <div className="bg-green-100 p-1 rounded-lg">
                              <CheckCircle2 className="w-4 h-4 text-green-600" />
                            </div>
                            <span>Regular updates</span>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-2xl p-6 border border-gray-200 hover:border-purple-200 transition-colors">
                        <h3 className="text-sm font-medium text-gray-900 mb-4">Links</h3>
                        <div className="space-y-3">
                          <a 
                            href="#" 
                            target="_blank"
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
                          >
                            <div className="bg-gray-100 group-hover:bg-gray-200 p-1.5 rounded-lg transition-colors">
                              <Globe className="w-4 h-4" />
                            </div>
                            <span>Website</span>
                          </a>
                          <a 
                            href="#" 
                            target="_blank"
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
                          >
                            <div className="bg-gray-100 group-hover:bg-gray-200 p-1.5 rounded-lg transition-colors">
                              <Twitter className="w-4 h-4" />
                            </div>
                            <span>Twitter</span>
                          </a>
                          <a 
                            href="#" 
                            target="_blank"
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
                          >
                            <div className="bg-gray-100 group-hover:bg-gray-200 p-1.5 rounded-lg transition-colors">
                              <Linkedin className="w-4 h-4" />
                            </div>
                            <span>LinkedIn</span>
                          </a>
                          <a 
                            href="#" 
                            target="_blank"
                            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors group"
                          >
                            <div className="bg-gray-100 group-hover:bg-gray-200 p-1.5 rounded-lg transition-colors">
                              <Github className="w-4 h-4" />
                            </div>
                            <span>GitHub</span>
                          </a>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* Content Tabs with smooth transitions */}
        <div className="max-w-7xl mx-auto px-4 py-8">
          <Tabs defaultValue="about" className="space-y-6">
            <TabsList className="bg-white border-b w-full justify-start rounded-none h-12 p-0 space-x-2">
              <TabsTrigger 
                value="about"
                className="h-12 px-6 rounded-none data-[state=active]:text-purple-600 data-[state=active]:border-b-2 
                  data-[state=active]:border-purple-600 transition-colors hover:text-purple-600"
              >
                About
              </TabsTrigger>
              <TabsTrigger 
                value="features"
                className="h-12 px-6 rounded-none data-[state=active]:text-purple-600 data-[state=active]:border-b-2 
                  data-[state=active]:border-purple-600 transition-colors hover:text-purple-600"
              >
                Features
              </TabsTrigger>
              <TabsTrigger 
                value="pricing"
                className="h-12 px-6 rounded-none data-[state=active]:text-purple-600 data-[state=active]:border-b-2 
                  data-[state=active]:border-purple-600 transition-colors hover:text-purple-600"
              >
                Pricing
              </TabsTrigger>
              <TabsTrigger 
                value="reviews"
                className="h-12 px-6 rounded-none data-[state=active]:text-purple-600 data-[state=active]:border-b-2 
                  data-[state=active]:border-purple-600 transition-colors hover:text-purple-600"
              >
                Reviews
              </TabsTrigger>
              <TabsTrigger 
                value="alternatives"
                className="h-12 px-6 rounded-none data-[state=active]:text-purple-600 data-[state=active]:border-b-2 
                  data-[state=active]:border-purple-600 transition-colors hover:text-purple-600"
              >
                Alternatives
              </TabsTrigger>
            </TabsList>

            <AnimatePresence mode="wait">
              {["about", "features", "pricing", "reviews", "alternatives"].map((tab) => (
                <TabsContent key={tab} value={tab} className="space-y-6 outline-none">
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    transition={{ duration: 0.2 }}
                  >
                    {/* ... existing tab content ... */}
                  </motion.div>
                </TabsContent>
              ))}
            </AnimatePresence>
          </Tabs>
        </div>
      </main>

      {/* Floating Quick Actions */}
      <div className={`fixed bottom-8 right-8 flex flex-col gap-3 transition-all duration-300 z-50 ${
        showQuickActions 
          ? 'translate-y-0 opacity-100' 
          : 'translate-y-12 opacity-0 pointer-events-none'
      }`}>
        <div className="bg-white/95 backdrop-blur-sm rounded-full shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-3 flex flex-col gap-3 border border-gray-200/50 hover:border-purple-200/50 transition-all duration-300">
          <Button
            size="icon"
            onClick={handleVote}
            className={`rounded-full w-10 h-10 transition-all duration-300 transform hover:scale-110 ${
              isVoted
                ? "bg-purple-100 text-purple-700 hover:bg-purple-200"
                : "bg-gradient-to-r from-purple-600 to-purple-700 text-white hover:from-purple-700 hover:to-purple-800 hover:shadow-purple-200/50 hover:shadow-lg"
            }`}
            title={isVoted ? "Upvoted" : "Upvote"}
          >
            <ArrowUpCircle className={`w-5 h-5 transition-transform duration-300 ${isVoted ? "" : "animate-bounce"}`} />
          </Button>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleShare}
            className="rounded-full w-10 h-10 hover:bg-gray-100 transition-all duration-300 transform hover:scale-110 hover:shadow-lg hover:shadow-gray-200/50"
            title="Share"
          >
            <Share2 className="w-5 h-5 transition-transform duration-300 group-hover:rotate-12" />
          </Button>
        </div>
        <Button
          size="icon"
          variant="outline"
          onClick={scrollToTop}
          className="rounded-full w-10 h-10 bg-white/95 shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:bg-gray-100 transition-all duration-300 transform hover:scale-110 hover:shadow-lg hover:shadow-gray-200/50 hover:border-purple-200/50"
          title="Back to top"
        >
          <ChevronUp className="w-5 h-5 transition-transform duration-300 group-hover:translate-y-[-2px]" />
        </Button>
      </div>
    </div>
  );
};

export default ProductDetail;