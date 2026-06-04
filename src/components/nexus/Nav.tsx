'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { NavAccount } from './NavAccount';
import { NavMegaMenu, type MegaMenu } from './NavMegaMenu';
import { MobileNav } from './MobileNav';

// Mega-menu definitions. Each top-level item with `columns` shows a
// dropdown panel on hover/focus/click. Items without a menu are
// rendered as plain links (no caret).

const MENU_LAUNCHES: MegaMenu = {
  label: 'Launches',
  href: '/latest-launches',
  columns: [
    {
      title: 'By recency',
      links: [
        { label: 'Latest launches', href: '/latest-launches', description: 'Brand-new tools that shipped this week' },
        { label: 'Trending', href: '/trending', description: 'Rising up the catalog by votes + views' },
        { label: 'Recently added', href: '/recently-added', description: 'Most recent submissions to the index' },
      ],
    },
    {
      title: 'By signal',
      links: [
        { label: 'Top products', href: '/top-products', description: 'Highest-rated tools across every category' },
        { label: 'Top categories', href: '/categories', description: 'Browse all curated categories' },
        { label: 'AI reviews', href: '/reviews', description: 'Tools we shipped with, reviewed by Internet Keeda' },
      ],
    },
  ],
  feature: {
    eyebrow: '§ ai keeda',
    title: 'Ask Eli, route the index',
    body: 'Tell our agent what you want to ship. Get the stack back, ranked + cited.',
    cta: { label: 'Open chat', href: '/?try=eli' },
  },
};

const MENU_CATEGORIES: MegaMenu = {
  label: 'Categories',
  href: '/categories',
  columns: [
    {
      title: 'Build',
      links: [
        { label: 'Writing', href: '/category/writing' },
        { label: 'Design', href: '/category/design' },
        { label: 'Code', href: '/category/code' },
        { label: 'Image', href: '/category/image' },
        { label: 'Video', href: '/category/video' },
      ],
    },
    {
      title: 'Think',
      links: [
        { label: 'Research', href: '/category/research' },
        { label: 'Agents', href: '/category/agents' },
        { label: 'Automation', href: '/category/automation' },
        { label: 'Audio', href: '/category/audio' },
        { label: 'Voice', href: '/category/voice' },
      ],
    },
    {
      title: 'Run',
      links: [
        { label: 'Marketing', href: '/category/marketing' },
        { label: '3D', href: '/category/3d' },
        { label: 'Vision', href: '/category/vision' },
        { label: 'All categories', href: '/categories' },
      ],
    },
  ],
};

const MENU_PRODUCTS: MegaMenu = {
  label: 'Products',
  href: '/top-products',
  columns: [
    {
      title: 'Curated lists',
      links: [
        { label: 'Top products', href: '/top-products', description: 'Editor + community picks' },
        { label: 'Best for ADHD', href: '/best-productivity-tools-for-adhd' },
        { label: 'Best meeting tools', href: '/best-ai-meeting-tools' },
        { label: 'Best note-taking', href: '/best-ai-note-taking-software' },
      ],
    },
    {
      title: 'By workflow',
      links: [
        { label: 'Daily planning', href: '/best-ai-daily-planning-software' },
        { label: 'Email management', href: '/best-ai-email-management-tools' },
        { label: 'Project management', href: '/best-project-management-tools' },
        { label: 'CRM for teams', href: '/best-crm-software-for-teams' },
      ],
    },
  ],
};

const MENU_REVIEWS: MegaMenu = {
  label: 'Reviews',
  href: '/reviews',
  columns: [
    {
      title: 'AI tool reviews',
      links: [
        { label: 'Latest reviews', href: '/reviews', description: 'Recent tool reviews by Internet Keeda' },
        { label: 'All reviews', href: '/reviews', description: 'Full review archive' },
        { label: 'Blog', href: '/blog', description: 'Long-form writing from operators' },
      ],
    },
    {
      title: 'Community',
      links: [
        { label: 'Guides', href: '/guides' },
        { label: 'FAQ', href: '/faq' },
      ],
    },
  ],
};

