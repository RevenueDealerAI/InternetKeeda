'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Calendar, TrendingUp, Filter, Star } from 'lucide-react';
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
  /** Sample-review-only: drives the symmetrical card header
   *  (brand name + favicon). Not on the NewsPost Mongo model;
   *  live posts gracefully omit it and fall back to the category
   *  eyebrow + a generic logo plate. */
  toolName?: string;
  toolDomain?: string;
  /** Sample-review-only: 0-5 score with one decimal. Surfaced in
   *  the card header as a star strip. Live posts get a neutral
   *  Editorial-pick badge instead. */
  rating?: number;
}

/**
 * Six hand-written sample reviews of famous AI tools. Surfaced
 * when /api/news returns no published rows so the page reads
 * complete out of the box. Once an operator seeds real reviews
 * via /admin/news the samples disappear.
 *
 * 6 (not 7) reviews — keeps the grid 2x3 on tablet and 3x2 on
 * desktop, which renders symmetrically with no orphan card on
 * the last row.
 *
 * Logos are fetched via Google's favicon proxy. It works against
 * any registered domain and falls back gracefully when blocked.
 */
const SAMPLE_REVIEWS: NewsPost[] = [
  {
    _id: 'sample-claude',
    title: 'Claude Sonnet 4.5 — the reasoning model that ships answers, not lectures',
    slug: 'sample-claude-sonnet-4-5-review',
    excerpt:
      'Two weeks of daily use. Claude Sonnet 4.5 is the first frontier model where I trust the first answer enough to ship it. Coding tasks land more often, refusals are calibrated, and the latency makes it usable in conversation. Where it still misses: long agentic loops and creative writing under tight constraints.',
    content: '',
    category: 'Chat models',
    imageUrl: '',
    author: { name: 'Internet Keeda Editorial', avatar: '/branding/riley.jpg' },
    source: 'Reviewed by Internet Keeda',
    sourceUrl: '/reviews',
    views: 1247,
    shares: 0,
    createdAt: '2026-05-30T08:00:00.000Z',
    status: 'published',
    toolName: 'Claude',
    toolDomain: 'anthropic.com',
    rating: 4.8,
  },
  {
    _id: 'sample-chatgpt',
    title: 'ChatGPT (GPT-5) — the universal entry point, still the most polished',
    slug: 'sample-chatgpt-gpt-5-review',
    excerpt:
      'GPT-5 narrows the gap on reasoning that Claude opened in 4.5, while keeping the smoothest end-user UX of any frontier chat product. Voice mode is uncanny, Custom GPTs are mature, the canvas finally feels production-ready. The $20/mo plan remains the easiest defensible upgrade in AI.',
    content: '',
    category: 'Chat models',
    imageUrl: '',
    author: { name: 'Internet Keeda Editorial', avatar: '/branding/riley.jpg' },
    source: 'Reviewed by Internet Keeda',
    sourceUrl: '/reviews',
    views: 1180,
    shares: 0,
    createdAt: '2026-05-28T08:00:00.000Z',
    status: 'published',
    toolName: 'ChatGPT',
    toolDomain: 'openai.com',
    rating: 4.7,
  },
  {
    _id: 'sample-cursor',
    title: 'Cursor — the AI IDE that finally feels like a teammate, not autocomplete',
    slug: 'sample-cursor-review',
    excerpt:
      'After 30 days of shipping a production Next.js app inside Cursor, the verdict: Composer + Cmd-K + agents form a workflow you cannot get back to vanilla VS Code from. The Tab completions are eerily good. Still hiccups on >5-file refactors and the pricing tier above $20/mo is hard to justify for solo devs.',
    content: '',
    category: 'AI coding',
    imageUrl: '',
    author: { name: 'Internet Keeda Editorial', avatar: '/branding/riley.jpg' },
    source: 'Reviewed by Internet Keeda',
    sourceUrl: '/reviews',
    views: 982,
    shares: 0,
    createdAt: '2026-05-25T08:00:00.000Z',
    status: 'published',
    toolName: 'Cursor',
    toolDomain: 'cursor.com',
    rating: 4.6,
  },
  {
    _id: 'sample-midjourney',
    title: 'Midjourney v7 — character consistency that finally holds across a project',
    slug: 'sample-midjourney-v7-review',
    excerpt:
      'v7 is the first release where keeping a character recognizable across panels, aspect ratios, and lighting changes Just Works. Style references compose cleanly. The web app caught up to Discord. Where v7 still trails: photorealistic hands, text rendering above 8 characters, and any prompt over 60 words.',
    content: '',
    category: 'Image generation',
    imageUrl: '',
    author: { name: 'Internet Keeda Editorial', avatar: '/branding/riley.jpg' },
    source: 'Reviewed by Internet Keeda',
    sourceUrl: '/reviews',
    views: 854,
    shares: 0,
    createdAt: '2026-05-22T08:00:00.000Z',
    status: 'published',
    toolName: 'Midjourney',
    toolDomain: 'midjourney.com',
    rating: 4.5,
  },
  {
    _id: 'sample-perplexity',
    title: 'Perplexity Pro — when "search with citations" actually replaces a tab',
    slug: 'sample-perplexity-pro-review',
    excerpt:
      'Perplexity Pro is the first paid AI-search subscription where the math works for daily use. Comet (the browser) ships agent loops that get research done while you watch. Citations are accurate to the source, not hallucinated. Still weak at very recent breaking news (under 6 hours) and structured data queries.',
    content: '',
    category: 'AI search',
    imageUrl: '',
    author: { name: 'Internet Keeda Editorial', avatar: '/branding/riley.jpg' },
    source: 'Reviewed by Internet Keeda',
    sourceUrl: '/reviews',
    views: 612,
    shares: 0,
    createdAt: '2026-05-20T08:00:00.000Z',
    status: 'published',
    toolName: 'Perplexity',
    toolDomain: 'perplexity.ai',
    rating: 4.4,
  },
  {
    _id: 'sample-elevenlabs',
    title: 'ElevenLabs v3 — voice cloning that crosses the uncanny threshold',
    slug: 'sample-elevenlabs-v3-review',
    excerpt:
      'v3 is the first model where casual listeners stop noticing the clone. We tested it on podcasts, video narration, and a 200-call IVR — fidelity holds in all three. Conversational AI lets you ship a voice agent in a day. Watch for the per-minute pricing on the Creator plan: it adds up fast under real load.',
    content: '',
    category: 'AI voice',
    imageUrl: '',
    author: { name: 'Internet Keeda Editorial', avatar: '/branding/riley.jpg' },
    source: 'Reviewed by Internet Keeda',
    sourceUrl: '/reviews',
    views: 489,
    shares: 0,
    createdAt: '2026-05-18T08:00:00.000Z',
    status: 'published',
    toolName: 'ElevenLabs',
    toolDomain: 'elevenlabs.io',
    rating: 4.6,
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
          <div className="mt-12 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
            {[1, 2, 3, 4, 5, 6].map((n) => (
              <div
                key={n}
                className="h-[400px] animate-pulse rounded-2xl"
                style={{ background: 'var(--surface-2)' }}
              />
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="mt-16 flex flex-col items-center justify-center py-12 text-center">
            <div
              className="mb-4 rounded-full p-6"
              style={{ background: 'var(--surface-2)' }}
            >
              <Filter className="h-7 w-7" style={{ color: 'var(--ink-soft)' }} />
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
        ) : (
          /* Symmetrical 3-col grid. Every card is the same shape and
           * height — header (logo + tool + rating, fixed h-20), body
           * (meta + title clamp-2 + excerpt clamp-3, flex-1 fills),
           * footer (author + views, mt-auto pins to bottom). */
          <div className="mt-12 grid grid-cols-1 gap-6 items-stretch sm:grid-cols-2 lg:grid-cols-3">
            {filteredPosts.map((post) => (
              <ReviewCard
                key={post._id}
                post={post}
                avatarUrl={getAvatarUrl(post.author?.avatar, post.author?.name)}
              />
            ))}
          </div>
        )}
      </div>
    </main>
  );
};

function ReviewCard({
  post,
  avatarUrl,
}: {
  post: NewsPost;
  avatarUrl: string;
}) {
  const logoUrl =
    post.toolDomain
      ? `https://www.google.com/s2/favicons?domain=${post.toolDomain}&sz=128`
      : null;
  return (
    <Link
      href={`/reviews/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-2xl transition-all hover:-translate-y-1"
      style={{
        background: 'var(--bg-2)',
        border: '1px solid var(--rule)',
        boxShadow: 'var(--shadow-sm)',
        minHeight: 420,
      }}
    >
      {/* Header strip — logo + tool name + rating, fixed height
       * so every card aligns even when the title wraps differently. */}
      <div
        className="flex items-center gap-3 px-5 py-4"
        style={{
          background: 'var(--surface)',
          borderBottom: '1px solid var(--rule)',
          height: 76,
        }}
      >
        <div
          className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-xl"
          style={{
            background: '#fff',
            border: '1px solid var(--rule)',
          }}
        >
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={logoUrl}
              alt={`${post.toolName ?? post.category} logo`}
              className="h-8 w-8 object-contain"
              loading="lazy"
            />
          ) : (
            <span
              className="text-[18px] font-bold"
              style={{ color: 'var(--accent)' }}
            >
              {(post.toolName ?? post.category).charAt(0)}
            </span>
          )}
        </div>
        <div className="min-w-0 flex-1">
          <div
            className="truncate text-[14px] font-semibold"
            style={{ color: 'var(--ink)' }}
          >
            {post.toolName ?? post.category}
          </div>
          {typeof post.rating === 'number' && (
            <StarRating value={post.rating} />
          )}
        </div>
      </div>

      {/* Body — meta + title + excerpt. flex-1 makes it fill the
       * remaining vertical space so footers align across cards. */}
      <div className="flex flex-1 flex-col p-5">
        <div
          className="flex items-center gap-3 text-[10px] uppercase tracking-[0.2em]"
          style={{
            fontFamily: 'var(--mono)',
            color: 'var(--ink-soft)',
          }}
        >
          <span style={{ color: 'var(--accent)' }}>{post.category}</span>
          <span>·</span>
          <span className="inline-flex items-center gap-1">
            <Calendar className="h-3 w-3" />
            {new Date(post.createdAt).toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
              year: 'numeric',
            })}
          </span>
        </div>
        <h3
          className="m-0 mt-3 line-clamp-2 text-[17px] leading-[1.3]"
          style={{
            color: 'var(--ink)',
            fontFamily: 'var(--sans)',
            fontWeight: 600,
            letterSpacing: '-0.015em',
            minHeight: 44, // 2 lines × 22px line height
          }}
        >
          {post.title}
        </h3>
        <p
          className="m-0 mt-3 line-clamp-3 text-[13.5px] leading-[1.6]"
          style={{ color: 'var(--ink-2)', minHeight: 65 }}
        >
          {post.excerpt}
        </p>

        {/* Footer — author + views. mt-auto pins to the bottom
         * regardless of body content length. */}
        <div
          className="mt-auto flex items-center justify-between pt-4"
          style={{ borderTop: '1px solid var(--rule)' }}
        >
          <div className="flex items-center gap-2">
            <div
              className="relative h-6 w-6 overflow-hidden rounded-full"
              style={{ border: '1px solid var(--rule)' }}
            >
              <Image
                src={avatarUrl}
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
  );
}

/** Five-star strip with half-star precision. Uses inline SVG fills
 *  rather than overlay tricks so it scales cleanly at any size. */
function StarRating({ value }: { value: number }) {
  const clamped = Math.max(0, Math.min(5, value));
  const full = Math.floor(clamped);
  const hasHalf = clamped - full >= 0.25 && clamped - full < 0.75;
  const filledCount = clamped - full >= 0.75 ? full + 1 : full;
  return (
    <div
      className="mt-1 flex items-center gap-1 text-[11px]"
      style={{ color: 'var(--ink-soft)', fontFamily: 'var(--mono)' }}
    >
      <div className="flex items-center gap-0.5">
        {[0, 1, 2, 3, 4].map((i) => {
          if (i < filledCount) {
            return (
              <Star
                key={i}
                className="h-3 w-3"
                style={{ color: 'var(--accent)', fill: 'var(--accent)' }}
              />
            );
          }
          if (i === filledCount && hasHalf) {
            return (
              <span
                key={i}
                className="relative inline-flex"
                style={{ width: 12, height: 12 }}
              >
                <Star
                  className="absolute inset-0 h-3 w-3"
                  style={{ color: 'var(--rule)' }}
                />
                <span
                  className="absolute inset-0 overflow-hidden"
                  style={{ width: '50%' }}
                >
                  <Star
                    className="h-3 w-3"
                    style={{ color: 'var(--accent)', fill: 'var(--accent)' }}
                  />
                </span>
              </span>
            );
          }
          return (
            <Star
              key={i}
              className="h-3 w-3"
              style={{ color: 'var(--rule)' }}
            />
          );
        })}
      </div>
      <span>{clamped.toFixed(1)}</span>
    </div>
  );
}

export default LatestNews;
