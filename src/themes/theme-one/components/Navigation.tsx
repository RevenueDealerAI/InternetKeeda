import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  NavigationMenuContent,
} from "@/components/ui/navigation-menu";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  Sparkles, 
  Plus, 
  User, 
  Settings, 
  Heart, 
  LogOut,
  Menu,
  Search,
  Rocket,
  Newspaper,
  Users,
  Megaphone,
  ChevronDown,
  Zap,
  Star,
  TrendingUp,
  Bell,
  Sparkle,
  X,
  BarChart3,
  CalendarClock,
  Mail,
  Briefcase,
  Target,
  ListTodo,
  PenTool,
  FileText,
  Shield
} from "lucide-react";
import { useState, useEffect } from "react";
import { useClerkSession } from "@/hooks/useClerkSession";
import { AuthModals } from "@/components/AuthModals";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
// SubmitToolModal removed — the "Submit Your Tool" button now navigates
// to /submit-tool, which has its own ClerkRouteWrapper layout. The
// previous in-place modal imported useSubmitTool → useAuth from
// @clerk/clerk-react, which crashed the home page when the modal opened
// (no ClerkProvider in scope).
import { useSiteConfig } from '@/contexts/SiteConfigContext';
import { getUserDisplayName } from '@/lib/utils';
import { useCategories } from '@/hooks/useCategories';
import { SiteLogo } from './SiteLogo';

