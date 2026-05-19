import React from 'react';
// import { Routes, Route } from 'react-router-dom'; // Commented out - not compatible with Next.js
import { THEMES, DEFAULT_THEME } from './theme-config';
import { useTheme } from './ThemeContext';

// Theme One Components
import { Navigation as ThemeOneNavigation } from './theme-one/components/Navigation';
import { Footer as ThemeOneFooter } from './theme-one/components/Footer';
import { BackgroundAnimation as ThemeOneBackgroundAnimation } from './theme-one/components/BackgroundAnimation';

// Theme One Pages
import ThemeOneIndex from './theme-one/pages/Index';
import ThemeOneProductDetail from './theme-one/pages/ProductDetail';
import ThemeOneAddProduct from './theme-one/pages/AddProduct';
import { LatestLaunches } from './theme-one/pages/latest-launches';
import { Upcoming } from './theme-one/pages/upcoming';
import { TopProducts } from './theme-one/pages/top-products';
import ThemeOneCategories from './theme-one/pages/categories';
import { LatestNews } from './theme-one/pages/latest-news';
import { NewsDetail } from './theme-one/pages/news/[slug]';
import { NewsIndex } from './theme-one/pages/news/index';
import { Blog } from './theme-one/pages/blog';
import ThemeOneBlogPost from './theme-one/pages/BlogPost';
import { Discussions } from './theme-one/pages/discussions';
import { Events } from './theme-one/pages/events';
import { Advertise } from './theme-one/pages/advertise';
import ThemeOneDashboard from './theme-one/pages/Dashboard';
import ThemeTwoDashboard from './theme-two/pages/Dashboard';
import { AIToolDetail } from './theme-one/pages/AIToolDetail';
import ThemeOneTrendingPage from './theme-one/pages/trending';
import ThemeOneAboutPage from './theme-one/pages/about';
import ThemeOneGuidesPage from './theme-one/pages/guides';
import ThemeOneFAQPage from './theme-one/pages/faq';
import ThemeOnePrivacyPolicyPage from './theme-one/pages/Privacy';
import ThemeOneTermsPage from './theme-one/pages/Terms';
import CategoryPage from './theme-one/pages/category/[id]';
import SoftwarePageDetail from './theme-one/pages/software/[slug]';
import { AdvertiseSuccess } from './theme-one/pages/AdvertiseSuccess';
import { AdvertiseCancel } from './theme-one/pages/AdvertiseCancel';
import { SignInPage as ThemeOneSignInPage } from './theme-one/pages/SignInPage';
import { SignUpPage as ThemeOneSignUpPage } from './theme-one/pages/SignUpPage';

// Admin components (shared across themes)
import { AdminLayout } from '../components/admin/layout/AdminLayout';
import DashboardPage from './theme-one/pages/admin/dashboard/DashboardPage';
// Theme Two Admin Pages
import ThemeTwoAdminDashboardPage from './theme-two/pages/admin/dashboard/DashboardPage';
import ThemeTwoToolsManagementPage from './theme-two/pages/admin/tools/ToolsManagementPage';
import ThemeTwoUsersManagementPage from './theme-two/pages/admin/users/UsersManagementPage';
import ThemeTwoBlogManagementPage from './theme-two/pages/admin/blog/BlogManagementPage';
import ThemeTwoNewsManagementPage from './theme-two/pages/admin/news/NewsManagementPage';
import ThemeTwoSubmissionsManagementPage from './theme-two/pages/admin/submissions/SubmissionsManagementPage';
import ThemeTwoInquiriesManagementPage from './theme-two/pages/admin/inquiries/InquiriesManagementPage';
import ThemeTwoReviewManagementPage from './theme-two/pages/admin/reviews/ReviewManagementPage';
import ThemeTwoNewsletterManagementPage from './theme-two/pages/admin/newsletter/NewsletterManagementPage';
import ThemeTwoAdvertisingPlansPage from './theme-two/pages/admin/advertising/AdvertisingPlansPage';
import ThemeTwoSponsoredListingsManagementPage from './theme-two/pages/admin/sponsorships/SponsoredListingsManagementPage';
import ThemeTwoSoftwarePagesManagementPage from './theme-two/pages/admin/software/SoftwarePagesManagementPage';
import ThemeTwoSiteSettingsPage from './theme-two/pages/admin/settings/SiteSettingsPage';
import ThemeTwoPaymentSettingsPage from './theme-two/pages/admin/settings/PaymentSettingsPage';
import { AdminProtectedRoute } from '../components/admin/auth/AdminProtectedRoute';
import ToolsManagementPage from './theme-one/pages/admin/tools/ToolsManagementPage';
import UsersManagementPage from './theme-one/pages/admin/users/UsersManagementPage';
import BlogManagementPage from './theme-one/pages/admin/blog/BlogManagementPage';
import NewsManagementPage from './theme-one/pages/admin/news/NewsManagementPage';
import SubmissionsManagementPage from './theme-one/pages/admin/submissions/SubmissionsManagementPage';
import InquiriesManagementPage from './theme-one/pages/admin/inquiries/InquiriesManagementPage';
import ReviewManagementPage from './theme-one/pages/admin/reviews/ReviewManagementPage';
import NewsletterManagementPage from './theme-one/pages/admin/newsletter/NewsletterManagementPage';
import AdvertisingPlansPage from './theme-one/pages/admin/advertising/AdvertisingPlansPage';
import SponsoredListingsManagementPage from './theme-one/pages/admin/sponsorships/SponsoredListingsManagementPage';
import SoftwarePagesManagementPage from './theme-one/pages/admin/software/SoftwarePagesManagementPage';
import SiteSettingsPage from './theme-one/pages/admin/settings/SiteSettingsPage';
import PaymentSettingsPage from './theme-one/pages/admin/settings/PaymentSettingsPage';

