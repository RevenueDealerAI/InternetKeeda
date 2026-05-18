import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Calendar, Clock, ArrowRight, Newspaper, TrendingUp, Filter } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { motion, AnimatePresence } from "framer-motion";
import { normalizeImageUrl } from "@/utils/imageUrl";

interface NewsPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  imageUrl: string;
  author: {
    name: string;
    avatar: string;
  };
  source: string;
  sourceUrl: string;
  views: number;
  shares: number;
  createdAt: string;
  status: 'draft' | 'published';
}

export const LatestNews = () => {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Fetch news posts
  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/news');
      if (!response.ok) throw new Error('Failed to fetch news posts');
      const data = await response.json();
      // Only show published posts
      setPosts(data.filter((post: NewsPost) => post.status === 'published'));
    } catch (error) {
      console.error('Error fetching news posts:', error);
      toast.error('Failed to fetch news posts');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  // Get unique categories from posts
  const categories = ['All', ...new Set(posts.map(post => post.category))];

  // Filter posts by category
  const filteredPosts = selectedCategory === 'All'
    ? posts
    : posts.filter(post => post.category === selectedCategory);

  // Get trending posts (most viewed)
  const trendingPosts = [...posts]
    .sort((a, b) => b.views - a.views)
    .slice(0, 2);

  const getImageUrl = (url: string | undefined | null): string => {
    if (!url || url.trim() === '') {
      return '/placeholder.svg';
    }
    return normalizeImageUrl(url);
  };

  const getAvatarUrl = (avatar: string | undefined | null, name: string | undefined | null): string => {
    if (!avatar || avatar.trim() === '') {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Author')}&background=8039fd&color=fff&bold=true`;
    }
    return normalizeImageUrl(avatar);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white min-h-screen"
    >
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 mt-20">
        {/* Header */}
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <Newspaper className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              <span className="text-gray-900">Latest AI</span>{' '}
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                News & Updates
              </span>
            </h1>
          </div>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl">
            Stay informed with the latest breakthroughs, updates, and developments in the world of artificial intelligence.
          </p>
        </div>

        {/* Filters - Sticky */}
        <div className="sticky top-20 z-10 bg-white/80 backdrop-blur-sm py-4 -mx-4 px-4 mb-8 border-b border-gray-100">
          <div className="flex flex-wrap items-center gap-2">
            {categories.map(category => (
              <Button
                key={category}
                variant={selectedCategory === category ? "default" : "outline"}
                style={selectedCategory === category ? {
                  background: 'linear-gradient(90deg, #8039fd 0%, #f5a5ad 100%)',
                } : {}}
                className={`rounded-full hover:bg-purple-50 text-xs sm:text-sm h-9 sm:h-10 px-4 sm:px-6 transition-all ${
                  selectedCategory === category ? 'text-white' : 'text-gray-700'
                }`}
                onClick={() => setSelectedCategory(category)}
              >
                {category}
              </Button>
            ))}
          </div>
        </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 gap-6 sm:gap-8">
          {[1, 2].map((n) => (
            <div key={n} className="animate-pulse">
              <div className="rounded-2xl bg-gray-200 aspect-[16/9] mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/4 mb-2"></div>
              <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : (
        <>
          {/* Trending News */}
          {trendingPosts.length > 0 && (
            <div className="grid sm:grid-cols-2 gap-6 sm:gap-8 mb-12">
              <AnimatePresence>
                {trendingPosts.map((post, index) => (
                  <motion.div
                    key={post._id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.3, delay: index * 0.1 }}
                  >
                    <Link href={`/news/${post.slug}`}
                      className="group relative rounded-2xl overflow-hidden aspect-[16/9] block"
                    >
                      <Image
                        src={getImageUrl(post.imageUrl)}
                        alt={post.title}
                        fill
                        className="object-cover group-hover:scale-105 transition-transform duration-300 rounded-2xl"
                        unoptimized
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          if (target.src !== '/placeholder.svg') {
                            target.onerror = null;
                            target.src = '/placeholder.svg';
                          }
                        }}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/50 to-transparent rounded-2xl" />
                      <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 z-10">
                        <div className="flex flex-wrap items-center gap-2 sm:gap-4 text-white/80 text-xs sm:text-sm mb-2 sm:mb-4">
                          <span className="bg-purple-600 px-2 sm:px-3 py-0.5 sm:py-1 rounded-full">Trending</span>
                          <span className="flex items-center gap-1 sm:gap-2">
                            <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                            {new Date(post.createdAt).toLocaleDateString()}
                          </span>
                          <span className="flex items-center gap-1 sm:gap-2">
                            <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                            {post.views} views
                          </span>
                        </div>
                        <h2 className="text-base sm:text-xl font-semibold text-white mb-1 sm:mb-2 group-hover:text-purple-200 transition-colors line-clamp-2">
                          {post.title}
                        </h2>
                        <p className="text-white/80 text-xs sm:text-sm line-clamp-2">
                          {post.excerpt}
                        </p>
                      </div>
                    </Link>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {/* Latest News Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6 lg:gap-8">
            <AnimatePresence>
              {filteredPosts.map((post, index) => (
                <motion.div
                  key={post._id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.2, delay: index * 0.05 }}
                >
                  <Link href={`/news/${post.slug}`}
                    className="group bg-gray-50 rounded-2xl overflow-hidden shadow-sm hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col h-full border border-gray-100 hover:border-purple-200"
                  >
                <div className="relative aspect-[16/9] overflow-hidden">
                  <Image
                    src={getImageUrl(post.imageUrl)}
                    alt={post.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-200 rounded-t-2xl"
                    unoptimized
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      if (target.src !== '/placeholder.svg') {
                        target.onerror = null;
                        target.src = '/placeholder.svg';
                      }
                    }}
                  />
                </div>
                <div className="p-5 sm:p-6 flex flex-col flex-grow">
                  <div className="flex items-center gap-2 sm:gap-4 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-4">
                    <span className="flex items-center gap-1 sm:gap-2">
                      <Calendar className="w-3 h-3 sm:w-4 sm:h-4" />
                      {new Date(post.createdAt).toLocaleDateString()}
                    </span>
                    <span className="flex items-center gap-1 sm:gap-2">
                      <TrendingUp className="w-3 h-3 sm:w-4 sm:h-4" />
                      {post.views} views
                    </span>
                  </div>
                  <h3 className="text-base sm:text-xl font-semibold mb-2 group-hover:text-purple-600 transition-colors line-clamp-2">
                    {post.title}
                  </h3>
                  <p className="text-xs sm:text-sm text-gray-600 line-clamp-2 mb-3 sm:mb-4">
                    {post.excerpt}
                  </p>
                  <div className="flex items-center justify-between mt-auto">
                    <div className="flex items-center gap-2">
                      <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden">
                        <Image
                          src={getAvatarUrl(post.author?.avatar, post.author?.name)}
                          alt={post.author?.name || 'Author'}
                          fill
                          className="object-cover"
                          unoptimized
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            const fallbackUrl = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author?.name || 'Author')}&background=8039fd&color=fff&bold=true`;
                            if (!target.src.includes('ui-avatars.com')) {
                              target.onerror = null;
                              target.src = fallbackUrl;
                            }
                          }}
                        />
                      </div>
                      <span className="text-xs sm:text-sm text-gray-600">{post.author.name}</span>
                    </div>
                    <span className="text-xs sm:text-sm text-purple-600 font-medium">
                      {post.category}
                    </span>
                  </div>
                </div>
                  </Link>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
          
          {filteredPosts.length === 0 && (
            <div className="flex flex-col items-center justify-center py-12 sm:py-16 text-center">
              <div className="bg-gray-100 rounded-full p-6 mb-4">
                <Filter className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-2">No results found</h3>
              <p className="text-gray-600 mb-6 max-w-md">
                No articles found for "{selectedCategory}". Try selecting a different category.
              </p>
              <Button 
                variant="outline"
                onClick={() => setSelectedCategory('All')}
              >
                View all articles
              </Button>
            </div>
          )}
        </>
      )}
      </div>
    </motion.div>
  );
};

export default LatestNews; 