import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import { ChevronDown, ArrowRight, Menu, X, User, LogOut, Settings } from 'lucide-react';
import { useUser, useClerk } from "@clerk/clerk-react";
import { useSiteConfig } from '@/contexts/SiteConfigContext';
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
import { ContactSalesModal } from "./modals/ContactSalesModal";
import { SubmitToolModal } from "./modals/SubmitToolModal";
import { useToast } from "@/components/ui/use-toast";
import { getUserDisplayName } from '@/lib/utils';
import '../styles/theme-two.css';

export const ThemeTwoNavigation: React.FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isContactSalesOpen, setIsContactSalesOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const [openMobileSubmenu, setOpenMobileSubmenu] = useState<string | null>(null);
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const router = useRouter();
  const { toast } = useToast();
  const { config } = useSiteConfig();

  // Check if user is admin
  const isAdmin = user?.publicMetadata?.role === 'admin';

  const toggleMobileSubmenu = (submenu: string) => {
    setOpenMobileSubmenu(openMobileSubmenu === submenu ? null : submenu);
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    setIsMobileMenuOpen(false);
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleTalkToSales = () => {
    if (!user) {
      // Redirect to sign-up if user is not authenticated
      router.push("/sign-up");
      return;
    }
    setIsContactSalesOpen(true);
  };

  const handleSubmitTool = () => {
    if (!user) {
      toast({
        title: "Authentication Required",
        description: "Please log in to submit a new tool",
        variant: "destructive",
      });
      return;
    }
    setIsSubmitModalOpen(true);
  };

  return (
    <>
      <nav
        className="theme-two nav-container fixed top-4 left-0 right-0 z-[60] bg-transparent"
        style={{
          backgroundColor: 'transparent',
          background: 'transparent',
          border: 'none',
          borderBottom: 'none',
          borderTop: 'none',
          borderLeft: 'none',
          borderRight: 'none',
          boxShadow: 'none',
          outline: 'none',
          position: 'fixed',
          top: '16px',
          left: 0,
          right: 0,
          zIndex: 60
        }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8" style={{ border: 'none', borderBottom: 'none', boxShadow: 'none' }}>
          {/* Main Navigation Container - Pill Shaped */}
          <div className="nav-pill" style={{ border: 'none', borderBottom: 'none', boxShadow: 'none' }}>
            {/* Left Section: Logo + Menu Links */}
            <div className="nav-left-section" style={{ border: 'none', borderBottom: 'none', boxShadow: 'none', outline: 'none' }}>
              {/* Logo */}
              <div className="flex items-center">
                <Link href="/" aria-label="Home" className="flex items-center gap-2">
                  {config?.logo ? (
                    <Image
                      src={config.logo}
                      alt={config?.siteName || "AI Tool Finder"}
                      width={180}
                      height={40}
                      className="h-7 w-auto object-contain"
                      style={{ width: 'auto', height: 'auto' }}
                      unoptimized
                    />
                  ) : (
                    <Image
                      src="/theme-two/logo.svg"
                      alt="AI Tool Finder"
                      width={120}
                      height={28}
                      className="h-7 w-auto"
                      style={{ width: 'auto', height: 'auto' }}
                      unoptimized
                    />
                  )}
                  {(!config?.logo || (config?.showSiteNameWithLogo !== false)) && (
                    <span className="font-semibold text-lg text-gray-900 ml-1 hidden sm:block">
                      {config?.siteName || 'AI Tool Finder'}
                    </span>
                  )}
                </Link>
              </div>

              {/* Desktop Navigation Links */}
              <div className="hidden md:flex items-center">
                <NavigationMenu>
                  <NavigationMenuList className="space-x-1">
                    {/* Launches */}
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="h-10 px-4 text-heading hover:text-purple-600 bg-transparent data-[state=open]:bg-gray-50">
                        Launches
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="grid gap-2 p-4 w-[400px] bg-white border border-gray-100 rounded-lg shadow-lg">
                          <Link href="/latest-launches" className="group block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="text-sm font-medium text-gray-900">Latest Launches</div>
                            <div className="text-xs text-gray-500 mt-1">New AI tools this week</div>
                          </Link>
                          <Link href="/recently-added" className="group block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="text-sm font-medium text-gray-900">Recently Added</div>
                            <div className="text-xs text-gray-500 mt-1">Newest tools in the catalog</div>
                          </Link>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    {/* Products */}
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="h-10 px-4 text-heading hover:text-purple-600 bg-transparent data-[state=open]:bg-gray-50">
                        Products
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="grid gap-2 p-4 w-[400px] bg-white border border-gray-100 rounded-lg shadow-lg">
                          <Link href="/top-products" className="group block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="text-sm font-medium text-gray-900">Top Products</div>
                            <div className="text-xs text-gray-500 mt-1">Most popular AI tools</div>
                          </Link>
                          <Link href="/categories" className="group block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="text-sm font-medium text-gray-900">Categories</div>
                            <div className="text-xs text-gray-500 mt-1">Browse by type</div>
                          </Link>
                          <Link href="/trending" className="group block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="text-sm font-medium text-gray-900">Trending</div>
                            <div className="text-xs text-gray-500 mt-1">Most popular right now</div>
                          </Link>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    {/* News */}
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="h-10 px-4 text-heading hover:text-purple-600 bg-transparent data-[state=open]:bg-gray-50">
                        News
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="grid gap-2 p-4 w-[400px] bg-white border border-gray-100 rounded-lg shadow-lg">
                          <Link href="/latest-news" className="group block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="text-sm font-medium text-gray-900">Latest News</div>
                            <div className="text-xs text-gray-500 mt-1">AI industry updates</div>
                          </Link>
                          <Link href="/blog" className="group block p-3 rounded-lg hover:bg-gray-50 transition-colors">
                            <div className="text-sm font-medium text-gray-900">Blog</div>
                            <div className="text-xs text-gray-500 mt-1">Insights and guides</div>
                          </Link>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    {/* Advertise */}
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link href="/advertise" className="inline-flex h-10 px-4 items-center text-heading hover:text-purple-600 transition-colors rounded-md">
                          Advertise
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </div>
            </div>

            {/* Right Section: Action Buttons */}
            <div className="nav-right-section" style={{ border: 'none', borderBottom: 'none', boxShadow: 'none', outline: 'none' }}>
              {/* Mobile Menu Button */}
              <button
                onClick={toggleMobileMenu}
                className="md:hidden p-2 rounded-md text-heading hover:text-purple-600 transition-colors"
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>

              {/* Desktop Action Buttons */}
              <div className="hidden md:flex items-center gap-1">
                <button
                  onClick={handleSubmitTool}
                  className="bg-white border border-gray-300 text-heading hover:bg-gray-50 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                >
                  Submit Your Tools
                </button>

                <div className="h-6 w-px bg-gray-300"></div>

                {/* User Authentication */}
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <button className="flex items-center gap-2 p-1 pl-2 pr-1 rounded-full border border-gray-200 hover:bg-gray-50 hover:border-gray-300 transition-all duration-200 outline-none focus:ring-2 focus:ring-purple-100">
                        <span className="text-sm font-medium text-gray-700 hidden sm:block max-w-[100px] truncate">
                          {getUserDisplayName(user) || "User"}
                        </span>
                        <Avatar className="h-8 w-8 ring-2 ring-white">
                          <AvatarImage src={user.imageUrl} />
                          <AvatarFallback className="bg-purple-100 text-purple-700">
                            {user.fullName?.charAt(0) || user.emailAddresses[0]?.emailAddress?.charAt(0) || 'U'}
                          </AvatarFallback>
                        </Avatar>
                      </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-60 p-2 rounded-2xl shadow-xl border-gray-100 mt-2 bg-white/95 backdrop-blur-sm">
                      <div className="px-3 py-3 mb-2 bg-gray-50/50 rounded-xl">
                        <div className="flex items-center gap-3">
                          <Avatar className="h-10 w-10 ring-2 ring-white shadow-sm">
                            <AvatarImage src={user.imageUrl} />
                            <AvatarFallback className="bg-purple-600 text-white font-medium">
                              {user.fullName?.charAt(0) || user.emailAddresses[0]?.emailAddress?.charAt(0) || 'U'}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex flex-col overflow-hidden">
                            <span className="font-semibold text-sm text-gray-900 truncate">
                              {getUserDisplayName(user) || "User"}
                            </span>
                            <span className="text-xs text-gray-500 truncate">
                              {user.emailAddresses[0]?.emailAddress}
                            </span>
                          </div>
                        </div>
                      </div>

                      <DropdownMenuItem
                        onClick={() => router.push("/dashboard")}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 focus:text-purple-700 focus:bg-purple-50 cursor-pointer transition-colors mb-1"
                      >
                        <User className="h-4 w-4" />
                        <span className="font-medium text-sm">Dashboard</span>
                      </DropdownMenuItem>

                      <DropdownMenuItem
                        onClick={() => openUserProfile()}
                        className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 focus:text-purple-700 focus:bg-purple-50 cursor-pointer transition-colors mb-1"
                      >
                        <Settings className="h-4 w-4" />
                        <span className="font-medium text-sm">Account Settings</span>
                      </DropdownMenuItem>

                      {isAdmin && (
                        <DropdownMenuItem
                          onClick={() => router.push("/admin")}
                          className="flex items-center gap-3 px-3 py-2.5 rounded-xl text-gray-600 focus:text-purple-700 focus:bg-purple-50 cursor-pointer transition-colors mb-1"
                        >
                          <div className="h-4 w-4 flex items-center justify-center">
                            <span className="relative flex h-2 w-2">
                              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                              <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
                            </span>
                          </div>
                          <span className="font-medium text-sm">Admin Dashboard</span>
                        </DropdownMenuItem>
                      )}

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
                ) : (
                  <>
                    <button
                      onClick={() => router.push("/sign-in")}
                      className="bg-white border border-gray-300 text-heading hover:bg-gray-50 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                    >
                      Sign in
                    </button>
                    <button
                      onClick={handleTalkToSales}
                      className="bg-gradient-primary text-white hover:opacity-90 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center shadow-md"
                    >
                      Talk to Sales
                      <div className="ml-2 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                        <ArrowRight className="w-3 h-3 text-white" />
                      </div>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Mobile Menu */}
          {isMobileMenuOpen && (
            <div className="md:hidden mt-4 bg-white rounded-lg shadow-lg p-4">
              <div className="space-y-4">
                {/* Mobile Navigation Links */}
                <div className="space-y-2">
                  {/* Launches */}
                  <div>
                    <button
                      onClick={() => toggleMobileSubmenu('launches')}
                      className="w-full text-left text-heading hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium flex items-center justify-between"
                    >
                      Launches
                      <ChevronDown className={`w-4 h-4 transition-transform ${openMobileSubmenu === 'launches' ? 'rotate-180' : ''}`} />
                    </button>
                    {openMobileSubmenu === 'launches' && (
                      <div className="pl-4 space-y-1 mt-1">
                        <Link href="/latest-launches" className="block text-gray-600 hover:text-purple-600 px-3 py-2 rounded-md text-sm">
                          Latest Launches
                        </Link>
                        <Link href="/recently-added" className="block text-gray-600 hover:text-purple-600 px-3 py-2 rounded-md text-sm">
                          Recently Added
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* Products */}
                  <div>
                    <button
                      onClick={() => toggleMobileSubmenu('products')}
                      className="w-full text-left text-heading hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium flex items-center justify-between"
                    >
                      Products
                      <ChevronDown className={`w-4 h-4 transition-transform ${openMobileSubmenu === 'products' ? 'rotate-180' : ''}`} />
                    </button>
                    {openMobileSubmenu === 'products' && (
                      <div className="pl-4 space-y-1 mt-1">
                        <Link href="/top-products" className="block text-gray-600 hover:text-purple-600 px-3 py-2 rounded-md text-sm">
                          Top Products
                        </Link>
                        <Link href="/categories" className="block text-gray-600 hover:text-purple-600 px-3 py-2 rounded-md text-sm">
                          Categories
                        </Link>
                        <Link href="/trending" className="block text-gray-600 hover:text-purple-600 px-3 py-2 rounded-md text-sm">
                          Trending
                        </Link>
                      </div>
                    )}
                  </div>

                  {/* News */}
                  <div>
                    <button
                      onClick={() => toggleMobileSubmenu('news')}
                      className="w-full text-left text-heading hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium flex items-center justify-between"
                    >
                      News
                      <ChevronDown className={`w-4 h-4 transition-transform ${openMobileSubmenu === 'news' ? 'rotate-180' : ''}`} />
                    </button>
                    {openMobileSubmenu === 'news' && (
                      <div className="pl-4 space-y-1 mt-1">
                        <Link href="/latest-news" className="block text-gray-600 hover:text-purple-600 px-3 py-2 rounded-md text-sm">
                          Latest News
                        </Link>
                        <Link href="/blog" className="block text-gray-600 hover:text-purple-600 px-3 py-2 rounded-md text-sm">
                          Blog
                        </Link>
                      </div>
                    )}
                  </div>

                  <Link href="/advertise" className="block text-heading hover:text-purple-600 px-3 py-2 rounded-md text-sm font-medium">
                    Advertise
                  </Link>
                </div>

                {/* Mobile Action Buttons */}
                <div className="pt-4 border-t border-gray-200 space-y-2">
                  <button
                    onClick={handleSubmitTool}
                    className="w-full bg-white border border-gray-300 text-heading hover:bg-gray-50 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                  >
                    Submit Your Tools
                  </button>

                  {/* Mobile User Authentication */}
                  {user ? (
                    <>
                      <button
                        onClick={() => router.push("/dashboard")}
                        className="w-full bg-white border border-gray-300 text-heading hover:bg-gray-50 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                      >
                        Dashboard
                      </button>
                      <button
                        onClick={() => openUserProfile()}
                        className="w-full bg-white border border-gray-300 text-heading hover:bg-gray-50 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                      >
                        Account Settings
                      </button>
                      {isAdmin && (
                        <button
                          onClick={() => router.push("/admin")}
                          className="w-full bg-white border border-gray-300 text-heading hover:bg-gray-50 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                        >
                          Admin Dashboard
                        </button>
                      )}
                      <button
                        onClick={handleSignOut}
                        className="w-full bg-red-50 border border-red-200 text-red-600 hover:bg-red-100 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                      >
                        Sign Out
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => router.push("/sign-in")}
                        className="w-full bg-white border border-gray-300 text-heading hover:bg-gray-50 px-4 py-2 rounded-full text-sm font-medium transition-colors"
                      >
                        Sign in
                      </button>
                      <button
                        onClick={handleTalkToSales}
                        className="w-full bg-gradient-primary text-white hover:opacity-90 px-4 py-2 rounded-full text-sm font-medium transition-all duration-200 flex items-center justify-center shadow-md"
                      >
                        Talk to Sales
                        <div className="ml-2 w-5 h-5 bg-black rounded-full flex items-center justify-center">
                          <ArrowRight className="w-3 h-3 text-white" />
                        </div>
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </nav>

      {/* Contact Sales Modal */}
      <ContactSalesModal
        isOpen={isContactSalesOpen}
        onOpenChange={setIsContactSalesOpen}
      />

      {/* Submit Tool Modal */}
      <SubmitToolModal
        isOpen={isSubmitModalOpen}
        onOpenChange={setIsSubmitModalOpen}
      />
    </>
  );
};
