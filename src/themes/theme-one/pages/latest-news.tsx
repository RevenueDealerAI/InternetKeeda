'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, TrendingUp, Filter } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { normalizeImageUrl } from '@/utils/imageUrl';

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

// Sample review articles. Surfaced when the DB has no published
// reviews yet. Once an operator drops real reviews via /admin/news
// the live posts take over and these samples disappear.
//
// IDs use the `sample-` prefix so detail-route lookups for these
// slugs gracefully 404 — clicking through a sample card right now
// lands on the news/[slug] page which will return "not found"
// because no Mongo row exists. Future work: render rich
// markdown for sample reviews from a static map, or seed Mongo.
const SAMPLE_REVIEWS: NewsPost[] = [
  {
    _id: 'sample-claude',
    title: 'Claude Sonnet 4.5 — the reasoning model that doesn\'t overthink',
    slug: 'sample-claude-sonnet-4-5-review',
    excerpt:
      'After two weeks of daily use, Claude Sonnet 4.5 is the first model that ships answers I trust on first read. Here\'s where it wins, where it still misses, and which workflows make the most of it.',
    content: '',
    category: 'Chat models',
    imageUrl: '/branding/logo-dark-red-bg.png',
    author: { name: 'Internet Keeda Editorial', avatar: '/branding/riley.jpg' },
    source: 'Reviewed by Internet Keeda',
    sourceUrl: '/latest-news',
    views: 1247,
    shares: 0,
    createdAt: '2026-05-30T08:00:00.000Z',
    status: 'published',
  },
  {
    _id: 'sample-cursor',
    title: 'Cursor vs Windsurf — which AI IDE actually ships your code',
    slug: 'sample-cursor-vs-windsurf-review',
    excerpt:
      'Both editors promise the future of coding. One delivers; the other still feels like a demo. We ran a 30-day production project in each and benchmarked completion quality, latency, and reliability.',
    content: '',
    category: 'AI coding',
    imageUrl: '/branding/logo-dark-red-bg.png',
    author: { name: 'Internet Keeda Editorial', avatar: '/branding/riley.jpg' },
    source: 'Reviewed by Internet Keeda',
    sourceUrl: '/latest-news',
    views: 982,
    shares: 0,
    createdAt: '2026-05-28T08:00:00.000Z',
    status: 'published',
  },
  {
    _id: 'sample-midjourney',
    title: 'Midjourney v7 — the new defaults make older prompts look broken',
    slug: 'sample-midjourney-v7-review',
    excerpt:
      'v7 changed how prompts read, how aspect ratios behave, and how characters stay consistent across panels. If you\'re still copying v6 prompts you\'re leaving the model running with one hand tied.',
    content: '',
    category: 'Image generation',
    imageUrl: '/branding/logo-dark-red-bg.png',
    author: { name: 'Internet Keeda Editorial', avatar: '/branding/riley.jpg' },
    source: 'Reviewed by Internet Keeda',
    sourceUrl: '/latest-news',
    views: 854,
    shares: 0,
    createdAt: '2026-05-25T08:00:00.000Z',
    status: 'published',
  },
  {
    _id: 'sample-elevenlabs',
    title: 'ElevenLabs v3 — voice cloning that no longer sounds AI',
    slug: 'sample-elevenlabs-v3-review',
    excerpt:
      'The new voice clone fidelity finally crosses the line where casual listeners stop noticing. We tested it across podcasts, video narration, and customer-call IVR — and where it still trips.',
    content: '',
    category: 'AI voice',
    imageUrl: '/branding/logo-dark-red-bg.png',
    author: { name: 'Internet Keeda Editorial', avatar: '/branding/riley.jpg' },
    source: 'Reviewed by Internet Keeda',
    sourceUrl: '/latest-news',
    views: 612,
    shares: 0,
    createdAt: '2026-05-22T08:00:00.000Z',
    status: 'published',
  },
  {
    _id: 'sample-perplexity',
    title: 'Perplexity Pro — when "research mode" actually saves you a tab',
    slug: 'sample-perplexity-pro-review',
    excerpt:
      'Search-with-citations matters when you\'re fact-checking, less so for casual queries. Perplexity Pro is the first paid AI search where the math on the subscription works for everyday users.',
    content: '',
    category: 'AI search',
    imageUrl: '/branding/logo-dark-red-bg.png',
    author: { name: 'Internet Keeda Editorial', avatar: '/branding/riley.jpg' },
    source: 'Reviewed by Internet Keeda',
    sourceUrl: '/latest-news',
    views: 489,
    shares: 0,
    createdAt: '2026-05-20T08:00:00.000Z',
    status: 'published',
  },
  {
    _id: 'sample-notion',
    title: 'Notion AI — the everywhere-assistant nobody asked for, but kept',
    slug: 'sample-notion-ai-review',
    excerpt:
      'Notion shipped AI everywhere in the product. Most of it is noise; a few features genuinely speed up writing. Here\'s what to enable, what to ignore, and whether the $10/user/month is worth it.',
    content: '',
    category: 'Productivity',
    imageUrl: '/branding/logo-dark-red-bg.png',
    author: { name: 'Internet Keeda Editorial', avatar: '/branding/riley.jpg' },
    source: 'Reviewed by Internet Keeda',
    sourceUrl: '/latest-news',
    views: 376,
    shares: 0,
    createdAt: '2026-05-18T08:00:00.000Z',
    status: 'published',
  },
];