// Theme Two Components
import { ThemeTwoExample } from './theme-two/components/ThemeTwoComponents';
import { ThemeTwoNavigation } from './theme-two/components/ThemeTwoNavigation';
import { ThemeTwoFooter } from './theme-two/components/ThemeTwoFooter';
import { ThemeTwoBackgroundAnimation } from './theme-two/components/ThemeTwoBackgroundAnimation';
import { ThemeTwoHomePage } from './theme-two/pages/ThemeTwoHomePage';
import { SignInPage } from './theme-two/pages/SignInPage';
import { SignUpPage } from './theme-two/pages/SignUpPage';
import { LatestLaunches as ThemeTwoLatestLaunches } from './theme-two/pages/latest-launches';
import { AIToolDetail as ThemeTwoAIToolDetail } from './theme-two/pages/AIToolDetail';
import { Upcoming as ThemeTwoUpcoming } from './theme-two/pages/upcoming';
import { TopProducts as ThemeTwoTopProducts } from './theme-two/pages/top-products';
import CategoriesPage from './theme-two/pages/categories';
import ThemeTwoCategoryPage from './theme-two/pages/category/[id]';
import TrendingPage from './theme-two/pages/trending';
import AboutPage from './theme-two/pages/about';
import GuidesPage from './theme-two/pages/guides';
import FAQPage from './theme-two/pages/faq';
import PrivacyPolicyPage from './theme-two/pages/Privacy';
import TermsPage from './theme-two/pages/Terms';
import { LatestNews as ThemeTwoLatestNews } from './theme-two/pages/latest-news';
import { NewsDetail as ThemeTwoNewsDetail } from './theme-two/pages/news/[slug]';
import { Blog as ThemeTwoBlog } from './theme-two/pages/blog';
import ThemeTwoBlogPost from './theme-two/pages/BlogPost';
import { Discussions as ThemeTwoDiscussions } from './theme-two/pages/discussions';
import { Events as ThemeTwoEvents } from './theme-two/pages/events';
import { Advertise as ThemeTwoAdvertise } from './theme-two/pages/advertise';

// Best Software Pages - Theme Two
import BestProjectManagementTools from './theme-two/pages/best-project-management-tools';
import BestAINoteTakingSoftware from './theme-two/pages/best-ai-note-taking-software';
import BestAIDailyPlanningSoftware from './theme-two/pages/best-ai-daily-planning-software';
import BestAIMeetingTools from './theme-two/pages/best-ai-meeting-tools';
import BestCRMSoftwareForTeams from './theme-two/pages/best-crm-software-for-teams';
import BestAIEmailManagementTools from './theme-two/pages/best-ai-email-management-tools';
import BestProductivityToolsForADHD from './theme-two/pages/best-productivity-tools-for-adhd';

interface ThemeRouterProps {
  isAdminRoute: boolean;
}

