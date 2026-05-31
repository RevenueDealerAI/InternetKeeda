'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { ThemeToggle } from './ThemeToggle';
import { NavAccount } from './NavAccount';
import { NavMegaMenu, type MegaMenu } from './NavMegaMenu';

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
        { label: 'AI news', href: '/latest-news', description: 'Releases, launches, big shifts' },
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

const MENU_NEWS: MegaMenu = {
  label: 'News',
  href: '/latest-news',
  columns: [
    {
      title: 'AI news',
      links: [
        { label: 'Latest news', href: '/latest-news', description: 'This week in AI' },
        { label: 'All news', href: '/news', description: 'Full archive' },
        { label: 'Blog', href: '/blog', description: 'Long-form writing from operators' },
      ],
    },
    {
      title: 'Community',
      links: [
        { label: 'Guides', href: '/guides' },
        { label: 'Events', href: '/events' },
        { label: 'Discussions', href: '/discussions' },
        { label: 'FAQ', href: '/faq' },
      ],
    },
  ],
};

const MENUS: MegaMenu[] = [MENU_LAUNCHES, MENU_CATEGORIES, MENU_PRODUCTS, MENU_NEWS];

export function Nav() {
  return (
    <header
      className="fixed left-1/2 top-4 z-50 -translate-x-1/2 px-3"
      style={{ width: 'min(1320px, calc(100% - 24px))' }}
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
        {/* Brand — animated GIF (transparent background, renders on
         * both themes). The single img replaces the previous
         * dark/light PNG pair. Logo grows at each breakpoint and is
         * sized so the right cluster still has breathing room on a
         * 375px viewport (logo 170 + gap 8 + cluster 124 = 302 vs
         * ~307 available). */}
        <Link
          href="/"
          aria-label="Internet Keeda — home"
          className="relative flex h-11 w-[170px] shrink-0 items-center sm:h-14 sm:w-[240px] md:h-16 md:w-[280px]"
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src="/branding/logo-animated.gif"
            alt="Internet Keeda"
            className="block h-full w-auto object-contain"
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

        {/* Right cluster. Submit pill is icon-only on <md, sized to
         * match the ThemeToggle + NavAccount neighbours (40×40) so
         * the three buttons form a visually coherent trio instead
         * of the previous oversized red blob next to two small
         * circles. 40px is still well within touch-target range. */}
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
        </div>
      </nav>
    </header>
  );
}
