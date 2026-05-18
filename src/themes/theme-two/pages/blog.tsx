import { Zap, Calendar, Clock, User, Tag, Search, BookOpen } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link'
import { Button } from "@/components/ui/button";
import { useBlogPosts } from "@/lib/api/blog";
import { BlogPost } from "@/types/blog";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { normalizeImageUrl } from '@/utils/imageUrl';

const getOptimizedImageUrl = (url: string) => {
  const normalized = normalizeImageUrl(url);

  if (normalized.includes('imgix.net')) {
    return `${normalized}?w=600&h=400&fit=crop&auto=format,compress`;
  }
  
  if (normalized.includes('unsplash.com')) {
    return `${normalized}&w=600&h=400&fit=crop&auto=format`;
  }
  
  return normalized;
};

export const Blog = () => {
  const { data: posts = [], isLoading, error } = useBlogPosts();
  const [searchQuery, setSearchQuery] = useState("");

  const publishedPosts = posts.filter(post => post.status === 'published');

  const filteredPosts = publishedPosts.filter(post => {
    if (!searchQuery.trim()) return true;
    
    const query = searchQuery.toLowerCase();
    return (
      post.title.toLowerCase().includes(query) ||
      post.excerpt.toLowerCase().includes(query) ||
      post.category.toLowerCase().includes(query) ||
      post.tags.some(tag => tag.toLowerCase().includes(query)) ||
      post.author.name.toLowerCase().includes(query)
    );
  });

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.5 }}
      className="bg-white min-h-screen"
    >
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 mt-20">
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
              <BookOpen className="w-6 h-6 text-white" />
            </div>
            <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold">
              <span className="text-gray-900">AI Insights &</span>{' '}
              <span className="bg-gradient-to-r from-purple-600 via-pink-600 to-purple-600 bg-clip-text text-transparent">
                Guides
              </span>
            </h1>
          </div>
          <p className="text-gray-600 text-lg mb-8 max-w-2xl">
            Deep dives into AI technology, tutorials, best practices, and expert insights to help you make the most of AI tools.
          </p>

          <div className="max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-purple-500" />
              <input
                type="text"
                placeholder="Search articles..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  borderRadius: '50px',
                  background: 'linear-gradient(126deg, #FFF 0.89%, rgba(255, 255, 255, 0.00) 99.4%)',
                  boxShadow: '1px 1px 20px -5px rgba(0, 0, 0, 0.30)',
                }}
                className="w-full pl-11 pr-4 py-3 border border-purple-200 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-purple-300 font-medium"
              />
            </div>
            {searchQuery.trim() && (
              <div className="mt-2 text-sm text-gray-600">
                {filteredPosts.length === 0 
                  ? "No articles found matching your search"
                  : `Found ${filteredPosts.length} article${filteredPosts.length === 1 ? '' : 's'} matching "${searchQuery}"`}
              </div>
            )}
          </div>
        </div>

      <div className="grid grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 lg:grid-cols-3 md:gap-8">
        {isLoading ? (
          <div className="col-span-full flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 sm:h-12 sm:w-12 border-b-2 border-purple-600"></div>
          </div>
        ) : error ? (
          <div className="col-span-full text-center text-red-600 py-16">
            Error loading blog posts. Please try again later.
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="col-span-full text-center text-gray-500 py-16">
            {searchQuery.trim() ? (
              <div>
                <Search className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <h3 className="text-lg font-medium mb-2">No articles found</h3>
                <p className="text-sm">Try adjusting your search terms or browse all articles.</p>
                <Button 
                  variant="outline" 
                  className="mt-4"
                  onClick={() => setSearchQuery("")}
                >
                  Clear search
                </Button>
              </div>
            ) : (
              "No blog posts found."
            )}
          </div>
        ) : (
          <AnimatePresence>
            {filteredPosts.map((post, index) => (
              <motion.div
                key={post._id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2, delay: index * 0.05 }}
              >
                <Link href={`/blog/${post.slug}`}
                  className="group bg-gray-50 rounded-2xl overflow-hidden shadow-sm hover:bg-white hover:shadow-xl transition-all duration-300 flex flex-col h-full border border-gray-100 hover:border-purple-200"
                >
                  <div className="relative w-full h-[200px] sm:h-[220px] overflow-hidden">
                    <Image
                      src={getOptimizedImageUrl(post.imageUrl)}
                      alt={post.title}
                      fill
                      className="object-cover group-hover:scale-105 transition-transform duration-200 rounded-t-2xl"
                      unoptimized
                    />
                  </div>
                  <div className="p-5 sm:p-6 flex flex-col flex-grow">
                    <div className="flex items-center gap-3 text-xs text-gray-600 mb-3">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(post.createdAt).toLocaleDateString()}
                      </span>
                      <span className="flex items-center gap-1">
                        <Clock className="w-3 h-3" />
                        {post.readTime}
                      </span>
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold mb-2 group-hover:text-purple-600 transition-colors line-clamp-2">
                      {post.title}
                    </h3>
                    <div 
                      className="text-gray-600 mb-4 line-clamp-2 text-sm"
                      dangerouslySetInnerHTML={{ __html: post.excerpt }}
                    />
                    <div className="flex items-center justify-between mt-auto mb-3">
                      <div className="flex items-center gap-2">
                        <div className="relative w-8 h-8 rounded-full overflow-hidden">
                          <Image
                            src={post.author.avatar}
                            alt={post.author.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <span className="text-sm text-gray-600">{post.author.name}</span>
                      </div>
                      <span className="text-sm text-purple-600 font-medium">
                        {post.category}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {post.tags.slice(0, 3).map((tag, tagIndex) => (
                        <span
                          key={tagIndex}
                          className="inline-flex items-center px-3 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 border border-purple-200"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </div>
                </Link>
              </motion.div>
            ))}
          </AnimatePresence>
        )}
      </div>
      </div>
    </motion.div>
  );
};
