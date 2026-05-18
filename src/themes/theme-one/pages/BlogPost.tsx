import { Calendar, Clock, Share2, Bookmark, MessageCircle, ArrowLeft, Heart, ChevronUp, Copy, Twitter, Facebook, Linkedin, Menu, X } from "lucide-react";
import Image from 'next/image';
import { useParams as useNextParams } from 'next/navigation'
import { useContext } from 'react'
import { ParamsContext } from '@/lib/react-router-compat'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Button } from "@/components/ui/button";
import { useState, useEffect, useRef } from "react";
import { toast } from "sonner";
import { useBlogPost } from "@/lib/api/blog";
import { BlogPost } from "@/types/blog";
import { normalizeImageUrl } from '@/utils/imageUrl';

const extractTableOfContents = (content: string) => {
  const headings: { id: string; title: string; }[] = [];
  const regex = /<h[1-2][^>]*>(.*?)<\/h[1-2]>/g;
  let match;

  while ((match = regex.exec(content)) !== null) {
    const title = match[1].replace(/<[^>]+>/g, '').trim();
    const id = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
    headings.push({ id, title });
  }

  return headings;
};

const formatContent = (content: string) => {
  const withIds = content.replace(
    /<h[1-2][^>]*>(.*?)<\/h[1-2]>/g,
    (match, title) => {
      const cleanTitle = title.replace(/<[^>]+>/g, '').trim();
      const id = cleanTitle.toLowerCase().replace(/[^a-z0-9]+/g, '-');
      return match.replace('>', ` id="${id}">`);
    }
  );

  const withNormalizedImages = withIds.replace(
    /<img([^>]*?)src=["']([^"']+)["']([^>]*?)>/g,
    (match, beforeSrc, src, afterSrc) => {
      const normalizedSrc = normalizeImageUrl(src);
      return `<img${beforeSrc}src="${normalizedSrc}"${afterSrc}>`;
    }
  );

  return withNormalizedImages;
};

