import { useState, useEffect } from 'react';
import Image from 'next/image';
import { useParams as useNextParams, usePathname } from 'next/navigation'
import { useContext } from 'react'
import { ParamsContext } from '@/lib/react-router-compat'
import Link from 'next/link'
import { Helmet } from 'react-helmet-async';
import { format } from 'date-fns';
import { Share2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { useAuth } from '@clerk/clerk-react';
import TipTapViewer from '@/themes/theme-one/components/TipTapViewer';

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
  const [post, setPost] = useState<NewsPost | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { getToken } = useAuth();

  useEffect(() => {
    if (!slug) {
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
  }, [slug, getToken]);

  const handleShare = async () => {
    try {
      await navigator.share({
        title: post?.title,
        text: post?.excerpt,
        url: window.location.href,
      });

      // Update share count
      const token = await getToken();
      await fetch(`${API_BASE_URL}/api/news/${post?._id}/share`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
    } catch (error) {
      console.error('Error sharing:', error);
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

      <div className="min-h-screen bg-gray-50">
        <div className="container mx-auto py-12 mt-[120px] px-4 sm:px-6 lg:px-8">
          <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-sm p-8">
            {/* Breadcrumb */}
            <nav className="mb-8 text-sm">
              <Link href="/latest-news" className="text-blue-600 hover:underline">
                News
              </Link>
              <span className="mx-2 text-gray-400">/</span>
              <span className="text-gray-600">{post.title}</span>
            </nav>

            {/* Header */}
            <header className="mb-12">
              <h1 className="text-4xl font-bold mb-6 text-gray-900 leading-tight">{post.title}</h1>
              <div className="flex flex-wrap items-center gap-6 text-gray-600">
                <div className="flex items-center gap-2">
                  <div className="relative w-8 h-8 rounded-full overflow-hidden border-2 border-white shadow-sm">
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
                <time className="text-gray-500">{format(new Date(post.createdAt), 'MMM d, yyyy')}</time>
                <Badge className="bg-orange-100 text-orange-800 hover:bg-orange-200">{post.category}</Badge>
              </div>
            </header>

            {/* Featured Image */}
            <div className="relative aspect-[16/9] mb-12 rounded-xl overflow-hidden shadow-lg">
              <Image
                src={post.imageUrl}
                alt={post.title}
                fill
                className="object-cover hover:scale-105 transition-transform duration-300"
                unoptimized
              />
            </div>

            {/* Content */}
            <div className="prose prose-lg max-w-none mb-12 prose-headings:text-gray-900 prose-p:text-gray-700 prose-a:text-blue-600">
              <TipTapViewer content={post.content} />
            </div>

            {/* Tags */}
            <div className="flex flex-wrap gap-2 mb-12">
              {post.tags.map((tag) => (
                <Badge
                  key={tag}
                  variant="secondary"
                  className="px-4 py-1 bg-gray-100 text-gray-700 hover:bg-gray-200"
                >
                  {tag}
                </Badge>
              ))}
            </div>

            {/* Source and Stats */}
            <div className="flex items-center justify-between border-t pt-6">
              <a
                href={post.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-blue-600 hover:underline flex items-center gap-2"
              >
                <span className="text-gray-600">Source:</span>
                <span className="font-medium">{post.source}</span>
              </a>
              <div className="flex items-center gap-6">
                <span className="flex items-center gap-2 text-gray-600">
                  <Eye className="h-5 w-5" />
                  <span className="font-medium">{post.views}</span>
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 hover:bg-gray-100"
                  onClick={handleShare}
                >
                  <Share2 className="h-4 w-4" />
                  <span className="font-medium">{post.shares}</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
} 