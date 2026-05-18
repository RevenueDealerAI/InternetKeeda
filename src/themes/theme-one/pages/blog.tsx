import { Zap, Calendar, Clock, User, Tag, Search } from "lucide-react";
import Image from 'next/image';
import Link from 'next/link'
import { Button } from "@/components/ui/button";
import { useBlogPosts } from "@/lib/api/blog";
import { BlogPost } from "@/types/blog";
import { useState } from "react";
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
    <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 mt-16 sm:mt-20">
      <div className="flex flex-col items-center text-center mb-8 sm:mb-12">
        <div className="inline-flex items-center justify-center w-12 h-12 sm:w-16 sm:h-16 rounded-2xl bg-purple-100 mb-4">
          <Zap className="w-6 h-6 sm:w-8 sm:h-8 text-purple-600" />
        </div>
        <h1 className="text-3xl sm:text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-3 sm:mb-4">
          AI Insights & Guides
        </h1>
        <p className="text-gray-600 max-w-xl sm:max-w-2xl text-sm sm:text-base">
          Deep dives into AI technology, tutorials, best practices, and expert insights to help you make the most of AI tools.
        </p>
      </div>

      <div className="max-w-xl sm:max-w-2xl mx-auto mb-8 sm:mb-12">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search articles..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 text-sm sm:text-base border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
          />
        </div>
        {searchQuery.trim() && (
          <div className="mt-2 text-sm text-gray-600 text-center">
            {filteredPosts.length === 0 
              ? "No articles found matching your search"
              : `Found ${filteredPosts.length} article${filteredPosts.length === 1 ? '' : 's'} matching "${searchQuery}"`
            }
          </div>
        )}
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
          filteredPosts.map((post) => (
            <Link
              key={post._id}
              href={`/blog/${post.slug}`}
              className="group bg-white rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col h-full"
            >
              <div className="relative w-full h-[180px] sm:h-[200px] md:h-[220px] overflow-hidden bg-gray-100">
                <div className="absolute inset-0 bg-gray-200 animate-pulse" />
                <Image
                  src={getOptimizedImageUrl(post.imageUrl)}
                  alt={post.title}
                  fill
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-200"
                  unoptimized
                />
              </div>
              <div className="p-4 sm:p-6 flex flex-col flex-grow">
                <div className="flex items-center gap-2 text-xs sm:text-sm text-gray-600 mb-2 sm:mb-3">
                  <span className="inline-flex items-center">
                    <Calendar className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {new Date(post.createdAt).toLocaleDateString()}
                  </span>
                  <span className="inline-flex items-center">
                    <Clock className="w-3 h-3 sm:w-4 sm:h-4 mr-1" />
                    {post.readTime}
                  </span>
                </div>
                <h3 className="text-lg sm:text-xl font-semibold mb-2 group-hover:text-purple-600 transition-colors line-clamp-2">
                  {post.title}
                </h3>
                <div 
                  className="text-gray-600 mb-3 sm:mb-4 line-clamp-2 prose text-sm sm:text-base"
                  dangerouslySetInnerHTML={{ __html: post.excerpt }}
                />
                <div className="flex items-center justify-between mt-auto">
                  <div className="flex items-center gap-2">
                    <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden">
                      <Image
                        src={post.author.avatar}
                        alt={post.author.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                    <span className="text-xs sm:text-sm text-gray-600">{post.author.name}</span>
                  </div>
                  <span className="text-xs sm:text-sm text-purple-600 font-medium">
                    {post.category}
                  </span>
                </div>
                <div className="mt-3 sm:mt-4 flex flex-wrap gap-1.5 sm:gap-2">
                  {post.tags.slice(0, 3).map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800"
                    >
                      <Tag className="w-2.5 h-2.5 sm:w-3 sm:h-3 mr-1" />
                      {tag}
                    </span>
                  ))}
                  {post.tags.length > 3 && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                      +{post.tags.length - 3}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))
        )}
      </div>
    </div>
  );
};
