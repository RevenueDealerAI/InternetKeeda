'use client';

import { useState, useEffect, useRef, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Wrench,
  FileText,
  Newspaper,
  Users,
  Menu,
  X,
  Send,
  MessageSquare,
  LucideIcon,
  Star,
  User,
  Home,
  LogOut,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  MessageCircle,
  Settings,
  Mail,
  CreditCard,
  Wallet,
  HelpCircle,
  Share2,
  Bot,
  ShieldCheck,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { DemoModeBanner } from '@/components/DemoModeBanner';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { SiteLogo } from '@/themes/theme-one/components/SiteLogo';
import { useUser } from '@clerk/clerk-react';
import { useSignOut } from '@/hooks/useSignOut';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

interface NavigationItem {
  name: string;
  href: string;
  icon: LucideIcon;
}

const navigation: NavigationItem[] = [
  { name: 'Dashboard', href: '/admin', icon: LayoutDashboard },
  { name: 'Tools', href: '/admin/tools', icon: Wrench },
  { name: 'Affiliates', href: '/admin/affiliates', icon: Share2 },
  { name: 'Sponsored Listings', href: '/admin/sponsorships', icon: Star },
  { name: 'Blog', href: '/admin/blog', icon: FileText },
  { name: 'News', href: '/admin/news', icon: Newspaper },
  { name: 'FAQ', href: '/admin/faq', icon: HelpCircle },
  { name: 'Users', href: '/admin/users', icon: Users },
  { name: 'Tool Submissions', href: '/admin/submissions', icon: Send },
  { name: 'Moderation', href: '/admin/moderation', icon: ShieldCheck },
  { name: 'Reviews', href: '/admin/reviews', icon: MessageCircle },
  { name: 'Sales Inquiries', href: '/admin/inquiries', icon: MessageSquare },
  { name: 'Newsletter Subscriptions', href: '/admin/newsletter', icon: Mail },
  { name: 'Payments', href: '/admin/payments', icon: CreditCard },
  { name: 'Subscriptions', href: '/admin/subscriptions', icon: Wallet },
  { name: 'Site Settings', href: '/admin/settings', icon: Settings },
  { name: 'Auto Scraper', href: '/admin/scraper', icon: Bot },
];

interface AdminLayoutProps {
  children: React.ReactNode;
}

// Derives breadcrumb segments from the current path against the
// navigation table. /admin/tools/123 → ["Admin", "Tools", "Edit"].
function useBreadcrumbs(pathname: string): { label: string; href?: string }[] {
  return useMemo(() => {
    const crumbs: { label: string; href?: string }[] = [{ label: 'Admin', href: '/admin' }];
    if (pathname === '/admin' || pathname === '/admin/') return crumbs;

    const match = navigation.find(
      (n) => n.href !== '/admin' && pathname.startsWith(n.href)
    );
    if (match) crumbs.push({ label: match.name, href: match.href });

    // Trailing segment past the matched nav href → "Edit" (or whatever
    // the page sets via title, but lightweight default works for now).
    if (match && pathname.length > match.href.length + 1) {
      crumbs.push({ label: 'Detail' });
    }
    return crumbs;
  }, [pathname]);
}

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPermanentlyCollapsed, setIsPermanentlyCollapsed] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useUser();
  const handleSignOut = useSignOut();
  const breadcrumbs = useBreadcrumbs(pathname);

  useEffect(() => {
    const savedState = localStorage.getItem('adminSidebarCollapsed');
    if (savedState !== null) {
      setIsPermanentlyCollapsed(savedState === 'true');
    }
  }, []);

  useEffect(() => {
    const checkScreenSize = () => {
      const isMobileView = window.innerWidth < 768;
      setIsMobile(isMobileView);
      setSidebarOpen(window.innerWidth >= 768 && !isPermanentlyCollapsed);
    };
    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);
    return () => window.removeEventListener('resize', checkScreenSize);
  }, [isPermanentlyCollapsed]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isMobile &&
        sidebarOpen &&
        sidebarRef.current &&
        !sidebarRef.current.contains(event.target as Node)
      ) {
        setSidebarOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, sidebarOpen]);

  const togglePermanentCollapse = () => {
    const newState = !isPermanentlyCollapsed;
    setIsPermanentlyCollapsed(newState);
    localStorage.setItem('adminSidebarCollapsed', String(newState));
    if (!isMobile) setSidebarOpen(!newState);
  };

  const sidebarWidth = isPermanentlyCollapsed ? 'md:w-[68px]' : 'md:w-[256px]';
  const mainOffset = isMobile
    ? ''
    : isPermanentlyCollapsed
      ? 'md:ml-[68px]'
      : 'md:ml-[256px]';

  return (
    <div className="min-h-screen bg-slate-50">
      <DemoModeBanner />

      {/* Top bar — slim, breadcrumbs left, actions right */}
      <header className="fixed top-0 left-0 right-0 z-[60] h-14 border-b border-slate-200 bg-white/85 backdrop-blur-md">
        <div className="flex h-full items-center justify-between gap-3 px-3 md:px-5">
          <div className="flex items-center gap-2 min-w-0">
            <Button
              variant="keedaGhost"
              size="icon"
              className="md:hidden h-9 w-9 rounded-lg"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open menu"
            >
              <Menu className="h-4 w-4" />
            </Button>

            {/* Breadcrumbs — replace the old "Admin Portal" subtitle */}
            <nav className="flex items-center gap-1.5 text-sm text-slate-500 min-w-0 overflow-hidden">
              {breadcrumbs.map((c, i) => (
                <div key={i} className="flex items-center gap-1.5 min-w-0">
                  {i > 0 && <span className="text-slate-300">/</span>}
                  {c.href ? (
                    <Link
                      href={c.href}
                      className={cn(
                        'hover:text-slate-900 transition-colors duration-200 truncate',
                        i === breadcrumbs.length - 1 && 'text-slate-900 font-medium'
                      )}
                    >
                      {c.label}
                    </Link>
                  ) : (
                    <span className="text-slate-900 font-medium truncate">{c.label}</span>
                  )}
                </div>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-1.5">
            <Button
              variant="keedaGhost"
              size="keedaSm"
              className="hidden md:inline-flex gap-2"
              onClick={() => router.push('/')}
            >
              <Home className="h-3.5 w-3.5" />
              <span>Main site</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 rounded-full border border-slate-200 bg-white pl-2.5 pr-1 py-1 hover:border-slate-300 hover:bg-slate-50 transition-all duration-200">
                  <span className="hidden md:block text-[13px] font-medium text-slate-700 max-w-[110px] truncate">
                    {user?.firstName || user?.emailAddresses?.[0]?.emailAddress?.split('@')[0] || 'Admin'}
                  </span>
                  {user?.imageUrl ? (
                    <div className="relative w-7 h-7 rounded-full overflow-hidden ring-1 ring-white">
                      <Image src={user.imageUrl} alt={user?.fullName || 'User'} fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center ring-1 ring-white">
                      <User className="h-3.5 w-3.5 text-brand-700" />
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent
                align="end"
                className="w-56 mt-2 rounded-xl border border-slate-200 shadow-lg p-1.5 bg-white/95 backdrop-blur-sm"
              >
                <div className="px-2.5 py-2 mb-1 rounded-lg bg-slate-50">
                  <div className="text-[13px] font-semibold text-slate-900 truncate">
                    {user?.fullName || 'Admin'}
                  </div>
                  <div className="text-[11px] text-slate-500 truncate">
                    {user?.emailAddresses?.[0]?.emailAddress}
                  </div>
                </div>
                <DropdownMenuItem
                  onClick={() => router.push('/')}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-slate-700 hover:bg-slate-50 cursor-pointer text-[13px]"
                >
                  <Home className="h-3.5 w-3.5" />
                  <span>Main site</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator className="my-1 bg-slate-100" />
                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer text-[13px]"
                >
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>

      {/* Sidebar — logo top, nav scroll middle, user card pinned bottom */}
      <aside
        ref={sidebarRef}
        className={cn(
          'fixed left-0 top-14 z-50 h-[calc(100vh-3.5rem)] flex flex-col bg-white border-r border-slate-200',
          'transform transition-all duration-200 ease-out',
          isPermanentlyCollapsed ? 'w-[68px]' : 'w-[256px]',
          sidebarWidth,
          sidebarOpen ? 'translate-x-0' : '-translate-x-full',
          'md:translate-x-0'
        )}
      >
        {/* Logo header — taller container so the 56px logo (which
            already contains the "Internet Keeda" wordmark in the
            light PNG) sits with proper breathing room. Collapsed mode
            swaps to the square symbol-only favicon source so the rail
            stays visually balanced. */}
        <div
          className={cn(
            'relative flex items-center border-b border-slate-200',
            isPermanentlyCollapsed ? 'h-20 justify-center' : 'h-20 justify-between px-4 py-3'
          )}
        >
          {!isPermanentlyCollapsed && (
            <Link href="/admin" className="flex items-center" aria-label="Admin home">
              <SiteLogo variant="light" height={56} asLink={false} priority />
            </Link>
          )}
          {isPermanentlyCollapsed && (
            <Link href="/admin" className="flex items-center" aria-label="Admin home">
              <Image
                src="/branding/favicon-source-512.png"
                width={44}
                height={44}
                alt="Internet Keeda"
                priority
                className="rounded-md"
              />
            </Link>
          )}
          <button
            onClick={togglePermanentCollapse}
            className={cn(
              'hidden md:flex items-center justify-center h-7 w-7 rounded-md text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors duration-200',
              isPermanentlyCollapsed && 'absolute top-2 right-2'
            )}
            title={isPermanentlyCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {isPermanentlyCollapsed ? <ChevronRight size={16} /> : <ChevronsLeft size={16} />}
          </button>
          {!isPermanentlyCollapsed && (
            <button
              className="md:hidden flex items-center justify-center h-7 w-7 rounded-md text-slate-500 hover:bg-slate-100"
              onClick={() => setSidebarOpen(false)}
              aria-label="Close menu"
            >
              <X size={16} />
            </button>
          )}
        </div>

        {/* Nav */}
        <ScrollArea className="flex-1 px-2.5 py-3">
          <nav className="space-y-0.5">
            {navigation.map((item) => {
              const isExact = pathname === item.href;
              const isActive =
                isExact ||
                (item.href !== '/admin' && pathname.startsWith(item.href + '/'));
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isPermanentlyCollapsed ? item.name : ''}
                  onClick={() => isMobile && setSidebarOpen(false)}
                  className={cn(
                    'relative flex items-center rounded-lg transition-colors duration-200 ease-out',
                    isPermanentlyCollapsed
                      ? 'justify-center h-10'
                      : 'gap-2.5 px-2.5 py-2 text-[13.5px]',
                    isActive
                      ? 'bg-brand-50 text-brand-700 font-semibold'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                  )}
                >
                  {/* Left-accent bar on active */}
                  {isActive && !isPermanentlyCollapsed && (
                    <span className="absolute left-0 top-1.5 bottom-1.5 w-[3px] rounded-r-full bg-brand-600" />
                  )}
                  <Icon
                    className={cn(
                      'shrink-0 h-4 w-4',
                      isActive ? 'text-brand-600' : 'text-slate-400'
                    )}
                  />
                  {!isPermanentlyCollapsed && (
                    <span className="truncate">{item.name}</span>
                  )}
                </Link>
              );
            })}
          </nav>
        </ScrollArea>

        {/* User card pinned bottom */}
        <div className="border-t border-slate-200 p-2.5">
          {isPermanentlyCollapsed ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="w-full flex items-center justify-center h-10 rounded-lg hover:bg-slate-50 transition-colors">
                  {user?.imageUrl ? (
                    <div className="relative w-7 h-7 rounded-full overflow-hidden ring-1 ring-slate-200">
                      <Image src={user.imageUrl} alt={user?.fullName || 'User'} fill className="object-cover" unoptimized />
                    </div>
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-brand-50 flex items-center justify-center ring-1 ring-slate-200">
                      <User className="h-3.5 w-3.5 text-brand-700" />
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-56 rounded-xl border border-slate-200 shadow-lg p-1.5">
                <DropdownMenuItem onClick={handleSignOut} className="flex items-center gap-2.5 px-2.5 py-1.5 rounded-lg text-red-600 hover:bg-red-50 cursor-pointer text-[13px]">
                  <LogOut className="h-3.5 w-3.5" />
                  <span>Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center gap-2.5 p-2 rounded-lg hover:bg-slate-50 transition-colors duration-200">
              {user?.imageUrl ? (
                <div className="relative w-8 h-8 rounded-full overflow-hidden ring-1 ring-slate-200 shrink-0">
                  <Image src={user.imageUrl} alt={user?.fullName || 'User'} fill className="object-cover" unoptimized />
                </div>
              ) : (
                <div className="w-8 h-8 rounded-full bg-brand-50 flex items-center justify-center ring-1 ring-slate-200 shrink-0">
                  <User className="h-4 w-4 text-brand-700" />
                </div>
              )}
              <div className="flex-1 min-w-0">
                <div className="text-[13px] font-semibold text-slate-900 truncate">
                  {user?.fullName || 'Admin'}
                </div>
                <div className="text-[11px] text-slate-500 truncate">
                  {user?.emailAddresses?.[0]?.emailAddress}
                </div>
              </div>
              <button
                onClick={handleSignOut}
                title="Sign out"
                className="shrink-0 p-1.5 rounded-md text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors duration-200"
              >
                <LogOut className="h-3.5 w-3.5" />
              </button>
            </div>
          )}
        </div>
      </aside>

      {/* Mobile backdrop */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-900/40 backdrop-blur-sm md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Main content */}
      <main
        className={cn(
          'min-h-screen pt-14 transition-[margin] duration-200 ease-out',
          mainOffset
        )}
      >
        <div className="px-3 py-4 sm:px-5 md:px-6 md:py-6 max-w-[1400px] mx-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