export const Navigation = () => {
  // Cookie-only session detection — does NOT load @clerk/clerk-react.
  // Public routes (home, category, tool detail) no longer ship Clerk
  // because of this. Users who want to see their email/name/avatar
  // or sign out land on /dashboard, which has its own ClerkProvider
  // in /app/dashboard/layout.tsx and the full Clerk SDK.
  const { isSignedIn } = useClerkSession();
  const router = useRouter();
  const hasNotifications = true;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { config } = useSiteConfig();
  const pathname = usePathname();

  // Phase D Tier 3 — light SaaS theme everywhere. Header is transparent
  // over the hero, switches to white + blur on scroll. No more dark
  // pathname-based variants; the hero is light too.
  const [scrolled, setScrolled] = useState(false);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 12);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  // Lock body scroll while the mobile menu is open so the page underneath
  // doesn't move when the user touch-scrolls inside the panel.
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = prev; };
  }, [isMobileMenuOpen]);

  // ESC closes the menu.
  useEffect(() => {
    if (!isMobileMenuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setIsMobileMenuOpen(false);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMobileMenuOpen]);

  // Solid white on mobile (so the hamburger always reads), translucent
  // backdrop-blur on md and up where the gradient mesh leaking through
  // adds nice atmospheric depth on bigger screens.
  const headerSurface = scrolled
    ? 'bg-white md:bg-white/85 backdrop-blur-md border-b border-gray-100 shadow-[0_1px_0_0_rgba(0,0,0,0.02)]'
    : 'bg-white md:bg-white/60 md:backdrop-blur-sm border-b border-transparent';
  const textPrimary = 'text-gray-900';
  const textNav = 'text-gray-600 hover:text-gray-900';
  const signInBtn = 'border-gray-200 hover:border-gray-300 text-gray-700 h-10';
  const mobileBtnColor = 'text-gray-900';
  const ddSurface = 'bg-white border border-gray-100 rounded-lg shadow-lg';
  const ddTextPrimary = 'text-gray-900';
  const ddTextMuted = 'text-gray-500';
  const ddHover = 'hover:bg-orange-50/50';
  const ddSkeleton = 'bg-gray-100';
  const ddCatHover = 'hover:bg-orange-50/60';
  const ddCatText = 'text-gray-800';
  const ddCatCount = 'text-gray-400';
  void pathname; // pathname retained for future use; no longer needed for theme switching

  // Nav dropdown only shows top 30 — pass limit so the API returns
  // ~12 KB instead of ~227 KB.
  const { data: categoriesData } = useCategories(true, 30);
  const topCategories = (categoriesData?.data ?? []).filter((c) => (c.toolCount ?? 0) > 0);
  const totalCategoryCount = (categoriesData?.data ?? []).filter(
    (c) => (c.toolCount ?? 0) > 0
  ).length;

  // Cookie-detection mode: we don't know admin/email/name without
  // loading the Clerk SDK. Header just shows "signed in" generically;
  // full account UI (sign out, email display, admin link) lives on
  // /dashboard which loads Clerk in its own per-route ClerkProvider.
  const isAdmin = false;
  const userEmail: string | undefined = undefined;

  // Sign-out can't happen here without the Clerk SDK. The
  // Navigation just points the user at /dashboard, which can
  // sign them out cleanly.
  const handleSignOut = () => {
    setIsMobileMenuOpen(false);
    router.push("/dashboard");
  };

  return (
    <>
      {/* Full-bleed header. Surface + text colors theme-switch off pathname
          (dark on home over the hero, light everywhere else). */}
      <div className={`fixed top-0 left-0 right-0 z-[60] transition-colors duration-200 ${headerSurface}`}>
        <div className="mx-auto max-w-screen-2xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-20 py-2.5">
              {/* Logo and main navigation. Logo scales 44 → 52 → 56px
                  across mobile/tablet/desktop; 80px header leaves
                  12 px breathing room above and below at desktop. */}
              <div className="flex items-center gap-8">
                <SiteLogo
                  variant="auto"
                  height={56}
                  heightClass="h-11 md:h-[52px] lg:h-14"
                  priority
                  className="group-hover:scale-[1.03] transition-transform"
                />

                <NavigationMenu className="hidden md:flex">
                  <NavigationMenuList className="space-x-1">
                    {/* Launches */}
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className={`h-10 px-4 bg-transparent ${textNav}`}>
                        Launches
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className={`grid gap-2 p-4 w-[400px] ${ddSurface}`}>
                          <Link href="/latest-launches" className={`group block p-3 rounded-lg ${ddHover}`}>
                            <div className={`text-sm font-medium ${ddTextPrimary}`}>Latest Launches</div>
                            <div className={`text-xs ${ddTextMuted} mt-1`}>New AI tools this week</div>
                          </Link>
                          <Link href="/recently-added" className={`group block p-3 rounded-lg ${ddHover}`}>
                            <div className={`text-sm font-medium ${ddTextPrimary}`}>Recently Added</div>
                            <div className={`text-xs ${ddTextMuted} mt-1`}>Newest tools in the catalog</div>
                          </Link>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    {/* Categories — mega menu with top 30 by tool count */}
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className={`h-10 px-4 bg-transparent ${textNav}`}>
                        Categories
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className={`w-[720px] p-5 ${ddSurface}`}>
                          <div className="flex items-baseline justify-between mb-3 px-1">
                            <div className={`text-xs font-semibold uppercase tracking-wider ${ddTextMuted}`}>
                              Top 30 by catalog size
                            </div>
                            <Link
                              href="/categories"
                              className="text-xs font-medium text-[#DC2626] hover:text-[#EF4444]"
                            >
                              View all{totalCategoryCount ? ` ${totalCategoryCount}` : ''} →
                            </Link>
                          </div>
                          {topCategories.length === 0 ? (
                            <div className="grid grid-cols-3 gap-x-4 gap-y-1.5">
                              {Array.from({ length: 30 }).map((_, i) => (
                                <div key={i} className={`h-6 ${ddSkeleton} rounded animate-pulse`} />
                              ))}
                            </div>
                          ) : (
                            <div className="grid grid-cols-3 gap-x-4 gap-y-1">
                              {topCategories.map((cat) => (
                                <Link
                                  key={cat.slug ?? cat.name}
                                  href={`/category/${cat.slug ?? encodeURIComponent(cat.name.toLowerCase())}`}
                                  className={`group flex items-center justify-between px-2 py-1.5 rounded-md ${ddCatHover} transition-colors`}
                                >
                                  <span className={`text-sm font-medium ${ddCatText} group-hover:text-[#DC2626] truncate`}>
                                    {cat.name}
                                  </span>
                                  <span className={`text-xs ${ddCatCount} group-hover:text-[#DC2626] ml-2 shrink-0`}>
                                    {cat.toolCount}
                                  </span>
                                </Link>
                              ))}
                            </div>
                          )}
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    {/* Products */}
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className={`h-10 px-4 bg-transparent ${textNav}`}>
                        Products
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className={`grid gap-2 p-4 w-[400px] ${ddSurface}`}>
                          <Link href="/top-products" className={`group block p-3 rounded-lg ${ddHover}`}>
                            <div className={`text-sm font-medium ${ddTextPrimary}`}>Top Products</div>
                            <div className={`text-xs ${ddTextMuted} mt-1`}>Most popular AI tools</div>
                          </Link>
                          <Link href="/trending" className={`group block p-3 rounded-lg ${ddHover}`}>
                            <div className={`text-sm font-medium ${ddTextPrimary}`}>Trending</div>
                            <div className={`text-xs ${ddTextMuted} mt-1`}>Most popular right now</div>
                          </Link>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    {/* News */}
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className={`h-10 px-4 bg-transparent ${textNav}`}>
                        News
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className={`grid gap-2 p-4 w-[400px] ${ddSurface}`}>
                          <Link href="/latest-news" className={`group block p-3 rounded-lg ${ddHover}`}>
                            <div className={`text-sm font-medium ${ddTextPrimary}`}>Latest News</div>
                            <div className={`text-xs ${ddTextMuted} mt-1`}>AI industry updates</div>
                          </Link>
                          <Link href="/blog" className={`group block p-3 rounded-lg ${ddHover}`}>
                            <div className={`text-sm font-medium ${ddTextPrimary}`}>Blog</div>
                            <div className={`text-xs ${ddTextMuted} mt-1`}>Insights and guides</div>
                          </Link>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    {/* Advertise */}
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link href="/advertise" className={`inline-flex h-10 px-4 items-center ${textNav}`}>
                          Advertise
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </div>

              {/* Right side actions */}
              <div className="flex items-center space-x-4">
                {/* Submit tool — navigate to /submit-tool (has its own
                  * ClerkRouteWrapper layout). The previous in-place modal
                  * pulled useAuth into the home chunk and crashed on
                  * open. */}
                <Link href="/submit-tool" className="hidden md:flex">
                  <Button className="bg-orange-500 hover:bg-orange-600 text-white h-10 px-4 shadow-[0_6px_20px_-8px_rgba(220,38,38,0.6)]">
                    <Plus className="w-4 h-4 mr-2" />
                    Submit Your Tool
                  </Button>
                </Link>

                {/* Auth chrome. Anonymous: Sign in / Sign up routes
                  * (each has its own ClerkProvider per-route layout).
                  * Signed in: avatar that links to /dashboard, where
                  * the full Clerk SDK is loaded and account actions
                  * (profile, sign-out, admin) live. */}
                {!isSignedIn ? (
                  <div className="hidden md:flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => router.push("/sign-in")}
                      className={signInBtn}
                    >
                      Sign in
                    </Button>
                    <Button
                      onClick={() => router.push("/sign-up")}
                      className="bg-orange-500 hover:bg-orange-600 text-white h-10"
                    >
                      Sign up
                    </Button>
                  </div>
                ) : (
                  <Button
                    variant="ghost"
                    onClick={() => router.push("/dashboard")}
                    aria-label="Account"
                    className="relative rounded-full h-10 w-10 p-0 overflow-hidden"
                  >
                    <Avatar className="h-10 w-10 rounded-full">
                      <AvatarFallback className="bg-orange-100 text-orange-700">
                        <User className="h-5 w-5" />
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                )}

                {/* Mobile search shortcut — opens the existing search
                 * dialog. Wired via a `window` event so the trigger
                 * lives in the nav (small, durable) while the actual
                 * dialog state lives in Index.tsx. */}
                <button
                  type="button"
                  aria-label="Search"
                  onClick={() => {
                    if (typeof window !== 'undefined') {
                      window.dispatchEvent(new Event('ik:open-search'));
                    }
                  }}
                  className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-gray-900 bg-white ring-1 ring-gray-200 shadow-sm hover:bg-gray-50 active:scale-95 transition"
                >
                  <Search className="h-5 w-5" aria-hidden />
                </button>

                {/* Mobile menu trigger — solid pill so it stays visible
                 * even when the gradient mesh would bleed through the
                 * header at scrollY 0. Explicit aria-label + expanded
                 * state for screen readers. */}
                <button
                  type="button"
                  aria-label={isMobileMenuOpen ? 'Close menu' : 'Open menu'}
                  aria-expanded={isMobileMenuOpen}
                  aria-controls="mobile-nav-panel"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                  className="md:hidden inline-flex items-center justify-center w-10 h-10 rounded-lg text-gray-900 bg-white ring-1 ring-gray-200 shadow-sm hover:bg-gray-50 active:scale-95 transition"
                >
                  {isMobileMenuOpen ? (
                    <X className="h-5 w-5" aria-hidden />
                  ) : (
                    <Menu className="h-5 w-5" aria-hidden />
                  )}
                </button>
              </div>
            </div>
          </div>

        {/* Mobile nav panel — z-[80] sits ABOVE the sticky header
         * (z-[60]) AND above the bottom nav (z-[998] but that's outside
         * this fixed inset so layer separately). Solid white bg with
         * NO opacity animation — previously `animate-in slide-in-from-
         * top-5` from tailwindcss-animate carried an implicit opacity
         * 0→1, which let the page content bleed through mid-transition.
         * Now opacity stays at 1 throughout and only translateY runs. */}
        {isMobileMenuOpen && (
          <div
            id="mobile-nav-panel"
            role="dialog"
            aria-modal="true"
            aria-label="Site menu"
            className="md:hidden fixed inset-0 bg-white z-[80] pt-20 mobile-menu-panel"
            style={{ height: "100dvh" }}
          >
            <div className="absolute top-4 right-4 z-10">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
                className="active-scale h-10 w-10 rounded-full hover:bg-gray-100"
                aria-label="Close menu"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>

            <div className="h-full overflow-y-auto pb-32 px-4 pt-2 mobile-scroll-area">
              {/* User profile section — anonymous in the public-route
                * shell. Tapping "Account" routes to /dashboard, which
                * loads Clerk and shows the real account details. */}
              {isSignedIn && (
                <div className="flex items-center space-x-3 py-4 mb-4 border-b">
                  <Avatar className="h-12 w-12">
                    <AvatarFallback className="bg-orange-100 text-orange-700">
                      <User className="h-5 w-5" />
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Link href="/dashboard" className="font-medium text-gray-900">
                      Account
                    </Link>
                    <div className="text-xs text-gray-500">View dashboard</div>
                  </div>
                </div>
              )}
              
              <div className="space-y-1">
                <div className="px-3 mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Discover
                </div>
                <Link 
                  href="/latest-launches"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-900"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Rocket className="h-4 w-4 mr-3 text-gray-500" />
                  Latest Launches
                </Link>
                <Link
                  href="/recently-added"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-900"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <CalendarClock className="h-4 w-4 mr-3 text-gray-500" />
                  Recently Added
                </Link>
                <Link 
                  href="/top-products"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-900"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Star className="h-4 w-4 mr-3 text-gray-500" />
                  Top Products
                </Link>
                <Link 
                  href="/categories"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-900"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <ListTodo className="h-4 w-4 mr-3 text-gray-500" />
                  Categories
                </Link>
                <Link 
                  href="/trending"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-900"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <TrendingUp className="h-4 w-4 mr-3 text-gray-500" />
                  Trending
                </Link>
              </div>
              
              <div className="mt-4 pt-2 space-y-1 border-t border-gray-100">
                <div className="px-3 mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Content
                </div>
                <Link 
                  href="/latest-news"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-900"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Newspaper className="h-4 w-4 mr-3 text-gray-500" />
                  Latest News
                </Link>
                <Link 
                  href="/blog"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-900"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <PenTool className="h-4 w-4 mr-3 text-gray-500" />
                  Blog
                </Link>
                <Link 
                  href="/advertise"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-900"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Megaphone className="h-4 w-4 mr-3 text-gray-500" />
                  Advertise
                </Link>
              </div>
              
              {/* Best Software Mobile Links - Commented out as now available in SoftwareSidebar */}
              {/* 
              <div className="mt-4 pt-2 space-y-1 border-t border-gray-100">
                <div className="px-3 mb-2 text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Best Software
                </div>
                <Link 
                  to="/best-project-management-tools"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-900"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Target className="h-4 w-4 mr-3 text-gray-500" />
                  Project Management Tools
                </Link>
                <Link 
                  to="/best-ai-note-taking-software"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-900"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <FileText className="h-4 w-4 mr-3 text-gray-500" />
                  AI Note-Taking Software
                </Link>
                <Link 
                  to="/best-ai-daily-planning-software"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-900"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Sparkle className="h-4 w-4 mr-3 text-gray-500" />
                  AI Daily Planning Software
                </Link>
                <Link 
                  to="/best-ai-meeting-tools"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-900"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Users className="h-4 w-4 mr-3 text-gray-500" />
                  AI Meeting Tools
                </Link>
                <Link 
                  to="/best-crm-software-for-teams"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-900"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Briefcase className="h-4 w-4 mr-3 text-gray-500" />
                  CRM Software for Teams
                </Link>
                <Link 
                  to="/best-ai-email-management-tools"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-900"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Mail className="h-4 w-4 mr-3 text-gray-500" />
                  AI Email Management Tools
                </Link>
                <Link 
                  to="/best-productivity-tools-for-adhd"
                  className="flex items-center p-3 rounded-lg hover:bg-gray-50 text-sm font-medium text-gray-900"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  <Zap className="h-4 w-4 mr-3 text-gray-500" />
                  Productivity Tools for ADHD
                </Link>
              </div>
              */}

              <div className="mt-6 pt-2 space-y-4 border-t border-gray-100">
                {!isSignedIn ? (
                  <div className="grid grid-cols-2 gap-2 px-3">
                    <Button
                      variant="outline"
                      onClick={() => {
                        router.push("/sign-in");
                        setIsMobileMenuOpen(false);
                      }}
                      className="border-gray-200 hover:border-gray-300 text-gray-700 w-full"
                    >
                      Sign in
                    </Button>
                    <Button
                      onClick={() => {
                        router.push("/sign-up");
                        setIsMobileMenuOpen(false);
                      }}
                      className="bg-orange-500 hover:bg-orange-600 text-white w-full"
                    >
                      Sign up
                    </Button>
                  </div>
                ) : (
                  <div className="space-y-1 px-3">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-gray-900 font-normal p-3 h-auto"
                      onClick={() => {
                        router.push("/dashboard");
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <User className="mr-3 h-4 w-4 text-gray-500" />
                      Dashboard
                    </Button>
                    {/* Account settings + Sign Out + Admin live on
                      * /dashboard where Clerk is loaded. The public
                      * Navigation no longer ships Clerk at all. */}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-[998] h-16 mobile-safe-bottom">
        <div className="grid grid-cols-5 h-full">
          <Link href="/" className="flex flex-col items-center justify-center text-xs font-medium text-gray-600 active-scale">
            <Sparkles className="h-5 w-5 mb-1" />
            <span>Home</span>
          </Link>
          <Link href="/categories" className="flex flex-col items-center justify-center text-xs font-medium text-gray-600 active-scale">
            <ListTodo className="h-5 w-5 mb-1" />
            <span>Categories</span>
          </Link>
          <Link
            href="/submit-tool"
            className="flex flex-col items-center justify-center text-xs font-medium text-orange-600 active-scale"
          >
            <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-full h-12 w-12 flex items-center justify-center -mt-5 shadow-lg shadow-orange-500/30">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <span className="mt-1">Submit</span>
          </Link>
          <Link href="/trending" className="flex flex-col items-center justify-center text-xs font-medium text-gray-600 active-scale">
            <TrendingUp className="h-5 w-5 mb-1" />
            <span>Trending</span>
          </Link>
          <Link href={isSignedIn ? "/dashboard" : "/sign-in"} className="flex flex-col items-center justify-center text-xs font-medium text-gray-600 active-scale">
            <User className="h-5 w-5 mb-1" />
            <span>{isSignedIn ? "Account" : "Sign In"}</span>
          </Link>
        </div>
      </div>

      {/* Add padding to the bottom of the page content to accommodate the bottom nav on mobile */}
      <div className="md:hidden h-16"></div>
    </>
  );
}; 