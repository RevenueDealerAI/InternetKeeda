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
import dynamic from 'next/dynamic';

// TipTap is ~150 KB gzipped. Dynamic-import so it only ships to
// readers of /news/[slug] and doesn't get co-bundled into the
// shared chunk that loads on / and other tool routes.
const TipTapViewer = dynamic(
  () => import('@/themes/theme-one/components/TipTapViewer'),
  {
    ssr: false,
    loading: () => (
      <div className="space-y-3">
        <div className="h-4 w-full bg-gray-100 animate-pulse rounded" />
        <div className="h-4 w-5/6 bg-gray-100 animate-pulse rounded" />
        <div className="h-4 w-4/5 bg-gray-100 animate-pulse rounded" />
        <div className="h-4 w-full bg-gray-100 animate-pulse rounded" />
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
      <main
        className="min-h-screen"
        style={{ background: 'var(--bg)', color: 'var(--ink)' }}
      >
        <div className="container mx-auto px-4 pt-[140px] pb-16 sm:px-6 lg:px-8">
          <div className="mx-auto max-w-4xl animate-pulse space-y-4">
            <div
              className="h-4 w-32 rounded"
              style={{ background: 'var(--surface-2)' }}
            />
            <div
              className="h-10 w-3/4 rounded"
              style={{ background: 'var(--surface-2)' }}
            />
            <div
              className="h-4 w-1/2 rounded"
              style={{ background: 'var(--surface-2)' }}
            />
            <div
              className="h-96 rounded-2xl"
              style={{ background: 'var(--surface-2)' }}
            />
          </div>
        </div>
      </main>
    );
  }

  if (!post) {
    return (
      <main
        className="min-h-screen"
        style={{ background: 'var(--bg)', color: 'var(--ink)' }}
      >
        <div className="container mx-auto px-4 pt-[140px] pb-16 text-center sm:px-6 lg:px-8">
          <div
            className="text-[11px] uppercase tracking-[0.3em]"
            style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}
          >
            § 404 — review not found
          </div>
          <h1
            className="m-0 mt-4 text-3xl font-semibold"
            style={{ color: 'var(--ink)', letterSpacing: '-0.02em' }}
          >
            We couldn&apos;t find that review
          </h1>
          <p
            className="mx-auto mt-4 max-w-md text-[15px]"
            style={{ color: 'var(--ink-2)' }}
          >
            It may have been moved, renamed, or never published. Browse the
            current reviews instead.
          </p>
          <Link
            href="/reviews"
            className="mt-8 inline-flex items-center gap-2 rounded-full px-5 py-3 text-[12px] uppercase tracking-[0.16em]"
            style={{
              background: 'var(--accent)',
              color: 'var(--on-accent)',
              fontFamily: 'var(--mono)',
              fontWeight: 600,
            }}
          >
            All reviews
          </Link>
        </div>
      </main>
    );
  }

  return (
    <>
      <Helmet>
        <title>{post.title} · Internet Keeda Reviews</title>
        <meta name="description" content={post.excerpt} />
        <meta property="og:title" content={post.title} />
        <meta property="og:description" content={post.excerpt} />
        {post.imageUrl && <meta property="og:image" content={post.imageUrl} />}
      </Helmet>

      <main
        className="min-h-screen"
        style={{ background: 'var(--bg)', color: 'var(--ink)' }}
      >
        <div className="container mx-auto px-4 pt-[140px] pb-16 sm:px-6 lg:px-8">
          <article
            className="mx-auto max-w-4xl rounded-2xl p-6 sm:p-10"
            style={{
              background: 'var(--bg-2)',
              border: '1px solid var(--rule)',
              boxShadow: 'var(--shadow-sm)',
            }}
          >
            {/* Breadcrumb */}
            <nav
              className="mb-8 text-[11px] uppercase tracking-[0.22em]"
              style={{ fontFamily: 'var(--mono)', color: 'var(--ink-soft)' }}
            >
              <Link
                href="/reviews"
                style={{ color: 'var(--accent)' }}
                className="hover:underline"
              >
                Reviews
              </Link>
              <span className="mx-2" style={{ color: 'var(--ink-dim)' }}>
                /
              </span>
              <span
                style={{ color: 'var(--ink-2)', textTransform: 'none', letterSpacing: 0 }}
              >
                {post.title}
              </span>
            </nav>

            {/* Header */}
            <header className="mb-10">
              <div
                className="text-[11px] uppercase tracking-[0.3em]"
                style={{ color: 'var(--accent)', fontFamily: 'var(--mono)' }}
              >
                § review — {post.category}
              </div>
              <h1
                className="m-0 mt-3"
                style={{
                  color: 'var(--ink)',
                  fontFamily: 'var(--sans)',
                  fontSize: 'clamp(28px, 4.2vw, 44px)',
                  fontWeight: 600,
                  lineHeight: 1.12,
                  letterSpacing: '-0.025em',
                }}
              >
                {post.title}
              </h1>
              <div
                className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-3"
                style={{ color: 'var(--ink-2)' }}
              >
                <div className="flex items-center gap-2">
                  <div
                    className="relative h-8 w-8 overflow-hidden rounded-full"
                    style={{ border: '1px solid var(--rule)' }}
                  >
                    <Image
                      src={post.author.avatar}
                      alt={post.author.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                  <span
                    className="text-[13px]"
                    style={{ fontFamily: 'var(--mono)' }}
                  >
                    {post.author.name}
                  </span>
                </div>
                <time
                  className="text-[12px]"
                  style={{
                    color: 'var(--ink-soft)',
                    fontFamily: 'var(--mono)',
                  }}
                >
                  {format(new Date(post.createdAt), 'MMM d, yyyy')}
                </time>
                <Badge
                  className="border-0 px-3 py-1 text-[10px] uppercase tracking-[0.22em]"
                  style={{
                    background: 'var(--accent-soft)',
                    color: 'var(--accent)',
                    fontFamily: 'var(--mono)',
                  }}
                >
                  {post.category}
                </Badge>
              </div>
            </header>

            {/* Featured Image */}
            {post.imageUrl && (
              <div
                className="relative aspect-[16/9] mb-12 overflow-hidden rounded-xl"
                style={{ border: '1px solid var(--rule)' }}
              >
                <Image
                  src={post.imageUrl}
                  alt={post.title}
                  fill
                  className="object-cover transition-transform duration-300 hover:scale-105"
                  unoptimized
                />
              </div>
            )}

            {/* Content */}
            <div
              className="prose prose-base sm:prose-lg max-w-none mb-12
                prose-headings:font-semibold prose-headings:tracking-tight
                prose-h2:mt-10 prose-h2:mb-3 prose-h3:mt-8 prose-h3:mb-2
                prose-p:leading-relaxed prose-li:leading-relaxed
                prose-a:no-underline hover:prose-a:underline
                prose-blockquote:border-l-2 prose-blockquote:not-italic
                prose-blockquote:px-5 prose-blockquote:py-2
                prose-blockquote:rounded-r-md prose-blockquote:my-6"
              style={{
                ['--tw-prose-body' as string]: 'var(--ink-2)',
                ['--tw-prose-headings' as string]: 'var(--ink)',
                ['--tw-prose-lead' as string]: 'var(--ink-2)',
                ['--tw-prose-links' as string]: 'var(--accent)',
                ['--tw-prose-bold' as string]: 'var(--ink)',
                ['--tw-prose-counters' as string]: 'var(--ink-soft)',
                ['--tw-prose-bullets' as string]: 'var(--ink-soft)',
                ['--tw-prose-hr' as string]: 'var(--rule)',
                ['--tw-prose-quotes' as string]: 'var(--ink)',
                ['--tw-prose-quote-borders' as string]: 'var(--accent)',
                ['--tw-prose-captions' as string]: 'var(--ink-soft)',
                ['--tw-prose-code' as string]: 'var(--ink)',
                ['--tw-prose-pre-code' as string]: 'var(--ink)',
                ['--tw-prose-pre-bg' as string]: 'var(--surface-2)',
                ['--tw-prose-th-borders' as string]: 'var(--rule)',
                ['--tw-prose-td-borders' as string]: 'var(--rule)',
              } as React.CSSProperties}
            >
              <TipTapViewer content={post.content} />
            </div>

            {/* Tags */}
            {post.tags && post.tags.length > 0 && (
              <div className="mb-10 flex flex-wrap gap-2">
                {post.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full px-3 py-1 text-[11px]"
                    style={{
                      background: 'var(--surface)',
                      color: 'var(--ink-2)',
                      border: '1px solid var(--rule)',
                      fontFamily: 'var(--mono)',
                      letterSpacing: '0.04em',
                    }}
                  >
                    #{tag}
                  </span>
                ))}
              </div>
            )}

            {/* Source and Stats */}
            <div
              className="flex flex-wrap items-center justify-between gap-4 pt-6"
              style={{ borderTop: '1px solid var(--rule)' }}
            >
              <a
                href={post.sourceUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-[12px]"
                style={{
                  color: 'var(--accent)',
                  fontFamily: 'var(--mono)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.16em',
                }}
              >
                <span style={{ color: 'var(--ink-soft)' }}>Source:</span>
                <span style={{ fontWeight: 600 }}>{post.source}</span>
              </a>
              <div
                className="flex items-center gap-6"
                style={{
                  color: 'var(--ink-soft)',
                  fontFamily: 'var(--mono)',
                  fontSize: 12,
                }}
              >
                <span className="flex items-center gap-1.5">
                  <Eye className="h-4 w-4" />
                  {post.views.toLocaleString()}
                </span>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleShare}
                  className="gap-1.5"
                  style={{
                    background: 'transparent',
                    color: 'var(--ink-2)',
                    border: '1px solid var(--rule)',
                  }}
                >
                  <Share2 className="h-3.5 w-3.5" />
                  <span>{post.shares.toLocaleString()}</span>
                </Button>
              </div>
            </div>
          </article>
        </div>
      </main>
    </>
  );
} 