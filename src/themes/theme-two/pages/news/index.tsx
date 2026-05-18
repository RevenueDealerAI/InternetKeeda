import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Search, Share2 } from 'lucide-react';
import { toast } from 'sonner';

interface NewsPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
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
}

const CATEGORIES = [
  'All',
  'AI & Machine Learning',
  'Technology',
  'Business',
  'Science',
  'Innovation',
  'Startups',
  'Research',
  'Industry News',
];

export function NewsIndex() {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');

  // Fetch news posts
  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/news');
      if (!response.ok) throw new Error('Failed to fetch news posts');
      const data = await response.json();
      setPosts(data);
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

  // Filter posts based on search query and category
  const filteredPosts = posts.filter((post) => {
    const matchesSearch = post.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      post.excerpt.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === 'All' || post.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  // Handle share
  const handleShare = async (postId: string) => {
    try {
      const post = posts.find((p) => p._id === postId);
      if (!post) return;

      const url = `${window.location.origin}/news/${post.slug}`;

      // Share via Web Share API if available
      if (navigator.share) {
        await navigator.share({
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      }

      const response = await fetch(`/api/news/${postId}/share`, {
        method: 'POST',
      });
      if (!response.ok) throw new Error('Failed to increment share count');

      // Update the share count in the local state
      setPosts((prevPosts) =>
        prevPosts.map((p) =>
          p._id === postId
            ? { ...p, shares: p.shares + 1 }
            : p
        )
      );

    } catch (error) {
      console.error('Error sharing post:', error);
      // Fallback for cancellation or errors that aren't AbortError
      if (error instanceof Error && error.name !== 'AbortError') {
        try {
          // We need to reconstruct URL here if we don't have it in scope easily, 
          // or just assume we have access to post/url. 
          // Re-finding post to be safe or assuming the try block logic flow.
          const post = posts.find((p) => p._id === postId);
          if (post) {
            const url = `${window.location.origin}/news/${post.slug}`;
            await navigator.clipboard.writeText(url);
            toast.success('Link copied to clipboard!');
          }
        } catch (clipboardError) {
          toast.error('Failed to share post');
        }
      }
    }
  };

  return (
    <>
      <Helmet>
        <title>Latest News - AI Hunt</title>
        <meta name="description" content="Stay updated with the latest AI news and developments" />
      </Helmet>

      <div className="container mx-auto py-8">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Latest News</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Stay informed with the latest developments in AI, technology, and innovation.
            Discover groundbreaking research, industry trends, and expert insights.
          </p>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <Input
              placeholder="Search news..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Select
            value={selectedCategory}
            onValueChange={setSelectedCategory}
          >
            <SelectTrigger className="w-full sm:w-[200px]">
              <SelectValue placeholder="Select category" />
            </SelectTrigger>
            <SelectContent>
              {CATEGORIES.map((category) => (
                <SelectItem key={category} value={category}>
                  {category}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* News Grid */}
        {isLoading ? (
          <div className="text-center py-12">Loading news...</div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600">No news posts found</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredPosts.map((post) => (
              <article
                key={post._id}
                className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-200"
              >
                <Link href={`/news/${post.slug}`} className="block">
                  <div className="relative aspect-[16/9]">
                    <Image
                      src={post.imageUrl}
                      alt={post.title}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                </Link>

                <div className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <Badge variant="secondary">{post.category}</Badge>
                    <span className="text-sm text-gray-500">
                      {format(new Date(post.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>

                  <Link href={`/news/${post.slug}`} className="block group">
                    <h2 className="text-xl font-semibold mb-2 group-hover:text-blue-600 transition-colors">
                      {post.title}
                    </h2>
                    <p className="text-gray-600 mb-4 line-clamp-2">
                      {post.excerpt}
                    </p>
                  </Link>

                  <div className="flex items-center justify-between">
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
                      <span className="text-sm font-medium">
                        {post.author.name}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      <span className="text-sm text-gray-500" title="Views">
                        {post.views} 👁️
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        className="flex items-center gap-1"
                        onClick={(e) => {
                          e.preventDefault();
                          handleShare(post._id);
                        }}
                      >
                        <Share2 className="h-4 w-4" />
                        <span>{post.shares}</span>
                      </Button>
                    </div>
                  </div>

                  <div className="mt-4 text-sm text-gray-500">
                    Source:{' '}
                    <a
                      href={post.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-blue-600 hover:underline"
                      onClick={(e) => e.stopPropagation()}
                    >
                      {post.source}
                    </a>
                  </div>
                </div>
              </article>
            ))}
          </div>
        )}
      </div>
    </>
  );
} 