# Releases

This file provides a summary of all releases for the AI Tool Finder Frontend application.

For detailed changelog information, please refer to [CHANGELOG.md](./CHANGELOG.md).

---

## [1.8.0] - 2026-03-02

**Latest Release**

### Highlights
- **Mobile Scrolling Optimization**: Refined CSS and layout scripts to fix scrolling issues on iOS and Android devices.
- **Theme Two Dynamic Settings**: Fully integrated dynamic site configuration into Theme Two components.
- **Improved Admin Parity**: Site name, logos, and descriptions in Theme Two now update automatically from the admin panel.
- **Enhanced Directory UI**: Added dynamic tool counts and optimized header navigation for Theme Two.

---

## [1.7.0] - 2026-01-20

### Highlights
- **Auto-Scraper Engine**: Automated tool discovery via Vercel Cron
- Admin interface for manual scraping triggers
- Monitoring and status alerts for scraping jobs
- Integration with Tool Submissions workflow

### Breaking Changes
None

---

## [1.6.0] - 2026-01-15

### Highlights
- User deletion API implementation
- Enhanced role management system
- Improved user management UI and workflows

### Breaking Changes
None

### Migration Notes
No migration required for this release.

---

## [1.3.1] - 2026-01-06

### Highlights
- Improved image URL handling
- Enhanced slug generation for SEO
- UI design improvements for buttons

### Breaking Changes
None

---

## [1.3.0] - 2026-01-05

### Highlights
- Comprehensive admin panel enhancements
- Improved FAQ management
- Enhanced submission review workflows
- Better advertising management
- Improved AdSense integration
- Enhanced review management system

### Breaking Changes
None

---

## [1.2.2] - 2025-12-19

### Highlights
- Enhanced API and environment configuration
- Improved configuration validation

### Breaking Changes
None

---

## [1.2.1] - 2025-12-18

### Highlights
- Enhanced component structure
- Improved image URL handling across themes
- Updated Cloudinary dependency to 1.41.3
- Better database indexing
- Normalized site configuration handling
- Removed legacy server health checks

### Breaking Changes
None

### Migration Notes
- Legacy server health checks have been removed
- Site configuration handling has been normalized

---

## [1.2.0] - 2025-12-10

### Highlights
- **Major Feature**: AdSense integration
- **Major Feature**: FAQ management system
- Payment success and cancellation pages
- Dynamic layout components
- Enhanced authentication system
- Streamlined authentication flow

### Breaking Changes
- Removed standalone sign-in and sign-up pages (now using Clerk integration)
- Removed vercel.json configuration file (migrated to dynamic configuration)

### Migration Notes
- Authentication now uses Clerk integration exclusively
- Configuration is now managed dynamically instead of through vercel.json

---

## [1.1.0] - 2025-12-09

### Highlights
- **Major Feature**: Comprehensive admin panel
  - Admin pages for advertising plans, blog, inquiries, news, newsletters
  - Payment settings, reviews, sponsorships, submissions, tools, and users management
- Enhanced authentication routes
- Improved loading states
- Updated to Next.js 15.1.9

### Breaking Changes
None

### Migration Notes
- Next.js has been updated to version 15.1.9
- Ensure all dependencies are compatible

---

## [1.0.0] - 2025-12-08

### Highlights
- **Initial Release**
- Complete frontend application setup
- Tailwind CSS configuration
- Component structures
- API routes
- Admin functionalities
- UI elements and optimizations

### Breaking Changes
N/A (Initial release)

---

## Versioning

This project follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html):
- **MAJOR** version when you make incompatible API changes
- **MINOR** version when you add functionality in a backwards compatible manner
- **PATCH** version when you make backwards compatible bug fixes

---

## Support

For issues, questions, or contributions, please refer to the main project documentation.
