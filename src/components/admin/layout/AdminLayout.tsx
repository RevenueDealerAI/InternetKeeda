'use client';

import { useState, useEffect, useRef } from 'react';
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
  MessageCircle,
  Settings,
  Mail,
  CreditCard,
  Wallet,
  HelpCircle,
  Share2,
  Bot,
  ShieldCheck
} from 'lucide-react';
import { cn } from "@/lib/utils";
import { DemoModeBanner } from '@/components/DemoModeBanner';
import { Button } from "@/components/ui/button";
import { ScrollArea } from "@/components/ui/scroll-area";
import { SiteLogo } from '@/themes/theme-one/components/SiteLogo';
import { useClerk, useUser } from '@clerk/clerk-react';
import { useTheme } from '@/themes/ThemeContext';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

export function AdminLayout({ children }: AdminLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [isPermanentlyCollapsed, setIsPermanentlyCollapsed] = useState(false);
  const sidebarRef = useRef<HTMLElement>(null);
  const pathname = usePathname();
  const router = useRouter();
  const { signOut } = useClerk();
  const { user } = useUser();
  const { currentTheme } = useTheme();
  const isThemeOne = currentTheme?.id === 'theme-one';

  // Theme-aware classes
  const headerBrandBox = isThemeOne ? 'bg-green-500' : 'bg-gradient-to-r from-[#8039fd] to-[#f5a5ad]';
  const avatarBg = isThemeOne ? 'bg-green-100' : 'bg-orange-100';
  const avatarIconText = isThemeOne ? 'text-green-600' : 'text-orange-600';
  const shadowGlow = isThemeOne ? 'shadow-green-500/20' : 'shadow-orange-500/20';
  const titleGradient = isThemeOne ? 'from-green-500 to-green-600' : 'from-[#8039fd] to-[#f5a5ad]';
  const hoverSoft = isThemeOne ? 'hover:bg-green-50' : 'hover:bg-orange-50';
  const activeBg = isThemeOne ? 'bg-green-50 text-green-600' : 'bg-orange-50 text-orange-700';
  const iconActiveBg = isThemeOne ? 'bg-green-100' : 'bg-orange-100';

  // Load sidebar state from localStorage on initial render
  useEffect(() => {
    const savedState = localStorage.getItem('adminSidebarCollapsed');
    if (savedState !== null) {
      setIsPermanentlyCollapsed(savedState === 'true');
    }
  }, []);

  // Handle responsive behavior
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

  // Close sidebar when clicking outside of it on mobile
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobile && sidebarOpen && sidebarRef.current && !sidebarRef.current.contains(event.target as Node)) {
        setSidebarOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isMobile, sidebarOpen]);

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
  };

  // Toggle permanent collapsed state (for desktop)
  const togglePermanentCollapse = () => {
    const newState = !isPermanentlyCollapsed;
    setIsPermanentlyCollapsed(newState);
    localStorage.setItem('adminSidebarCollapsed', String(newState));

    // If we're on desktop, also update the open state
    if (!isMobile) {
      setSidebarOpen(!newState);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Mode Banner */}
      <DemoModeBanner />
      {/* Admin Header - now fixed */}
      <header className="fixed top-0 left-0 right-0 z-[999] border-b bg-white/90 backdrop-blur-md">
        <div className="flex h-16 items-center justify-between pl-4 pr-4 md:pr-8">
          <div className="flex items-center">
            {/* Mobile Sidebar Toggle - Moved here */}
            <Button
              variant="ghost"
              size="icon"
              className="mr-2 md:hidden"
              onClick={() => setSidebarOpen(true)}
              aria-label="Open Menu"
            >
              <Menu className="h-5 w-5" />
            </Button>

            <Link href="/" className="flex items-center">
              {isThemeOne ? (
                <SiteLogo variant="light" height={44} asLink={false} priority />
              ) : (
                <Image
                  src="/theme-two/logo.svg"
                  alt="Internet Keeda"
                  width={120}
                  height={28}
                  className="h-7 w-auto"
                  unoptimized
                />
              )}
            </Link>
            <span className="hidden md:inline-block ml-2 text-sm font-medium text-gray-500">
              Admin Portal
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Sidebar toggle for desktop */}
            <Button
              variant="ghost"
              size="icon"
              className="hidden md:flex mr-2"
              onClick={togglePermanentCollapse}
              title={isPermanentlyCollapsed ? "Expand sidebar" : "Collapse sidebar"}
            >
              {isPermanentlyCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
            </Button>

            <Button
              variant="ghost"
              size="sm"
              className="hidden md:flex items-center gap-2"
              onClick={() => router.push("/")}
            >
              <Home className="h-4 w-4" />
              <span>Main Site</span>
            </Button>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-full border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 outline-none focus:ring-2 focus:ring-orange-100 h-auto">
                  <div className="flex items-center gap-2">
                    <span className="hidden md:block text-sm font-medium text-gray-700 max-w-[100px] truncate ml-2">
                      {user?.fullName || user?.emailAddresses[0]?.emailAddress || "Admin"}
                    </span>
                    <div className="relative">
                      {user?.imageUrl ? (
                        <div className="relative w-8 h-8 rounded-full overflow-hidden ring-2 ring-white">
                          <Image
                            src={user.imageUrl}
                            alt={user?.fullName || "User"}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                      ) : (
                        <div className={`w-8 h-8 rounded-full ${avatarBg} flex items-center justify-center ring-2 ring-white`}>
                          <User className={`h-4 w-4 ${avatarIconText}`} />
                        </div>
                      )}
                    </div>
                  </div>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60 p-2 rounded-2xl shadow-xl border-gray-100 mt-2 bg-white/95 backdrop-blur-sm z-[9999]">
                <div className="px-3 py-3 mb-2 bg-gray-50/50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <div className="relative w-10 h-10 rounded-full overflow-hidden ring-2 ring-white shadow-sm">
                      {user?.imageUrl ? (
                        <Image
                          src={user.imageUrl}
                          alt={user?.fullName || "User"}
                          fill
                          className="object-cover"
                          unoptimized
                        />
                      ) : (
                        <div className={`h-full w-full ${avatarBg} flex items-center justify-center`}>
                          <User className={`h-5 w-5 ${avatarIconText}`} />
                        </div>
                      )}
                    </div>
                    <div className="flex flex-col overflow-hidden">
                      <span className="font-semibold text-sm text-gray-900 truncate">
                        {user?.fullName || "Admin"}
                      </span>
                      <span className="text-xs text-gray-500 truncate">
                        {user?.emailAddresses[0]?.emailAddress}
                      </span>
                    </div>
                  </div>
                </div>

                <DropdownMenuItem
                  onClick={() => router.push("/")}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 focus:text-orange-700 focus:bg-orange-50 cursor-pointer transition-colors mb-1"
                >
                  <Home className="h-4 w-4" />
                  <span className="font-medium text-sm">Return to Main Site</span>
                </DropdownMenuItem>

                <DropdownMenuSeparator className="my-1 bg-gray-100" />

                <DropdownMenuItem
                  onClick={handleSignOut}
                  className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-red-600 focus:text-red-700 focus:bg-red-50 cursor-pointer transition-colors mt-1"
                >
                  <LogOut className="h-4 w-4" />
                  <span className="font-medium text-sm">Sign out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </header>
      {/* Spacer to prevent content from being hidden behind the fixed navbar */}
      <div className="h-16"></div>

      <div className="flex relative">
        {/* Sidebar */}
        <aside
          ref={sidebarRef}
          className={cn(
            "fixed left-0 top-[64px] z-30 h-[calc(100vh-64px)] transform transition-all duration-200 ease-in-out bg-white/95 backdrop-blur-lg shadow-lg border border-gray-200/50",
            shadowGlow,
            isPermanentlyCollapsed
              ? "md:w-[72px]"
              : "w-full xs:w-[280px] sm:w-72 md:top-[84px] md:h-[calc(100vh-100px)]",
            "rounded-none md:rounded-r-2xl",
            sidebarOpen ? "translate-x-0" : "-translate-x-full",
            "md:translate-x-0"
          )}
        >
          <div className={cn(
            "flex items-center justify-between border-b border-gray-200/50",
            isPermanentlyCollapsed
              ? "h-16 md:h-16 px-2"
              : "h-16 md:h-20 px-4 md:px-6"
          )}>
            {!isPermanentlyCollapsed && (
              <h1 className="text-lg md:text-xl font-semibold">
                <span className={isThemeOne ? `bg-gradient-to-r ${titleGradient} bg-clip-text text-transparent` : 'text-orange-600'}>
                  Admin Dashboard
                </span>
              </h1>
            )}
            <div className={cn(
              "flex items-center",
              isPermanentlyCollapsed ? "w-full justify-center" : ""
            )}>
              {/* Toggle button for desktop */}
              <Button
                variant="ghost"
                size="icon"
                className={`${hoverSoft} rounded-xl`}
                onClick={togglePermanentCollapse}
                title={isPermanentlyCollapsed ? "Expand sidebar" : "Collapse sidebar"}
              >
                {isPermanentlyCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </Button>

              {/* Close button for mobile */}
              {!isPermanentlyCollapsed && (
                <Button
                  variant="ghost"
                  className={`md:hidden ${hoverSoft} rounded-xl ml-2`}
                  onClick={() => setSidebarOpen(false)}
                >
                  <X size={20} />
                </Button>
              )}
            </div>
          </div>

          <ScrollArea className={cn(
            "py-4",
            isPermanentlyCollapsed
              ? "h-[calc(100vh-72px-64px)] px-1"
              : "h-[calc(100vh-72px-64px)] md:h-[calc(100vh-100px-80px)] px-4 md:py-6"
          )}>
            <nav className="space-y-1 md:space-y-2">
              {/* Back to main site — surfaces an explicit "leave admin"
                  affordance in the sidebar to match the top-bar one.
                  Visually distinct from the admin nav items below so
                  it doesn't feel like another admin section. */}
              <Link
                href="/"
                title={isPermanentlyCollapsed ? "Back to site" : ""}
                className={cn(
                  "flex items-center transition-all rounded-xl text-gray-500 hover:text-gray-900 hover:bg-gray-50",
                  isPermanentlyCollapsed
                    ? "justify-center py-3 px-2"
                    : "gap-3 md:gap-4 px-3 md:px-4 py-2 md:py-3 text-sm md:text-base"
                )}
                onClick={() => isMobile && setSidebarOpen(false)}
              >
                <div className={cn(
                  "rounded-lg",
                  isPermanentlyCollapsed ? "p-1.5" : "p-1.5 md:p-2",
                )}>
                  <Home className={cn(
                    isPermanentlyCollapsed ? "h-5 w-5" : "h-4 w-4 md:h-5 md:w-5"
                  )} />
                </div>
                {!isPermanentlyCollapsed && <span className="font-medium">Back to site</span>}
              </Link>

              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  title={isPermanentlyCollapsed ? item.name : ""}
                  className={cn(
                    "flex items-center transition-all rounded-xl hover:scale-[1.02]",
                    pathname === item.href
                      ? `${activeBg} font-medium shadow-sm`
                      : "text-gray-600 hover:text-gray-900 hover:bg-gray-50",
                    isPermanentlyCollapsed
                      ? "justify-center py-3 px-2"
                      : "gap-3 md:gap-4 px-3 md:px-4 py-2 md:py-3 text-sm md:text-base"
                  )}
                  onClick={() => isMobile && setSidebarOpen(false)}
                >
                  <div className={cn(
                    "rounded-lg transition-colors",
                    isPermanentlyCollapsed ? "p-1.5" : "p-1.5 md:p-2",
                    pathname === item.href
                      ? iconActiveBg
                      : "group-hover:bg-gray-100"
                  )}>
                    <item.icon className={cn(
                      isPermanentlyCollapsed ? "h-5 w-5" : "h-4 w-4 md:h-5 md:w-5"
                    )} />
                  </div>
                  {!isPermanentlyCollapsed && <span className="font-medium">{item.name}</span>}
                </Link>
              ))}
            </nav>
          </ScrollArea>
        </aside>

        {/* Main Content */}
        <main className={cn(
          "flex-1 min-h-[calc(100vh-72px)] transition-all duration-200 ease-in-out bg-transparent w-full",
          isMobile
            ? ""
            : isPermanentlyCollapsed
              ? "md:ml-[72px]"
              : "md:ml-[280px]"
        )}>
          <div className="w-full pt-14 md:pt-6 px-2 sm:px-4 md:px-6 lg:px-8 pb-6 overflow-y-auto">
            <div className={cn("bg-white/95 backdrop-blur-lg border border-gray-200/50 rounded-xl md:rounded-2xl shadow-lg w-full max-w-7xl mx-auto h-full", shadowGlow)}>
              <div className="px-3 sm:px-4 md:px-6 py-4 h-full overflow-x-auto">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
} 