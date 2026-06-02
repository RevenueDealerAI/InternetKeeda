import { useState, useEffect } from 'react';
import { useParams as useNextParams, usePathname } from 'next/navigation';
import { useContext } from 'react';
import { ParamsContext } from '@/lib/react-router-compat';
import Link from 'next/link';
import Image from 'next/image';
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import { Share2, Eye, Calendar, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@clerk/clerk-react';
import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { getSampleReview } from '@/data/sample-reviews';
import SampleReviewLayout from '@/themes/theme-one/components/SampleReviewLayout';

const TipTapViewer = dynamic(
  () => import('@/themes/theme-two/components/TipTapViewer'),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3">
        <div className="h-4 w-full bg-gray-100 animate-pulse rounded" />
        <div className="h-4 w-5/6 bg-gray-100 animate-pulse rounded" />
        <div className="h-4 w-4/5 bg-gray-100 animate-pulse rounded" />
      </div>
    ),
  }
);

const API_BASE_URL = '';

interface NewsPost {
  _id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  category: string;
  imageUrl: string;
  tags: string[];
  author: {
    name: string;
    avatar: string;
  };
  source: string;
  sourceUrl: string;
  views: number;
  shares: number;
  createdAt: string;
  updatedAt: string;
}

export function NewsDetail() {
  const contextParams = useContext(ParamsContext);
  const nextParams = useNextParams();
  const pathname = usePathname();
  const params = { ...contextParams, ...nextParams } as { slug?: string };
  let rawSlug = params.slug;

  if (!rawSlug && pathname) {
    const pathParts = pathname.split('/');
    const newsIndex = pathParts.indexOf('news');
    if (newsIndex !== -1 && pathParts[newsIndex + 1]) {
      rawSlug = pathParts[newsIndex + 1];
    }
  }

  const slug = rawSlug ? decodeURIComponent(rawSlug) : undefined;
  // Hand-written sample reviews short-circuit the API fetch and
  // render the shared dark-themed layout (reused from theme-one).
  const sample = slug ? getSampleReview(slug) : undefined;
  const [post, setPost] = useState<NewsPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  useEffect(() => {
    if (!slug || sample) {
      setIsLoading(false);
      return;
    }

    const fetchPost = async () => {
      try {
        setIsLoading(true);
        const token = await getToken();
        const response = await fetch(`${API_BASE_URL}/api/news/${slug}`, {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          if (response.status === 404) {
            setPost(null);
            return;
          }
          throw new Error('Failed to fetch news post');
        }
        const data = await response.json();
        setPost(data);
      } catch (error) {
        console.error('Error fetching news post:', error);
        setPost(null);
      } finally {
        setIsLoading(false);
      }
    };

    fetchPost();
  }, [slug, getToken, sample]);

  // Sample short-circuit: render the dedicated review layout
  // instead of fetching and 404-ing.
  if (sample) {
    return <SampleReviewLayout review={sample} />;
  }

  const handleShare = async () => {
    const url = window.location.href;

    try {
      if (navigator.share) {
        await navigator.share({
          url: url,
        });
      } else {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      }

      // Update share count
      if (post?._id) {
        const token = await getToken();
        await fetch(`${API_BASE_URL}/api/news/${post._id}/share`, {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        });
      }
    } catch (error) {
      // If share fails (e.g., user cancelled), try copying to clipboard as fallback if it wasn't a cancellation
      if (error instanceof Error && error.name !== 'AbortError') {
        try {
          await navigator.clipboard.writeText(url);
          toast.success('Link copied to clipboard!');
        } catch (clipboardError) {
          console.error('Error sharing and copying:', clipboardError);
          toast.error('Failed to share link');
        }
      }
    }
  };

  if (isLoading) {
    return (
      <div className="container mx-auto py-8 mt-[85px]">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-3/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-12"></div>
          <div className="h-96 bg-gray-200 rounded mb-8"></div>
        </div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="container mx-auto py-8 mt-[85px]">
        <h1 className="text-2xl font-bold mb-4">News post not found</h1>
        <Link href="/latest-news" className="text-blue-600 hover:underline">
          Back to News
        </Link>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.title} - AI Hunt News</title>
        <meta name="description" content={post.excerpt} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        <meta property="og:image" content={post.imageUrl} />
      </Helmet>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.5 }}
        className="min-h-screen bg-gray-50"
      >
        <div className="container mx-auto py-8 mt-20 px-4 sm:px-6 lg:px-8">
          <div className="max-w-5xl mx-auto">
            {/* Back Button */}
            <Link href="/latest-news">
              <Button variant="ghost" className="mb-6 -ml-2 hover:bg-purple-50">
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back to News
              </Button>
            </Link>

            {/* Card Container */}
            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
              {/* Featured Image - Hero Style */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3 }}
                className="relative h-80 sm:h-96 overflow-hidden"
              >
                <Image
                  src={post.imageUrl}
                  alt={post.title}
                  fill
                  className="object-cover"
                  unoptimized
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />

                {/* Meta info over image */}
                <div className="absolute bottom-0 left-0 right-0 p-6">
                  <Badge className="bg-purple-600 text-white border-0 mb-3">{post.category}</Badge>
                  <h1 className="text-2xl sm:text-3xl font-bold text-white mb-3 leading-tight">{post.title}</h1>
                  <div className="flex flex-wrap items-center gap-4 text-white/90 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white">
                        <Image
                          src={post.author.avatar}
                          alt={post.author.name}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      </div>
                      <span className="font-medium">{post.author.name}</span>
                    </div>
                    <span className="flex items-center gap-1">
                      <Calendar className="w-4 h-4" />
                      {format(new Date(post.createdAt), 'MMM d, yyyy')}
                    </span>
                  </div>
                </div>
              </motion.div>

              {/* Content */}
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                transition={{ duration: 0.3, delay: 0.2 }}
                className="p-6 sm:p-10"
              >
                <div className="prose prose-sm sm:prose-base max-w-none prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-purple-600 prose-a:font-medium mb-8">
                  <TipTapViewer content={post.content} />
                </div>

                {/* Tags */}
                <div className="flex flex-wrap gap-2 mb-8">
                  {post.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant="secondary"
                      className="px-4 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200 rounded-full"
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>

                {/* Divider */}
                <div className="border-t border-gray-200 pt-6">
                  {/* Source and Stats */}
                  <div className="flex flex-wrap items-center justify-between gap-4">
                    <a
                      href={post.sourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-purple-600 hover:underline flex items-center gap-2 text-sm"
                    >
                      <span className="text-gray-600">Source:</span>
                      <span className="font-medium">{post.source}</span>
                    </a>
                    <div className="flex items-center gap-4">
                      <span className="flex items-center gap-2 text-gray-600 text-sm">
                        <Eye className="h-4 w-4" />
                        <span className="font-medium">{post.views}</span>
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        className="flex items-center gap-2 hover:bg-purple-50 border-purple-200 rounded-full"
                        onClick={handleShare}
                      >
                        <Share2 className="h-4 w-4" />
                        <span className="font-medium">{post.shares}</span>
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </motion.div>
    </>
  );
} 