export default function BlogPostPage() {
  const contextParams = useContext(ParamsContext);
  const nextParams = useNextParams();
  const params = { ...contextParams, ...nextParams } as { slug?: string };
  const { slug  } = params;
  const router = useRouter();
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [showToc, setShowToc] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  
  const { data: post, isLoading, error } = useBlogPost(slug || '');

  useEffect(() => {
    if (error) {
      toast.error("Failed to load blog post");
      router.push('/blog');
    }
  }, [error, router]);

  useEffect(() => {
    if (post && post.status !== 'published') {
      toast.error("This post is not published yet");
      router.push('/blog');
    }
  }, [post, router]);

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 500) {
        setShowScrollTop(true);
      } else {
        setShowScrollTop(false);
      }
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const handleShare = async (platform: 'copy' | 'twitter' | 'facebook' | 'linkedin') => {
    const url = window.location.href;
    const title = post?.title || '';

    switch (platform) {
      case 'copy':
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard');
        break;
      case 'twitter':
        window.open(`https://twitter.com/intent/tweet?url=${encodeURIComponent(url)}&text=${encodeURIComponent(title)}`, '_blank');
        break;
      case 'facebook':
        window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`, '_blank');
        break;
      case 'linkedin':
        window.open(`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(url)}&title=${encodeURIComponent(title)}`, '_blank');
        break;
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-600"></div>
      </div>
    );
  }

  if (!post) {
    return (
      <div className="min-h-screen flex flex-col justify-center items-center">
        <h1 className="text-2xl font-semibold mb-4">Blog Post Not Found</h1>
        <p className="text-gray-600 mb-6">The blog post you're looking for doesn't exist.</p>
        <Button asChild>
          <Link href="/blog">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Blog
          </Link>
        </Button>
      </div>
    );
  }

  const tableOfContents = extractTableOfContents(post.content);
  const formattedContent = formatContent(post.content);
  const heroImageUrl = normalizeImageUrl(post.imageUrl);

  return (
    <div className="min-h-screen bg-white">
      <div className="relative h-[40vh] sm:h-[50vh] md:h-[60vh] bg-gray-900">
        <Image 
          src={heroImageUrl} 
          alt={post.title}
          fill
          className="object-cover opacity-50"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-gray-900/90 to-gray-900/50" />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="container px-4 py-10 sm:py-16 text-center text-white">
            <Link href="/blog"
              className="inline-flex items-center text-white/80 hover:text-white mb-4 sm:mb-6 transition-colors"
            >
              <ArrowLeft className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
              Back to Blog
            </Link>
            <h1 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 max-w-4xl mx-auto">
              {post.title}
            </h1>
            <div className="flex items-center justify-center gap-4 sm:gap-6 text-white/80 text-sm sm:text-base">
              <span className="flex items-center">
                <Calendar className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                {new Date(post.createdAt).toLocaleDateString()}
              </span>
              <span className="flex items-center">
                <Clock className="w-3.5 h-3.5 sm:w-4 sm:h-4 mr-1.5 sm:mr-2" />
                {post.readTime}
              </span>
            </div>
          </div>
        </div>
      </div>

      <div className="container px-4 sm:px-6 py-8 sm:py-12">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 max-w-6xl mx-auto">
          <article className="flex-1 order-2 lg:order-1">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-6 sm:mb-8 pb-6 sm:pb-8 border-b">
              <div className="flex items-center gap-4">
                <div className="relative w-10 h-10 sm:w-12 sm:h-12 rounded-full overflow-hidden">
                  <Image 
                    src={post.author.avatar} 
                    alt={post.author.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div>
                  <div className="font-medium">{post.author.name}</div>
                  <div className="text-xs sm:text-sm text-gray-500">{post.category}</div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleShare('copy')}
                  className="h-8 w-8 sm:h-10 sm:w-10"
                >
                  <Copy className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleShare('twitter')}
                  className="h-8 w-8 sm:h-10 sm:w-10"
                >
                  <Twitter className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleShare('facebook')}
                  className="h-8 w-8 sm:h-10 sm:w-10"
                >
                  <Facebook className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
                <Button 
                  variant="outline" 
                  size="icon"
                  onClick={() => handleShare('linkedin')}
                  className="h-8 w-8 sm:h-10 sm:w-10"
                >
                  <Linkedin className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                </Button>
              </div>
            </div>

            <div className="lg:hidden mb-6 bg-gray-50 rounded-lg p-4">
              <h3 className="font-semibold mb-3 text-sm">Table of Contents</h3>
              <nav className="space-y-2">
                {tableOfContents.map((heading) => (
                  <button
                    key={heading.id}
                    onClick={() => scrollToSection(heading.id)}
                    className="block text-xs sm:text-sm text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    {heading.title}
                  </button>
                ))}
              </nav>
            </div>

            <div 
              ref={contentRef}
              className="prose prose-sm sm:prose-base lg:prose-lg max-w-none prose-headings:scroll-mt-20 prose-a:text-orange-600 prose-img:rounded-lg prose-pre:bg-gray-900 prose-pre:text-gray-100 prose-code:text-orange-600 prose-blockquote:border-l-orange-600"
              dangerouslySetInnerHTML={{ 
                __html: formattedContent
              }}
            />

            <div className="mt-8 sm:mt-12 pt-6 sm:pt-8 border-t">
              <div className="flex flex-wrap gap-2">
                {post.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center px-2.5 py-1 rounded-full text-xs sm:text-sm font-medium bg-orange-100 text-orange-800"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          </article>

          <div className="hidden lg:block w-64 order-1 lg:order-2 relative">
            <div className="sticky top-8">
              <h3 className="font-semibold mb-4">Table of Contents</h3>
              <nav className="space-y-2">
                {tableOfContents.map((heading) => (
                  <button
                    key={heading.id}
                    onClick={() => scrollToSection(heading.id)}
                    className="block text-sm text-gray-600 hover:text-orange-600 transition-colors"
                  >
                    {heading.title}
                  </button>
                ))}
              </nav>
            </div>
          </div>

          <div className="fixed bottom-4 right-4 z-50">
            {showScrollTop && (
              <Button
                variant="outline"
                size="icon"
                className="bg-white shadow-lg h-10 w-10"
                onClick={scrollToTop}
              >
                <ChevronUp className="w-4 h-4" />
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
