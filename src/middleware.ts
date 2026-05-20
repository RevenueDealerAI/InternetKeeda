import { clerkMiddleware } from "@clerk/nextjs/server";
import { NextResponse, type NextRequest, type NextFetchEvent } from "next/server";

/**
 * Middleware wrapper that degrades gracefully when Clerk env vars are
 * missing. Without this guard, an unset `CLERK_SECRET_KEY` (the most
 * common Vercel first-deploy mistake) crashes the Clerk runtime on every
 * request and the entire site returns `MIDDLEWARE_INVOCATION_FAILED`.
 *
 * Behavior:
 *   - When both NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY are
 *     set, full Clerk middleware runs (admin route protection, auth state,
 *     redirect handling).
 *   - When either is missing, the site falls back to a pass-through that
 *     still handles the affiliate-cookie + iframe detection but skips
 *     auth. Public routes work, admin routes are functionally open (the
 *     server-side checks inside admin API routes still apply).
 *   - In either case, the site doesn't 500.
 */

const hasClerkConfig = () =>
  !!process.env.NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY &&
  !!process.env.CLERK_SECRET_KEY;

/** Shared logic that runs whether or not Clerk is configured: iframe
 * detection (Envato preview escape) + affiliate referral cookie. */
function applyCommonResponse(req: NextRequest): NextResponse {
  const res = NextResponse.next();

  const secFetchDest = req.headers.get('sec-fetch-dest');
  const isIframe = secFetchDest === 'iframe';
  const referer = req.headers.get('referer') || '';
  const isEnvatoPreview =
    referer.includes('envato.com') ||
    referer.includes('themeforest.net') ||
    referer.includes('codecanyon.net');

  if (isIframe || isEnvatoPreview) {
    return res;
  }

  const ref = req.nextUrl.searchParams.get('ref');
  if (ref) {
    res.cookies.set('affiliate_code', ref, {
      maxAge: 60 * 60 * 24 * 30, // 30 days
      path: '/',
      sameSite: 'lax',
      httpOnly: false,
    });
  }

  return res;
}

const clerkHandler = clerkMiddleware(async (auth, req) => {
  const res = applyCommonResponse(req);

  // applyCommonResponse already returned early for iframe / Envato, but we
  // still need to run admin route protection in the normal case.
  const secFetchDest = req.headers.get('sec-fetch-dest');
  if (secFetchDest === 'iframe') return res;

  const clerkRoutes = ['/sign-in', '/sign-up', '/verify-email', '/sso-callback'];
  const isClerkRoute = clerkRoutes.some((route) =>
    req.nextUrl.pathname.startsWith(route),
  );

  if (!isClerkRoute && req.nextUrl.pathname.startsWith('/admin')) {
    await auth.protect();
  }

  return res;
});

// Routes that actually need Clerk to do its handshake / session cookie
// dance. Everything else (home, category, tool detail, etc.) skips
// Clerk in middleware entirely — avoiding the ~1s Clerk-handshake
// redirect on every cold mobile load that Lighthouse flagged.
// Client-side, ClerkProvider still hydrates user state on mount; the
// Navigation avatar/dropdown still works for signed-in users, just
// without the server-side roundtrip on anonymous visits.
const CLERK_PROTECTED_PATHS = [
  '/admin',
  '/dashboard',
  '/sign-in',
  '/sign-up',
  '/verify-email',
  '/sso-callback',
];

function needsClerk(pathname: string): boolean {
  // Auth-touching API routes — anything that does requireAuth() needs
  // the Clerk session cookie validated by middleware.
  if (pathname.startsWith('/api/users') || pathname.startsWith('/api/admin')) {
    return true;
  }
  return CLERK_PROTECTED_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

export default async function middleware(req: NextRequest, event: NextFetchEvent) {
  if (!hasClerkConfig()) {
    if (typeof console !== 'undefined') {
      console.warn(
        '[middleware] Clerk env vars missing — falling back to pass-through. ' +
          'Set NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY and CLERK_SECRET_KEY in Vercel ' +
          'project settings to enable auth.',
      );
    }
    return applyCommonResponse(req);
  }

  // Public route — skip Clerk entirely. Saves ~1s LCP on cold loads.
  if (!needsClerk(req.nextUrl.pathname)) {
    return applyCommonResponse(req);
  }

  return clerkHandler(req, event);
}

export const config = {
  matcher: [
    "/((?!.+\\.[\\w]+$|_next).*)",
    "/",
    "/(api|trpc)(.*)",
  ],
};