// Keeda Labs — the digital-download store sub-brand. Labelled
// "AI Automation Workflows" in the nav for SEO + clarity. Owned
// by src/features/store; this is the only nav reference.
const MENU_STORE: MegaMenu = {
  label: 'AI Automation Workflows',
  href: '/store',
  columns: [
    {
      title: 'Keeda Labs',
      links: [
        { label: 'Browse workflows', href: '/store', description: 'Hand-built n8n + automation packs' },
        { label: 'My downloads', href: '/store/my-downloads', description: 'Re-download anything you have bought' },
      ],
    },
  ],
};

const MENUS: MegaMenu[] = [MENU_LAUNCHES, MENU_CATEGORIES, MENU_PRODUCTS, MENU_REVIEWS, MENU_STORE];

export function Nav() {
  return (
    <header
      className="fixed left-1/2 top-4 z-50 -translate-x-1/2 px-3"
      // Widened on mobile (12px gutter total instead of 24) so the
      // hamburger has room without overflowing the pill. Desktop
      // keeps the original 24px gutter.
      style={{ width: 'min(1320px, calc(100% - 12px))' }}
    >
      <nav
        className="relative flex items-center justify-between gap-2 rounded-full py-2 pr-2 pl-3 backdrop-blur-2xl md:gap-3 md:pl-4"
        style={{
          background: 'color-mix(in oklab, var(--bg-2) 78%, transparent)',
          border: '1px solid var(--rule)',
          boxShadow: 'var(--shadow-sm)',
        }}
        aria-label="Primary"
      >
        {/* Brand — theme-aware pair so the wordmark stays legible
         * on both palettes. Light theme uses logo-light.png (black
         * "Internet" wordmark, designed for light backgrounds);
         * dark theme uses the animated GIF (white "Internet", on
         * transparent bg, designed for dark backgrounds). CSS
         * swaps visibility via the .ik-logo-light / .ik-logo-dark
         * classes defined in src/index.css. */}
        <Link
          href="/"
          aria-label="Internet Keeda — home"
          className="relative flex h-10 w-[140px] shrink-0 items-center sm:h-14 sm:w-[240px] md:h-16 md:w-[280px]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/branding/logo-light.png"
            alt="Internet Keeda"
            className="ik-logo-light block h-full w-auto object-contain"
            draggable={false}
          />
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/branding/logo-animated.gif"
            alt=""
            aria-hidden="true"
            className="ik-logo-dark absolute left-0 top-1/2 hidden h-full w-auto -translate-y-1/2 object-contain"
            draggable={false}
          />
        </Link>

        {/* Center — mega menus + plain link. Hidden on mobile. */}
        <ul className="hidden list-none items-center gap-0.5 p-0 lg:flex">
          {MENUS.map((menu) => (
            <NavMegaMenu key={menu.label} menu={menu} />
          ))}
          <li className="list-none">
            <Link
              href="/advertise"
              className="inline-flex items-center rounded-full px-3.5 py-2 text-[13px] font-medium transition-colors"
              style={{ color: 'var(--ink-2)' }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--accent)';
                (e.currentTarget as HTMLElement).style.background = 'var(--accent-soft)';
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLElement).style.color = 'var(--ink-2)';
                (e.currentTarget as HTMLElement).style.background = 'transparent';
              }}
            >
              Advertise
            </Link>
          </li>
        </ul>

        {/* Right cluster. Mobile gets a hamburger that opens the
         * same menu items the desktop nav shows (flattened into an
         * accordion sheet); the desktop mega-menus stay hidden on
         * <lg. Submit pill is icon-only on <md, text on md+. */}
        <div className="flex items-center gap-1.5">
          <ThemeToggle />
          <Link
            href="/submit-tool"
            aria-label="Submit your tool"
            className="inline-flex h-10 w-10 items-center justify-center gap-2 rounded-full text-[11px] font-semibold uppercase tracking-[0.16em] transition-transform hover:-translate-y-0.5 md:h-auto md:w-auto md:px-4 md:py-2.5"
            style={{
              background: 'linear-gradient(135deg, var(--accent), var(--accent-2))',
              color: 'var(--on-accent)',
              boxShadow: 'var(--shadow-accent)',
              fontFamily: 'var(--mono)',
            }}
          >
            <Plus className="h-4 w-4 md:h-3.5 md:w-3.5" strokeWidth={2.5} />
            <span className="hidden md:inline">Submit your tool</span>
          </Link>
          <NavAccount />
          <MobileNav menus={MENUS} />
        </div>
      </nav>
    </header>
  );
}
