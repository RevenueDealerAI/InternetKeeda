import { clerkMiddleware, createRouteMatcher } from "@clerk/nextjs/server";

const isPublicRoute = createRouteMatcher([
  "/",
  "/ai-tools(.*)",
  "/blog(.*)",
  "/news(.*)",
  "/categories(.*)",
  "/category(.*)",
  "/latest-launches",
  "/upcoming",
  "/top-products",
  "/trending",
  "/about",
  "/guides",
  "/faq",
  "/privacy",
  "/terms",
  "/sign-in(.*)",
  "/sign-up(.*)",
  "/verify-email(.*)",
  "/sso-callback(.*)",
  "/advertise(.*)",
  "/discussions",
  "/events",
  "/best-project-management-tools",
  "/best-ai-note-taking-software",
  "/best-ai-daily-planning-software",
  "/best-ai-meeting-tools",
  "/best-crm-software-for-teams",
  "/best-ai-email-management-tools",
  "/best-productivity-tools-for-adhd",
]);

const isIgnoredRoute = createRouteMatcher([
  "/api/webhook(.*)",
  "/api/(.*)",
  "/_next(.*)",
  "/favicon.ico",
  "/sitemap.xml",
]);

import { NextResponse } from "next/server";

export default clerkMiddleware(async (auth, req) => {
  const res = NextResponse.next();

  // Detect if request is from an iframe (Envato preview)
  // Check Sec-Fetch-Dest header (modern browsers)
  const secFetchDest = req.headers.get('sec-fetch-dest');
  const isIframe = secFetchDest === 'iframe';

  // Also check referer for Envato domains
  const referer = req.headers.get('referer') || '';
  const isEnvatoPreview = referer.includes('envato.com') ||
    referer.includes('themeforest.net') ||
    referer.includes('codecanyon.net');

  // If in iframe or Envato preview, skip Clerk protection to avoid redirect loops
  if (isIframe || isEnvatoPreview) {
    return res;
  }

  // Affiliate Tracking
  const searchParams = req.nextUrl.searchParams;
  const ref = searchParams.get('ref');

  if (ref) {
    res.cookies.set('affiliate_code', ref, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      sameSite: 'lax',
      httpOnly: false // Accessible by client side scripts
    });
  }

  // Allow all Clerk authentication routes to be public
  // Clerk handles its own authentication internally
  const clerkRoutes = [
    '/sign-in',
    '/sign-up',
    '/verify-email',
    '/sso-callback',
  ];

  const isClerkRoute = clerkRoutes.some(route =>
    req.nextUrl.pathname.startsWith(route)
  );

  // Only protect admin routes (skip protection for Clerk routes)
  if (!isClerkRoute && req.nextUrl.pathname.startsWith('/admin')) {
    await auth.protect();
  }

  return res;
});

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
}; 