export const ThemeRouter: React.FC<ThemeRouterProps> = ({ isAdminRoute }) => {
  const { currentTheme, isLoading } = useTheme();

  console.log('ThemeRouter: currentTheme', currentTheme);
  console.log('ThemeRouter: isLoading', isLoading);

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading theme...</p>
        </div>
      </div>
    );
  }

  // Ensure we have a valid theme with a path
  const safeTheme = currentTheme && currentTheme.path ? currentTheme : THEMES.find(t => t.id === DEFAULT_THEME) || THEMES[0];
  console.log('ThemeRouter: safeTheme', safeTheme);

  // Show Theme One components only if Theme One is active
  const shouldShowThemeOne = safeTheme.id === 'theme-one';

  return (
    <>
      {/* Theme-specific Navigation and Background */}
      {!isAdminRoute && shouldShowThemeOne && <ThemeOneNavigation />}
      {!isAdminRoute && shouldShowThemeOne && <ThemeOneBackgroundAnimation />}
      
      {!isAdminRoute && !shouldShowThemeOne && <ThemeTwoNavigation />}
      {!isAdminRoute && !shouldShowThemeOne && <ThemeTwoBackgroundAnimation />}
      
      {/* Routes commented out - Next.js uses file-based routing */}
      {/* <Routes>
        Admin Routes - Theme specific
        <Route element={<AdminProtectedRoute />}>
          {shouldShowThemeOne ? (
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<DashboardPage />} />
              <Route path="tools" element={<ToolsManagementPage />} />
              <Route path="sponsorships" element={<SponsoredListingsManagementPage />} />
              <Route path="blog" element={<BlogManagementPage />} />
              <Route path="news" element={<NewsManagementPage />} />
              <Route path="users" element={<UsersManagementPage />} />
              <Route path="submissions" element={<SubmissionsManagementPage />} />
              <Route path="reviews" element={<ReviewManagementPage />} />
              <Route path="inquiries" element={<InquiriesManagementPage />} />
              <Route path="newsletter" element={<NewsletterManagementPage />} />
              <Route path="advertising-plans" element={<AdvertisingPlansPage />} />
              <Route path="settings" element={<SiteSettingsPage />} />
              <Route path="payment-settings" element={<PaymentSettingsPage />} />
            </Route>
          ) : (
            <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<ThemeTwoAdminDashboardPage />} />
              <Route path="tools" element={<ThemeTwoToolsManagementPage />} />
              <Route path="sponsorships" element={<ThemeTwoSponsoredListingsManagementPage />} />
              <Route path="blog" element={<ThemeTwoBlogManagementPage />} />
              <Route path="news" element={<ThemeTwoNewsManagementPage />} />
              <Route path="users" element={<ThemeTwoUsersManagementPage />} />
              <Route path="submissions" element={<ThemeTwoSubmissionsManagementPage />} />
              <Route path="reviews" element={<ThemeTwoReviewManagementPage />} />
              <Route path="inquiries" element={<ThemeTwoInquiriesManagementPage />} />
              <Route path="newsletter" element={<ThemeTwoNewsletterManagementPage />} />
              <Route path="advertising-plans" element={<ThemeTwoAdvertisingPlansPage />} />
              <Route path="settings" element={<ThemeTwoSiteSettingsPage />} />
              <Route path="payment-settings" element={<ThemeTwoPaymentSettingsPage />} />
            </Route>
          )}
        </Route>

        Default Routes - Theme One at root (no prefix) - Only when Theme One is active
        {shouldShowThemeOne && (
          <>
            <Route path="/" element={<ThemeOneIndex />} />
            <Route path="/guides" element={<ThemeOneGuidesPage />} />
            <Route path="/faq" element={<ThemeOneFAQPage />} />
            <Route path="/privacy" element={<ThemeOnePrivacyPolicyPage />} />
            <Route path="/terms" element={<ThemeOneTermsPage />} />
            <Route path="/product/:id" element={<ThemeOneProductDetail />} />
            <Route path="/add-product" element={<ThemeOneAddProduct />} />
            <Route path="/latest-launches" element={<LatestLaunches />} />
            <Route path="/recently-added" element={<Upcoming />} />
            <Route path="/top-products" element={<TopProducts />} />
            <Route path="/categories" element={<ThemeOneCategories />} />
            <Route path="/category/:id" element={<CategoryPage />} />
            <Route path="/latest-news" element={<LatestNews />} />
            <Route path="/latest-news/:slug" element={<NewsDetail />} />
            <Route path="/news" element={<NewsIndex />} />
            <Route path="/news/:slug" element={<NewsDetail />} />
            <Route path="/blog" element={<Blog />} />
            <Route path="/blog/:slug" element={<ThemeOneBlogPost />} />
            <Route path="/discussions" element={<Discussions />} />
            <Route path="/events" element={<Events />} />
            <Route path="/advertise" element={<Advertise />} />
            <Route path="/dashboard" element={<ThemeOneDashboard />} />
            <Route path="/ai-tools/:slug" element={<AIToolDetail />} />
            <Route path="/ai-tool/:id" element={<AIToolDetail />} />
            <Route path="/trending" element={<ThemeOneTrendingPage />} />
            <Route path="/about" element={<ThemeOneAboutPage />} />
            <Route path="/software/:slug" element={<SoftwarePageDetail />} />
            <Route path="/advertise-success" element={<AdvertiseSuccess />} />
            <Route path="/advertise-cancel" element={<AdvertiseCancel />} />
            <Route path="/sign-in" element={<ThemeOneSignInPage />} />
            <Route path="/sign-up" element={<ThemeOneSignUpPage />} />

            Best Software Pages - Default Theme One
            <Route path="/best-project-management-tools" element={<BestProjectManagementTools />} />
            <Route path="/best-ai-note-taking-software" element={<BestAINoteTakingSoftware />} />
            <Route path="/best-ai-daily-planning-software" element={<BestAIDailyPlanningSoftware />} />
            <Route path="/best-ai-meeting-tools" element={<BestAIMeetingTools />} />
            <Route path="/best-crm-software-for-teams" element={<BestCRMSoftwareForTeams />} />
            <Route path="/best-ai-email-management-tools" element={<BestAIEmailManagementTools />} />
            <Route path="/best-productivity-tools-for-adhd" element={<BestProductivityToolsForADHD />} />
          </>
        )}

        Theme-specific Routes - Only when admin selects different theme
        {safeTheme.id !== 'theme-one' && (
          <>
            <Route path={safeTheme.path} element={<Navigate to={`${safeTheme.path}/`} replace />} />
            <Route path={`${safeTheme.path}/`} element={<ThemeOneIndex />} />
            <Route path={`${safeTheme.path}/guides`} element={<ThemeOneGuidesPage />} />
            <Route path={`${safeTheme.path}/faq`} element={<ThemeOneFAQPage />} />
            <Route path={`${safeTheme.path}/privacy`} element={<ThemeOnePrivacyPolicyPage />} />
            <Route path={`${safeTheme.path}/terms`} element={<ThemeOneTermsPage />} />
            <Route path={`${safeTheme.path}/product/:id`} element={<ThemeOneProductDetail />} />
            <Route path={`${safeTheme.path}/add-product`} element={<ThemeOneAddProduct />} />
            <Route path={`${safeTheme.path}/latest-launches`} element={<LatestLaunches />} />
            <Route path={`${safeTheme.path}/recently-added`} element={<Upcoming />} />
            <Route path={`${safeTheme.path}/top-products`} element={<TopProducts />} />
            <Route path={`${safeTheme.path}/categories`} element={<ThemeOneCategories />} />
            <Route path={`${safeTheme.path}/category/:id`} element={<CategoryPage />} />
            <Route path={`${safeTheme.path}/latest-news`} element={<LatestNews />} />
            <Route path={`${safeTheme.path}/latest-news/:slug`} element={<NewsDetail />} />
            <Route path={`${safeTheme.path}/news`} element={<NewsIndex />} />
            <Route path={`${safeTheme.path}/news/:slug`} element={<NewsDetail />} />
            <Route path={`${safeTheme.path}/blog`} element={<Blog />} />
            <Route path={`${safeTheme.path}/blog/:slug`} element={<ThemeOneBlogPost />} />
            <Route path={`${safeTheme.path}/discussions`} element={<Discussions />} />
            <Route path={`${safeTheme.path}/events`} element={<Events />} />
            <Route path={`${safeTheme.path}/advertise`} element={<Advertise />} />
            <Route path={`${safeTheme.path}/dashboard`} element={<ThemeTwoDashboard />} />
            <Route path={`${safeTheme.path}/ai-tools/:slug`} element={<AIToolDetail />} />
            <Route path={`${safeTheme.path}/ai-tool/:id`} element={<AIToolDetail />} />
            <Route path={`${safeTheme.path}/trending`} element={<ThemeOneTrendingPage />} />
            <Route path={`${safeTheme.path}/about`} element={<ThemeOneAboutPage />} />
            <Route path={`${safeTheme.path}/software/:slug`} element={<SoftwarePageDetail />} />
            <Route path={`${safeTheme.path}/advertise-success`} element={<AdvertiseSuccess />} />
            <Route path={`${safeTheme.path}/advertise-cancel`} element={<AdvertiseCancel />} />
            <Route path={`${safeTheme.path}/best-project-management-tools`} element={<BestProjectManagementTools />} />
            <Route path={`${safeTheme.path}/best-ai-note-taking-software`} element={<BestAINoteTakingSoftware />} />
            <Route path={`${safeTheme.path}/best-ai-daily-planning-software`} element={<BestAIDailyPlanningSoftware />} />
            <Route path={`${safeTheme.path}/best-ai-meeting-tools`} element={<BestAIMeetingTools />} />
            <Route path={`${safeTheme.path}/best-crm-software-for-teams`} element={<BestCRMSoftwareForTeams />} />
            <Route path={`${safeTheme.path}/best-ai-email-management-tools`} element={<BestAIEmailManagementTools />} />
            <Route path={`${safeTheme.path}/best-productivity-tools-for-adhd`} element={<BestProductivityToolsForADHD />} />
          </>
        )}

        Theme Two Routes - When Theme Two is active
        {!shouldShowThemeOne && (
          <>
            <Route path="/" element={<ThemeTwoHomePage />} />
            <Route path="/latest-launches" element={<ThemeTwoLatestLaunches />} />
            <Route path="/recently-added" element={<ThemeTwoUpcoming />} />
            <Route path="/top-products" element={<ThemeTwoTopProducts />} />
            <Route path="/categories" element={<CategoriesPage />} />
            <Route path="/category/:id" element={<ThemeTwoCategoryPage />} />
            <Route path="/trending" element={<TrendingPage />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/guides" element={<GuidesPage />} />
            <Route path="/faq" element={<FAQPage />} />
            <Route path="/privacy" element={<PrivacyPolicyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/latest-news" element={<ThemeTwoLatestNews />} />
            <Route path="/news/:slug" element={<ThemeTwoNewsDetail />} />
            <Route path="/blog" element={<ThemeTwoBlog />} />
            <Route path="/blog/:slug" element={<ThemeTwoBlogPost />} />
            <Route path="/discussions" element={<ThemeTwoDiscussions />} />
            <Route path="/events" element={<ThemeTwoEvents />} />
            <Route path="/advertise" element={<ThemeTwoAdvertise />} />
            <Route path="/ai-tools/:slug" element={<ThemeTwoAIToolDetail />} />
            <Route path="/ai-tool/:id" element={<ThemeTwoAIToolDetail />} />
            <Route path="/sign-in" element={<SignInPage />} />
            <Route path="/sign-up" element={<SignUpPage />} />
            <Route path="/dashboard" element={<ThemeTwoDashboard />} />
            <Route path="/theme-two/*" element={<ThemeTwoExample />} />
            
            Best Software Pages
            <Route path="/best-project-management-tools" element={<BestProjectManagementTools />} />
            <Route path="/best-ai-note-taking-software" element={<BestAINoteTakingSoftware />} />
            <Route path="/best-ai-daily-planning-software" element={<BestAIDailyPlanningSoftware />} />
            <Route path="/best-ai-meeting-tools" element={<BestAIMeetingTools />} />
            <Route path="/best-crm-software-for-teams" element={<BestCRMSoftwareForTeams />} />
            <Route path="/best-ai-email-management-tools" element={<BestAIEmailManagementTools />} />
            <Route path="/best-productivity-tools-for-adhd" element={<BestProductivityToolsForADHD />} />
          </>
        )}
      </Routes> */}
      
      {/* Theme-specific Footer */}
      {!isAdminRoute && shouldShowThemeOne && <ThemeOneFooter />}
      {!isAdminRoute && !shouldShowThemeOne && <ThemeTwoFooter />}
    </>
  );
};
