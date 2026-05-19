import Link from "next/link";
import Image from 'next/image';
import { useRouter } from "next/navigation";
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
import { useState } from "react";
import { useUser, useClerk, SignInButton, SignUpButton } from "@clerk/clerk-react";
import { AuthModals } from "@/components/AuthModals";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { toast } from "sonner";
import { SubmitToolModal } from "./modals/SubmitToolModal";
import { useSiteConfig } from '@/contexts/SiteConfigContext';
import { getUserDisplayName } from '@/lib/utils';

export const Navigation = () => {
  const { user } = useUser();
  const { signOut, openUserProfile } = useClerk();
  const router = useRouter();
  const hasNotifications = true;
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isSubmitModalOpen, setIsSubmitModalOpen] = useState(false);
  const { config } = useSiteConfig();

  // Check if user is admin
  const isAdmin = user?.publicMetadata?.role === 'admin';
  const userEmail = user?.emailAddresses[0]?.emailAddress;

  

  const handleSignOut = async () => {
    await signOut();
    router.push("/");
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <div className="fixed top-0 left-0 right-0 z-[999] px-4 sm:px-6 lg:px-8 pt-4">
        {/* Main navigation */}
        <div className="bg-white shadow-sm border border-gray-100 rounded-xl mx-auto max-w-7xl">
          <div className="container mx-auto px-4 py-3">
            <div className="flex items-center justify-between h-14">
              {/* Logo and main navigation */}
              <div className="flex items-center gap-8">
                <Link 
                  href="/" 
                  className="flex items-center gap-2 text-xl font-semibold text-gray-900"
                >
                  {config?.logo ? (
                    <Image 
                      src={config.logo} 
                      alt={config?.siteName || 'AI Tool Finder'} 
                      width={180}
                      height={40}
                      className="h-10 w-auto object-contain"
                      unoptimized
                    />
                  ) : (
                    <div className="bg-green-500 rounded-lg w-10 h-10 flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                  )}
                  {/* Only show the site name text if logo is not wide or if display name setting is enabled */}
                  {(!config?.logo || (config?.showSiteNameWithLogo !== false)) && (
                    <span className="font-medium">{config?.siteName || 'AI Tool Finder'}</span>
                  )}
                </Link>

                <NavigationMenu className="hidden md:flex">
                  <NavigationMenuList className="space-x-1">
                    {/* Launches */}
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="h-10 px-4 text-gray-600 hover:text-gray-900">
                        Launches
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="grid gap-2 p-4 w-[400px] bg-white">
                          <Link href="/latest-launches" className="group block p-3 rounded-lg hover:bg-gray-50">
                            <div className="text-sm font-medium text-gray-900">Latest Launches</div>
                            <div className="text-xs text-gray-500 mt-1">New AI tools this week</div>
                          </Link>
                          <Link href="/recently-added" className="group block p-3 rounded-lg hover:bg-gray-50">
                            <div className="text-sm font-medium text-gray-900">Recently Added</div>
                            <div className="text-xs text-gray-500 mt-1">Soon to be launched</div>
                          </Link>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    {/* Products */}
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="h-10 px-4 text-gray-600 hover:text-gray-900">
                        Products
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="grid gap-2 p-4 w-[400px] bg-white">
                          <Link href="/top-products" className="group block p-3 rounded-lg hover:bg-gray-50">
                            <div className="text-sm font-medium text-gray-900">Top Products</div>
                            <div className="text-xs text-gray-500 mt-1">Most popular AI tools</div>
                          </Link>
                          <Link href="/categories" className="group block p-3 rounded-lg hover:bg-gray-50">
                            <div className="text-sm font-medium text-gray-900">Categories</div>
                            <div className="text-xs text-gray-500 mt-1">Browse by type</div>
                          </Link>
                          <Link href="/trending" className="group block p-3 rounded-lg hover:bg-gray-50">
                            <div className="text-sm font-medium text-gray-900">Trending</div>
                            <div className="text-xs text-gray-500 mt-1">Most popular right now</div>
                          </Link>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    {/* News */}
                    <NavigationMenuItem>
                      <NavigationMenuTrigger className="h-10 px-4 text-gray-600 hover:text-gray-900">
                        News
                      </NavigationMenuTrigger>
                      <NavigationMenuContent>
                        <div className="grid gap-2 p-4 w-[400px] bg-white">
                          <Link href="/latest-news" className="group block p-3 rounded-lg hover:bg-gray-50">
                            <div className="text-sm font-medium text-gray-900">Latest News</div>
                            <div className="text-xs text-gray-500 mt-1">AI industry updates</div>
                          </Link>
                          <Link href="/blog" className="group block p-3 rounded-lg hover:bg-gray-50">
                            <div className="text-sm font-medium text-gray-900">Blog</div>
                            <div className="text-xs text-gray-500 mt-1">Insights and guides</div>
                          </Link>
                        </div>
                      </NavigationMenuContent>
                    </NavigationMenuItem>

                    {/* Advertise */}
                    <NavigationMenuItem>
                      <NavigationMenuLink asChild>
                        <Link href="/advertise" className="inline-flex h-10 px-4 items-center text-gray-600 hover:text-gray-900">
                          Advertise
                        </Link>
                      </NavigationMenuLink>
                    </NavigationMenuItem>
                  </NavigationMenuList>
                </NavigationMenu>
              </div>

              {/* Right side actions */}
              <div className="flex items-center space-x-4">
                {/* Submit tool button */}
                <Button
                  className="hidden md:flex bg-green-500 hover:bg-green-600 text-white h-10 px-4"
                  onClick={() => setIsSubmitModalOpen(true)}
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Submit Your Tool
                </Button>

                {/* Auth buttons or user menu */}
                {!user ? (
                  <div className="hidden md:flex space-x-2">
                    <Button
                      variant="outline"
                      onClick={() => router.push("/sign-in")}
                      className="border-gray-200 hover:border-gray-300 text-gray-700 h-10"
                    >
                      Sign in
                    </Button>
                    <Button
                      onClick={() => router.push("/sign-up")}
                      className="bg-green-500 hover:bg-green-600 text-white h-10"
                    >
                      Sign up
                    </Button>
                  </div>
                ) : (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button 
                        variant="ghost" 
                        className="relative rounded-full h-10 w-10 p-0 overflow-hidden"
                      >
                        <Avatar className="h-10 w-10 rounded-full">
                          <AvatarImage src={user.imageUrl} alt={getUserDisplayName(user) || "User"} />
                          <AvatarFallback className="bg-green-100 text-green-800">
                            {((user.unsafeMetadata?.displayName as string | undefined)?.charAt(0)) || user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress?.charAt(0)?.toUpperCase() || "U"}
                          </AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56 mt-1">
                      <DropdownMenuLabel>
                        <div className="font-normal">
                          <div className="font-medium text-sm">{getUserDisplayName(user) || "User"}</div>
                          <div className="text-xs text-gray-500 truncate">{user.emailAddresses[0]?.emailAddress}</div>
                        </div>
                      </DropdownMenuLabel>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => router.push("/dashboard")}>
                        <User className="mr-2 h-4 w-4" />
                        <span>Dashboard</span>
                      </DropdownMenuItem>
                      <DropdownMenuItem onClick={() => openUserProfile()}>
                        <Settings className="mr-2 h-4 w-4" />
                        <span>Account settings</span>
                      </DropdownMenuItem>
                      {isAdmin && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => router.push("/admin")}>
                            <Settings className="mr-2 h-4 w-4" />
                            <span>Admin Dashboard</span>
                          </DropdownMenuItem>
                        </>
                      )}
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={handleSignOut}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Sign out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}

                {/* Mobile menu button */}
                <Button
                  variant="ghost"
                  size="icon"
                  className="md:hidden"
                  onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                >
                  {isMobileMenuOpen ? (
                    <X className="h-6 w-6" />
                  ) : (
                    <Menu className="h-6 w-6" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Enhanced Mobile Navigation Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 bg-white z-50 pt-20 pb-20 animate-in slide-in-from-top-5 duration-300">
            <div className="absolute top-4 right-4 z-50">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsMobileMenuOpen(false)}
                className="active-scale"
              >
                <X className="h-6 w-6" />
              </Button>
            </div>
            
            <div className="h-full overflow-y-auto pb-24 px-4 mobile-scroll-area">
              {/* User profile section at the top if logged in */}
              {user && (
                <div className="flex items-center space-x-3 py-4 mb-4 border-b">
                  <Avatar className="h-12 w-12">
                    <AvatarImage src={user.imageUrl} />
                    <AvatarFallback className="bg-green-100 text-green-800">
                      {((user.unsafeMetadata?.displayName as string | undefined)?.charAt(0)) || user.firstName?.charAt(0) || user.emailAddresses[0]?.emailAddress?.charAt(0)?.toUpperCase() || "U"}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <div className="font-medium">{getUserDisplayName(user) || "User"}</div>
                    <div className="text-xs text-gray-500 truncate">{user.emailAddresses[0]?.emailAddress}</div>
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
                {!user ? (
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
                      className="bg-green-500 hover:bg-green-600 text-white w-full"
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
                    <Button
                      variant="outline"
                      className="w-full justify-start text-gray-900 font-normal p-3 h-auto"
                      onClick={() => {
                        openUserProfile();
                        setIsMobileMenuOpen(false);
                      }}
                    >
                      <Settings className="mr-3 h-4 w-4 text-gray-500" />
                      Account settings
                    </Button>
                    {isAdmin && (
                      <Button
                        variant="outline"
                        className="w-full justify-start text-gray-900 font-normal p-3 h-auto"
                        onClick={() => {
                          router.push("/admin");
                          setIsMobileMenuOpen(false);
                        }}
                      >
                        <Shield className="mr-3 h-4 w-4 text-gray-500" />
                        Admin Dashboard
                      </Button>
                    )}
                    <Button
                      variant="outline"
                      className="w-full justify-start text-gray-900 font-normal p-3 h-auto"
                      onClick={handleSignOut}
                    >
                      <LogOut className="mr-3 h-4 w-4 text-gray-500" />
                      Sign out
                    </Button>
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
          <button 
            onClick={() => setIsSubmitModalOpen(true)}
            className="flex flex-col items-center justify-center text-xs font-medium text-green-600 active-scale"
          >
            <div className="bg-green-500 rounded-full h-12 w-12 flex items-center justify-center -mt-5 shadow-md">
              <Plus className="h-6 w-6 text-white" />
            </div>
            <span className="mt-1">Submit</span>
          </button>
          <Link href="/trending" className="flex flex-col items-center justify-center text-xs font-medium text-gray-600 active-scale">
            <TrendingUp className="h-5 w-5 mb-1" />
            <span>Trending</span>
          </Link>
          <Link href={user ? "/dashboard" : "/sign-in"} className="flex flex-col items-center justify-center text-xs font-medium text-gray-600 active-scale">
            <User className="h-5 w-5 mb-1" />
            <span>{user ? "Account" : "Sign In"}</span>
          </Link>
        </div>
      </div>

      {/* Submit Tool Modal */}
      {isSubmitModalOpen && (
        <SubmitToolModal isOpen={isSubmitModalOpen} onOpenChange={setIsSubmitModalOpen} />
      )}
      
      {/* Add padding to the bottom of the page content to accommodate the bottom nav on mobile */}
      <div className="md:hidden h-16"></div>
    </>
  );
}; 