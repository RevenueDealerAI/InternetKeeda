import React, { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link'
import { Linkedin, Instagram, Twitter, Youtube, Send, Mail, Github, Facebook } from 'lucide-react';
import { useSiteConfig } from '@/contexts/SiteConfigContext';
import { toast } from 'sonner';
import '../styles/theme-two.css';

export const ThemeTwoFooter: React.FC = () => {
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
  const footerText = config?.footerText || `© ${currentYear} AI Tool Finder. All rights reserved.`;

  // Use site description from config or default
  const siteDescription = config?.siteDescription || 'Discover and compare the best AI tools for your needs.';

  // Use contact email from config or default
  const contactEmail = config?.contactEmail || 'hello@ai-hunt.com';

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
    <footer
      className="theme-two text-white relative"
      style={{
        backgroundImage: "url('/theme-two/images/footer_bg.png')",
        backgroundSize: "cover",
        backgroundPosition: "bottom center",
        backgroundRepeat: "no-repeat",
        backgroundColor: "#000000",
        borderTopLeftRadius: "40px",
        borderTopRightRadius: "40px"
      }}
    >
      {/* Overlay for better readability */}
      <div
        className="absolute inset-0 bg-gradient-to-b from-black/90 to-black/70"
        style={{
          borderTopLeftRadius: "40px",
          borderTopRightRadius: "40px"
        }}
      ></div>

      <div className="relative z-10 max-w-7xl mx-auto py-16 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
          {/* Column 1: Logo and Social Media */}
          <div>
            <div className="flex items-center mb-4">
              {config?.logoDark || config?.logo ? (
                <Image
                  src={config?.logoDark || config?.logo}
                  alt={config?.siteName || "AI Tool Finder"}
                  width={120}
                  height={48}
                  className="h-12 w-auto object-contain"
                  style={{ width: 'auto', height: 'auto' }}
                  unoptimized
                />
              ) : (
                <Image
                  src="/theme-two/logo_footer.png"
                  alt="AI Tool Finder"
                  width={120}
                  height={48}
                  className="h-12 w-auto"
                  style={{ width: 'auto', height: 'auto' }}
                  unoptimized
                />
              )}
            </div>
            <p className="text-gray-300 mb-6">
              {siteDescription}
            </p>
            <div className="flex gap-3">
              {socialLinks.linkedin && (
                <a
                  href={socialLinks.twitter}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:opacity-80 transition-opacity"
                >
                  <Twitter className="h-6 w-6" />
                </a>
              )}
              {socialLinks.facebook && (
                <a
                  href={socialLinks.facebook}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:opacity-80 transition-opacity"
                >
                  <Facebook className="h-6 w-6" />
                </a>
              )}
              {socialLinks.instagram && (
                <a
                  href={socialLinks.instagram}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:opacity-80 transition-opacity"
                >
                  <Instagram className="h-6 w-6" />
                </a>
              )}
              {socialLinks.linkedin && (
                <a
                  href={socialLinks.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:opacity-80 transition-opacity"
                >
                  <Linkedin className="h-6 w-6" />
                </a>
              )}
              {socialLinks.github && (
                <a
                  href={socialLinks.github}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:opacity-80 transition-opacity"
                >
                  <Github className="h-6 w-6" />
                </a>
              )}
              <a
                href={`mailto:${contactEmail}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-white hover:opacity-80 transition-opacity"
              >
                <Mail className="h-6 w-6" />
              </a>
            </div>
          </div>

          {/* Column 2: Products */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-lg" style={{ color: 'white' }}>Products</h4>
            <ul className="space-y-3">
              <li><Link href="/latest-launches" className="text-gray-300 hover:text-white transition-colors">Latest Launches</Link></li>
              <li><Link href="/top-products" className="text-gray-300 hover:text-white transition-colors">Top Products</Link></li>
              <li><Link href="/recently-added" className="text-gray-300 hover:text-white transition-colors">Recently Added</Link></li>
              <li><Link href="/categories" className="text-gray-300 hover:text-white transition-colors">Categories</Link></li>
              <li><Link href="/trending" className="text-gray-300 hover:text-white transition-colors">Trending</Link></li>
            </ul>
          </div>

          {/* Column 3: Resources */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-lg" style={{ color: 'white' }}>Resources</h4>
            <ul className="space-y-3">
              <li><Link href="/blog" className="text-gray-300 hover:text-white transition-colors">Blog</Link></li>
              <li><Link href="/latest-news" className="text-gray-300 hover:text-white transition-colors">Latest News</Link></li>
              <li><Link href="/guides" className="text-gray-300 hover:text-white transition-colors">Guides</Link></li>
              <li><Link href="/advertise" className="text-gray-300 hover:text-white transition-colors">Advertise</Link></li>
            </ul>
          </div>

          {/* Column 4: Newsletter */}
          <div>
            <h4 className="text-white font-semibold mb-4 text-lg" style={{ color: 'white' }}>Stay updated</h4>
            <p className="text-gray-300 mb-4">
              Subscribe to our newsletter for the latest AI tools and news.
            </p>
            <form onSubmit={handleNewsletterSubmit} className="flex gap-2">
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubscribing}
                className="flex-1 px-4 py-3 bg-gray-800 text-white rounded-full border border-gray-700 focus:outline-none focus:border-purple-500 placeholder-gray-400 disabled:opacity-50"
              />
              <button
                type="submit"
                disabled={isSubscribing || !email}
                className="w-12 h-12 bg-gradient-to-r from-[#8039fd] to-[#f5a5ad] flex items-center justify-center hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ borderRadius: '50%', minWidth: '48px', minHeight: '48px' }}
              >
                {isSubscribing ? (
                  <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Send className="h-5 w-5 text-white" />
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Section */}
        <div className="pt-8 border-t border-gray-800">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p className="text-gray-400 text-sm">
              {footerText}
            </p>
            <div className="flex flex-col sm:flex-row items-center gap-4 sm:gap-6">
              <div className="flex gap-6 text-sm">
                <Link href="/terms" className="text-gray-400 hover:text-white transition-colors">Terms</Link>
                <Link href="/privacy" className="text-gray-400 hover:text-white transition-colors">Privacy</Link>
                <Link href="/about" className="text-gray-400 hover:text-white transition-colors">About</Link>
                <Link href="/faq" className="text-gray-400 hover:text-white transition-colors">FAQ</Link>
              </div>
              <p className="text-gray-400 text-sm">
                Powered by{' '}
                <a
                  href="https://www.webbuddy.agency"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-white hover:text-purple-400 transition-colors font-medium"
                >
                  Webbuddy
                </a>
              </p>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};