export const LatestNews = () => {
  const [posts, setPosts] = useState<NewsPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState('All');

  const fetchPosts = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('/api/news');
      if (!response.ok) throw new Error('Failed to fetch reviews');
      const data = await response.json();
      const published = (data as NewsPost[]).filter(
        (post) => post.status === 'published',
      );
      // Operator can switch to seeded reviews via /admin/news; in the
      // meantime sample reviews keep the page from rendering empty.
      setPosts(published.length > 0 ? published : SAMPLE_REVIEWS);
    } catch (error) {
      console.error('Error fetching reviews:', error);
      toast.error('Failed to load reviews — showing samples.');
      setPosts(SAMPLE_REVIEWS);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchPosts();
  }, []);

  const categories = ['All', ...Array.from(new Set(posts.map((p) => p.category)))];
  const filteredPosts =
    selectedCategory === 'All'
      ? posts
      : posts.filter((p) => p.category === selectedCategory);
  const trendingPosts = [...posts].sort((a, b) => b.views - a.views).slice(0, 2);

  const getImageUrl = (url: string | undefined | null): string => {
    if (!url || url.trim() === '') return '/branding/logo-dark-red-bg.png';
    return normalizeImageUrl(url);
  };
  const getAvatarUrl = (
    avatar: string | undefined | null,
    name: string | undefined | null,
  ): string => {
    if (!avatar || avatar.trim() === '') {
      return `https://ui-avatars.com/api/?name=${encodeURIComponent(name || 'Reviewer')}&background=ff3b3b&color=fff&bold=true`;
    }
    return normalizeImageUrl(avatar);
  };

  return (
    <main
      className="relative"
      style={{
        background: 'var(--bg)',
        color: 'var(--ink)',
        paddingTop: 120,
        paddingBottom: 80,
      }}
    >
      <div className="mx-auto max-w-[1320px] px-7">
        {/* Eyebrow + headline — Nexus chrome to match Pricing / Hero */}
        <div className="mx-auto max-w-[760px] text-center">
          <div
            className="text-[11px] uppercase tracking-[0.3em]"
            style={{ fontFamily: 'var(--mono)', color: 'var(--accent)' }}
          >
            § reviews — ai tools
          </div>
          <h1
            className="m-0 mt-4"
            style={{
              fontFamily: 'var(--sans)',
              fontSize: 'clamp(36px, 5.5vw, 64px)',
              fontWeight: 500,
              lineHeight: 1.02,
              letterSpacing: '-0.03em',
              color: 'var(--ink)',
            }}
          >
            AI tool reviews{' '}
            <span style={{ fontWeight: 600, color: 'var(--accent)' }}>
              by Internet Keeda.
            </span>
          </h1>
          <p
            className="mx-auto mt-5 text-[15px] leading-[1.65]"
            style={{ color: 'var(--ink-2)', maxWidth: 640 }}
          >
            Independent reviews of the AI tools we ship with — real
            workflows, real costs, real failure modes. Not affiliated
            with the tool vendors; not marketing reprints.
          </p>
        </div>

        {/* Filter pills */}
        <div className="mt-10 flex flex-wrap items-center justify-center gap-2">
          {categories.map((category) => {
            const active = selectedCategory === category;
            return (
              <button
                key={category}
                type="button"
                onClick={() => setSelectedCategory(category)}
                className="rounded-full px-3.5 py-1.5 text-[12px] transition-all"
                style={{
                  fontFamily: 'var(--mono)',
                  letterSpacing: '0.06em',
                  textTransform: 'uppercase',
                  background: active ? 'var(--accent)' : 'var(--surface)',
                  color: active ? 'var(--on-accent)' : 'var(--ink-2)',
                  border: `1px solid ${active ? 'transparent' : 'var(--rule)'}`,
                }}
              >
                {category}
              </button>
            );
          })}
        </div>

        {isLoading ? (
          <div className="mt-12 grid gap-6 sm:grid-cols-2">
            {[1, 2].map((n) => (
              <div key={n} className="animate-pulse">
                <div
                  className="aspect-[16/9] rounded-2xl"
                  style={{ background: 'var(--surface-2)' }}
                />
                <div
                  className="mt-4 h-4 w-1/4 rounded"
                  style={{ background: 'var(--surface-2)' }}
                />
                <div
                  className="mt-3 h-7 w-3/4 rounded"
                  style={{ background: 'var(--surface-2)' }}
                />
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Trending — hero pair */}
            {trendingPosts.length > 0 && (
              <div className="mt-12 grid gap-5 sm:grid-cols-2">
                {trendingPosts.map((post) => (
                  <Link
                    key={post._id}
                    href={`/news/${post.slug}`}
                    className="group relative aspect-[16/9] overflow-hidden rounded-2xl"
                    style={{
                      background: 'var(--bg-2)',
                      border: '1px solid var(--rule)',
                      boxShadow: 'var(--shadow-sm)',
                    }}
                  >
                    <Image
                      src={getImageUrl(post.imageUrl)}
                      alt={post.title}
                      fill
                      className="object-cover opacity-90 transition-transform duration-300 group-hover:scale-105 group-hover:opacity-100"
                      unoptimized
                    />
                    <div
                      className="absolute inset-0"
                      style={{
                        background:
                          'linear-gradient(180deg, transparent 30%, rgba(10,10,12,0.85) 100%)',
                      }}
                    />
                    <div className="absolute inset-x-0 bottom-0 z-10 p-5 sm:p-7">
                      <div
                        className="flex flex-wrap items-center gap-3 text-[10px] uppercase tracking-[0.22em]"
                        style={{
                          color: '#fff',
                          fontFamily: 'var(--mono)',
                          opacity: 0.85,
                        }}
                      >
                        <span
                          className="rounded-full px-2.5 py-0.5"
                          style={{
                            background: 'var(--accent)',
                            color: 'var(--on-accent)',
                          }}
                        >
                          Trending review
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <Calendar className="h-3 w-3" />
                          {new Date(post.createdAt).toLocaleDateString()}
                        </span>
                        <span className="inline-flex items-center gap-1.5">
                          <TrendingUp className="h-3 w-3" />
                          {post.views.toLocaleString()} views
                        </span>
                      </div>
                      <h2
                        className="m-0 mt-3 text-[20px] sm:text-[24px] leading-[1.2]"
                        style={{
                          color: '#fff',
                          fontFamily: 'var(--sans)',
                          fontWeight: 500,
                          letterSpacing: '-0.02em',
                        }}
                      >
                        {post.title}
                      </h2>
                    </div>
                  </Link>
                ))}
              </div>
            )}

            {/* Review grid */}
            <div className="mt-10 grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
              {filteredPosts.map((post) => (
                <Link
                  key={post._id}
                  href={`/news/${post.slug}`}
                  className="group flex h-full flex-col overflow-hidden rounded-xl transition-transform hover:-translate-y-1"
                  style={{
                    background: 'var(--bg-2)',
                    border: '1px solid var(--rule)',
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  <div className="relative aspect-[16/9] overflow-hidden">
                    <Image
                      src={getImageUrl(post.imageUrl)}
                      alt={post.title}
                      fill
                      className="object-cover opacity-90 transition-transform duration-200 group-hover:scale-105"
                      unoptimized
                    />
                  </div>
                  <div className="flex flex-1 flex-col p-5">
                    <div
                      className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em]"
                      style={{
                        fontFamily: 'var(--mono)',
                        color: 'var(--ink-soft)',
                      }}
                    >
                      <span style={{ color: 'var(--accent)' }}>
                        {post.category}
                      </span>
                      <span>·</span>
                      <span>{new Date(post.createdAt).toLocaleDateString()}</span>
                    </div>
                    <h3
                      className="m-0 mt-3 text-[18px] leading-[1.25]"
                      style={{
                        color: 'var(--ink)',
                        fontFamily: 'var(--sans)',
                        fontWeight: 500,
                        letterSpacing: '-0.018em',
                      }}
                    >
                      {post.title}
                    </h3>
                    <p
                      className="m-0 mt-3 line-clamp-3 text-[14px] leading-[1.6]"
                      style={{ color: 'var(--ink-2)' }}
                    >
                      {post.excerpt}
                    </p>
                    <div
                      className="mt-5 flex items-center justify-between pt-4"
                      style={{ borderTop: '1px solid var(--rule)' }}
                    >
                      <div className="flex items-center gap-2">
                        <div className="relative h-6 w-6 overflow-hidden rounded-full ring-1 ring-[var(--rule)]">
                          <Image
                            src={getAvatarUrl(post.author?.avatar, post.author?.name)}
                            alt={post.author?.name || 'Reviewer'}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <span
                          className="text-[11px]"
                          style={{
                            color: 'var(--ink-2)',
                            fontFamily: 'var(--mono)',
                          }}
                        >
                          {post.author.name}
                        </span>
                      </div>
                      <span
                        className="inline-flex items-center gap-1 text-[11px]"
                        style={{
                          color: 'var(--ink-soft)',
                          fontFamily: 'var(--mono)',
                        }}
                      >
                        <TrendingUp className="h-3 w-3" />
                        {post.views.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Link>
              ))}
            </div>

            {filteredPosts.length === 0 && (
              <div className="mt-16 flex flex-col items-center justify-center py-12 text-center">
                <div
                  className="mb-4 rounded-full p-6"
                  style={{ background: 'var(--surface-2)' }}
                >
                  <Filter
                    className="h-7 w-7"
                    style={{ color: 'var(--ink-soft)' }}
                  />
                </div>
                <h3
                  className="m-0 text-xl font-semibold"
                  style={{ color: 'var(--ink)' }}
                >
                  No reviews here yet
                </h3>
                <p
                  className="mt-2 max-w-md text-[14px]"
                  style={{ color: 'var(--ink-2)' }}
                >
                  No reviews tagged &ldquo;{selectedCategory}&rdquo;. Try
                  another category or jump back to all reviews.
                </p>
                <Button
                  variant="outline"
                  onClick={() => setSelectedCategory('All')}
                  className="mt-6"
                >
                  View all reviews
                </Button>
              </div>
            )}
          </>
        )}
      </div>
    </main>
  );
};

export default LatestNews;
