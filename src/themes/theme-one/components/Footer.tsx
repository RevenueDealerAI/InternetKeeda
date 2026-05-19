import { Button } from "@/components/ui/button";
import Link from 'next/link'
import { Input } from "@/components/ui/input";
import { useState } from "react";
import { toast } from "sonner";
import { 
  Sparkles, 
  Twitter, 
  Github, 
  Linkedin, 
  Send,
  ArrowRight,
  Globe,
  MessageSquare,
  Heart,
  Star,
  Zap,
  Shield,
  ChevronRight,
  ArrowUpRight,
  Wand2,
  Sparkle,
  Rocket,
  Gift,
  Lightbulb,
  Flame,
  Mail,
  Facebook,
  Instagram
} from "lucide-react";
import { useSiteConfig } from '@/contexts/SiteConfigContext';

export const Footer = () => {
  const { config } = useSiteConfig();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const currentYear = new Date().getFullYear();
  
  // Use social links from config, if available
  const socialLinks = config?.socialLinks || {
    twitter: '',
    facebook: '',
    instagram: '',
    linkedin: '',
    github: ''
  };
  
  // Use footer text from config or default
  const footerText = config?.footerText || `© ${currentYear} InternetKeeda. All rights reserved.`;

  // Use site description from config or default
  const siteDescription = config?.siteDescription || 'A hand-curated directory of the best AI tools, updated daily.';

  // Use contact email from config or default
  const contactEmail = config?.contactEmail || 'hello@internetkeeda.com';

  // Newsletter subscription handler
  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubscribing) return;

    setIsSubscribing(true);
    
    try {
      const response = await fetch(`/api/newsletter`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          source: 'footer'
        }),
      });

      const data = await response.json();

      if (data.success) {
        toast.success(data.message);
        setEmail('');
      } else {
        toast.error(data.message || 'Failed to subscribe to newsletter');
      }
    } catch (error) {
      console.error('Newsletter subscription error:', error);
      toast.error('An error occurred while subscribing. Please try again.');
    } finally {
      setIsSubscribing(false);
    }
  };

  return (
    <footer className="border-t border-gray-200 bg-white/80 backdrop-blur-sm">
      <div className="container mx-auto px-4 py-12">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
          {/* Column 1 - Brand */}
          <div className="space-y-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="relative">
                <Sparkles className="h-8 w-8 text-[#FF5A1F]" />
                <div className="absolute -top-1 -right-1 w-3 h-3 bg-[#FF7A45] rounded-full animate-pulse" />
              </div>
              <span className="text-xl font-bold bg-gradient-to-r from-[#FF7A45] to-[#FF5A1F] bg-clip-text text-transparent">
                InternetKeeda
              </span>
            </Link>
            <p className="text-sm text-gray-600 leading-relaxed">
              {siteDescription}
            </p>

            <div className="flex items-center gap-4">
              {socialLinks.twitter && (
                <a 
                  href={socialLinks.twitter} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-green-500 transition-colors"
                >
                  <Twitter className="h-5 w-5" />
                </a>
              )}
              {socialLinks.facebook && (
                <a 
                  href={socialLinks.facebook} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-green-500 transition-colors"
                >
                  <Facebook className="h-5 w-5" />
                </a>
              )}
              {socialLinks.instagram && (
                <a 
                  href={socialLinks.instagram} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-green-500 transition-colors"
                >
                  <Instagram className="h-5 w-5" />
                </a>
              )}
              {socialLinks.linkedin && (
                <a 
                  href={socialLinks.linkedin} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-green-500 transition-colors"
                >
                  <Linkedin className="h-5 w-5" />
                </a>
              )}
              {socialLinks.github && (
                <a 
                  href={socialLinks.github} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-gray-500 hover:text-green-500 transition-colors"
                >
                  <Github className="h-5 w-5" />
                </a>
              )}
              <a 
                href={`mailto:${contactEmail}`}
                target="_blank" 
                rel="noopener noreferrer"
                className="text-gray-500 hover:text-green-500 transition-colors"
              >
                <Mail className="h-5 w-5" />
              </a>
            </div>
          </div>

          {/* Column 2 - Products */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Products</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/latest-launches" className="text-sm text-gray-600 hover:text-green-500 transition-colors">
                  Latest Launches
                </Link>
              </li>
              <li>
                <Link href="/top-products" className="text-sm text-gray-600 hover:text-green-500 transition-colors">
                  Top Products
                </Link>
              </li>
              <li>
                <Link href="/recently-added" className="text-sm text-gray-600 hover:text-green-500 transition-colors">
                  Recently Added
                </Link>
              </li>
              <li>
                <Link href="/categories" className="text-sm text-gray-600 hover:text-green-500 transition-colors">
                  Categories
                </Link>
              </li>
              <li>
                <Link href="/trending" className="text-sm text-gray-600 hover:text-green-500 transition-colors">
                  Trending
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 3 - Resources */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Resources</h3>
            <ul className="space-y-3">
              <li>
                <Link href="/blog" className="text-sm text-gray-600 hover:text-green-500 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/latest-news" className="text-sm text-gray-600 hover:text-green-500 transition-colors">
                  Latest News
                </Link>
              </li>
              <li>
                <Link href="/guides" className="text-sm text-gray-600 hover:text-green-500 transition-colors">
                  Guides
                </Link>
              </li>
              <li>
                <Link href="/advertise" className="text-sm text-gray-600 hover:text-green-500 transition-colors">
                  Advertise
                </Link>
              </li>
            </ul>
          </div>

          {/* Column 4 - Newsletter */}
          <div>
            <h3 className="font-medium text-gray-900 mb-4">Stay updated</h3>
            <p className="text-sm text-gray-600 mb-4">
              Subscribe to our newsletter for the latest AI tools and news.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <Input 
                type="email" 
                placeholder="Enter your email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubscribing}
                className="h-10 border-gray-200 focus:border-green-500 flex-1"
              />
              <Button 
                type="submit"
                disabled={isSubscribing || !email}
                className="bg-green-500 hover:bg-green-600 h-10 px-3"
              >
                {isSubscribing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <ArrowRight className="h-4 w-4" />
                )}
              </Button>
            </form>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-12 pt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between gap-4">
            <p className="text-sm text-gray-500">
              {footerText}
            </p>
            <div className="flex gap-6">
              <Link href="/terms" className="text-sm font-medium text-gray-600 hover:text-green-500 transition-colors">
                Terms
              </Link>
              <Link href="/privacy" className="text-sm font-medium text-gray-600 hover:text-green-500 transition-colors">
                Privacy
              </Link>
              <Link href="/about" className="text-sm font-medium text-gray-600 hover:text-green-500 transition-colors">
                About
              </Link>
              <Link href="/faq" className="text-sm font-medium text-gray-600 hover:text-green-500 transition-colors">
                FAQ
              </Link>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}; 