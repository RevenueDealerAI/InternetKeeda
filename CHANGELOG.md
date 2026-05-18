# Changelog

All notable changes to the AI Tool Finder Frontend will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).


## [1.8.0] - 2026-03-02

### Fixed
- **Mobile Scrolling**: Refined global CSS and refined `ScrollBehaviorFix` component to restore native scrolling on iOS and Android. Removed restrictive `height: 100%` and `overscroll-behavior-y: none` properties on mobile devices.

### Changed
- **Theme Two Parity**: Fully integrated dynamic site configuration into Theme Two components.
  - Replaced hardcoded logos with dynamic backend-sourced assets.
  - Linked site name and description to general admin settings.
  - Optimized directory stats to reflect real-time tool counts.
- **Admin Settings**: Updated the Site Settings logic to ensure consistent application across all themes.

## [1.7.0] - 2026-01-20

### Added
- **Auto-Scraper Engine**: New automated tool discovery system
  - Admin page for manual scraping triggers
  - Integration with Vercel Cron for automated daily updates
  - UI for managing cron secrets and monitoring status
  - Pending submissions queue for scraped tools

## [1.6.0] - 2026-01-15

### Added
- **Affiliate System**: Complete affiliate management system with referral tracking and commissions
  - Dashboard for affiliates to view stats and earnings
  - Automated referral tracking via cookies and database binding
  - Commission calculation (20%) on successful payments
  - Admin view for managing affiliates
  - Theme-aware UI for both Theme One and Theme Two

## [1.5.0] - 2026-01-14

### Changed
- **Architecture**: Migrated entire repository from Microservices to Monorepo
  - Simplified installation process for end users
  - Unified codebase for easier management and deployment
  - Improved project structure reliability

## [1.4.0] - 2026-01-08

### Added
- **User Management**: Implemented user deletion API and enhanced role management functionality
  - Added user deletion capabilities in admin panel
  - Improved role management system with better error handling
  - Enhanced user management UI and workflows

## [1.3.1] - 2026-01-06

### Changed
- **Image Handling**: Updated image URL handling and enhanced slug generation in news API routes
  - Improved image URL processing logic
  - Enhanced slug generation for better SEO
  - Better error handling for image operations

### Style
- **UI Improvements**: Enhanced button design in FAQ and Software Pages management
  - Improved button styling and consistency
  - Better visual feedback for user interactions
  - Enhanced accessibility features

## [1.3.0] - 2026-01-05

### Added
- **Admin Panel Enhancements**: Comprehensive improvements to admin panel across themes
  - Enhanced FAQ management interface
  - Improved submission review workflows
  - Better advertising management capabilities
  - Enhanced AdSense integration features
  - Improved review management system

## [1.2.2] - 2025-12-19

### Enhanced
- **API Configuration**: Enhanced API and environment configuration for AI tools
  - Improved environment variable handling
  - Better API endpoint configuration
  - Enhanced configuration validation

## [1.2.1] - 2025-12-18

### Changed
- **Component Structure**: Enhanced component structure and improved image URL handling across themes
  - Better component organization
  - Improved image URL processing
  - Enhanced theme compatibility

- **Dependencies**: Updated dependencies and improved Category model indexing
  - Updated Cloudinary dependency to version 1.41.3
  - Improved database indexing for better performance
  - Enhanced dependency management

- **Site Configuration**: Refactored site configuration handling and enhanced image optimization
  - Normalized site configuration handling
  - Removed legacy server health checks
  - Improved image optimization processes
  - Better environment configuration handling

## [1.2.0] - 2025-12-10

### Added
- **AdSense Integration**: Implemented AdSense integration and FAQ management features
  - Added AdSense support for monetization
  - Comprehensive FAQ management system
  - Admin interface for FAQ content management

- **Payment Pages**: Added AdvertiseCancel and AdvertiseSuccess pages with theme-based rendering
  - Payment success page with theme support
  - Payment cancellation page
  - Theme-aware page rendering

- **Dynamic Layouts**: Added dynamic layout components for AI tools, blog, and news pages
  - Implemented caching mechanism in API config route
  - Optimized site configuration retrieval
  - Enhanced database connection handling
  - Updated SiteConfigContext for improved loading and error handling

- **Authentication Routes**: Enhanced authentication system with new routes
  - Added public routes for email verification
  - SSO callback route support
  - Improved loading indicators during theme determination
  - Enhanced error handling with Not Found page

### Changed
- **Authentication Flow**: Streamlined authentication process
  - Removed sign-in and sign-up pages
  - Updated verify email page with enhanced user instructions
  - Removed unnecessary email link component
  - Refactored theme context dependency

### Removed
- **Configuration**: Removed vercel.json configuration file
  - Migrated to dynamic configuration approach

- **Authentication Pages**: Removed standalone sign-in and sign-up pages
  - Streamlined authentication through Clerk integration

## [1.1.0] - 2025-12-09

### Added
- **Admin Panel**: Comprehensive admin pages and configuration updates
  - Added admin pages for advertising plans, blog management, inquiries
  - News, newsletters, payment settings management
  - Reviews, sponsorships, submissions, tools, and users management
  - Updated Next.js configuration to allow additional image domains
  - Improved loading states and image handling across components

- **Authentication System**: Implemented new authentication routes and enhanced loading states
  - Added public routes for email verification and SSO callback in middleware
  - Improved user experience with loading indicators
  - Enhanced payment API calls using Clerk's session management
  - Refactored theme context to prevent flash of incorrect themes

### Changed
- **Type Definitions**: Refactored type definitions and improved image handling
  - Updated type annotations for payment verification and tool submissions
  - Enhanced image URL retrieval logic in Dashboard components
  - Improved category management in ThemeTwoHomePage using API data
  - Adjusted loading states and UI elements for better user experience

- **Authentication Logic**: Streamlined token verification
  - Removed redundant OAuth token verification steps
  - Improved error handling for invalid token formats
  - Enhanced user ID extraction from JWT payloads
  - Ensured user existence verification in Clerk

- **Dependencies**: Updated Next.js and related dependencies to version 15.1.9
  - Updated @next/env, @next/swc modules
  - Ensured compatibility with latest features and fixes

## [1.0.0] - 2025-12-08

### Added
- **Initial Release**: Comprehensive frontend application setup
  - Updated Tailwind CSS configurations
  - Enhanced component structures
  - Updated API routes
  - Enhanced admin functionalities
  - Improved UI elements for better user experience
  - Refactored code for maintainability and performance optimizations
