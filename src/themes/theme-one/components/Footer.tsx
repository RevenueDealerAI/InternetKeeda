"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { SiteLogo } from "./SiteLogo";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Twitter,
  Github,
  Linkedin,
  ArrowRight,
  Mail,
  Facebook,
  Instagram,
} from "lucide-react";
import { useSiteConfig } from "@/contexts/SiteConfigContext";

/** Phase D Tier 3 — light footer. Thin orange→violet gradient line at
 * the top, 4 columns (brand + 3 link groups), newsletter signup with
 * gradient CTA, copyright + legal links at bottom. */
export const Footer = () => {
  const { config } = useSiteConfig();
  const [email, setEmail] = useState("");
  const [isSubscribing, setIsSubscribing] = useState(false);
  const currentYear = new Date().getFullYear();

  const socialLinks = config?.socialLinks || {
    twitter: "",
    facebook: "",
    instagram: "",
    linkedin: "",
    github: "",
  };

  const footerText =
    config?.footerText || `© ${currentYear} Internet Keeda. All rights reserved.`;
  const siteDescription =
    config?.siteDescription ||
    "A hand-curated directory of the best AI tools, updated daily.";
  const contactEmail = config?.contactEmail || "hello@internetkeeda.com";

  const handleNewsletterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || isSubscribing) return;
    setIsSubscribing(true);
    try {
      const response = await fetch(`/api/newsletter`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: email.trim(), source: "footer" }),
      });
      const data = await response.json();
      if (data.success) {
        toast.success(data.message);
        setEmail("");
      } else {
        toast.error(data.message || "Failed to subscribe to newsletter");
      }
    } catch (error) {
      console.error("Newsletter subscription error:", error);
      toast.error("An error occurred while subscribing. Please try again.");
    } finally {
      setIsSubscribing(false);
    }
  };

  const social = [
    { href: socialLinks.twitter,   Icon: Twitter,   label: "Twitter" },
    { href: socialLinks.facebook,  Icon: Facebook,  label: "Facebook" },
    { href: socialLinks.instagram, Icon: Instagram, label: "Instagram" },
    { href: socialLinks.linkedin,  Icon: Linkedin,  label: "LinkedIn" },
    { href: socialLinks.github,    Icon: Github,    label: "GitHub" },
  ].filter((s) => !!s.href);

  return (
    <footer className="relative bg-white border-t border-gray-100">
      {/* Thin gradient line at the very top */}
      <div
        aria-hidden
        className="h-px w-full bg-gradient-to-r from-red-600 via-red-800 to-black"
      />

      <div className="container mx-auto px-4 py-14 sm:py-16">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-10">
          {/* Brand + newsletter — wider column */}
          <div className="md:col-span-5 space-y-5">
            <SiteLogo variant="light" height={56} className="group-hover:scale-[1.03] transition-transform" />
            <p className="text-sm text-gray-600 leading-relaxed max-w-md">
              {siteDescription}
            </p>

            <form
              onSubmit={handleNewsletterSubmit}
              className="flex gap-2 max-w-md"
            >
              <Input
                type="email"
                placeholder="you@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={isSubscribing}
                className="h-11 border-gray-200 focus:border-orange-400 focus:ring-2 focus:ring-orange-500/20 flex-1"
              />
              <Button
                type="submit"
                disabled={isSubscribing || !email}
                className="h-11 px-4 bg-gradient-to-r from-orange-500 to-orange-600 hover:from-orange-600 hover:to-orange-700 text-white shadow-[0_8px_24px_-8px_rgba(220,38,38,0.55)]"
              >
                {isSubscribing ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <>
                    Subscribe
                    <ArrowRight className="w-4 h-4 ml-1.5" />
                  </>
                )}
              </Button>
            </form>

            {/* Social row */}
            <div className="flex items-center gap-3 pt-2">
              {social.map(({ href, Icon, label }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="w-9 h-9 inline-flex items-center justify-center rounded-full text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
                >
                  <Icon className="w-4 h-4" />
                </a>
              ))}
              <a
                href={`mailto:${contactEmail}`}
                aria-label="Email"
                className="w-9 h-9 inline-flex items-center justify-center rounded-full text-gray-400 hover:text-orange-600 hover:bg-orange-50 transition-colors"
              >
                <Mail className="w-4 h-4" />
              </a>
            </div>
          </div>

          {/* Link columns */}
          <div className="md:col-span-7 grid grid-cols-2 sm:grid-cols-3 gap-8">
            <FooterColumn
              title="Product"
              links={[
                ["Latest Launches", "/latest-launches"],
                ["Top Products",    "/top-products"],
                ["Recently Added",  "/recently-added"],
                ["Trending",        "/trending"],
                ["Categories",      "/categories"],
              ]}
            />
            <FooterColumn
              title="Company"
              links={[
                ["About",     "/about"],
                ["Blog",      "/blog"],
                ["Latest News","/latest-news"],
                ["Guides",    "/guides"],
                ["Advertise", "/advertise"],
              ]}
            />
            <FooterColumn
              title="Legal"
              links={[
                ["Terms",   "/terms"],
                ["Privacy", "/privacy"],
                ["FAQ",     "/faq"],
              ]}
            />
          </div>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-xs text-gray-500">{footerText}</p>
          <p className="text-xs text-gray-400">
            Made with care in the US · Updated daily
          </p>
        </div>
      </div>
    </footer>
  );
};

function FooterColumn({
  title,
  links,
}: {
  title: string;
  links: [string, string][];
}) {
  return (
    <div>
      <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-900 mb-4">
        {title}
      </h3>
      <ul className="space-y-3">
        {links.map(([label, href]) => (
          <li key={href}>
            <Link
              href={href}
              className="text-sm text-gray-600 hover:text-orange-600 transition-colors"
            >
              {label}
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
