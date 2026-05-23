import { NextRequest, NextResponse } from "next/server";

/**
 * Cashfree's hosted-checkout SDK bounces the user back to returnUrl
 * via a form POST after the subscription mandate completes — form-
 * urlencoded body, NOT a query-string redirect. Next.js App Router
 * page.tsx routes only serve GET → 405 if POSTed directly.
 *
 * This route accepts both GET and POST. On POST we parse the form
 * body, pluck the subscription identifier under any of the common
 * names Cashfree may use, and 303-redirect to the actual return page
 * with subscription_id as a query param. On GET we just forward.
 *
 * The page at `/subscription/return` reads subscription_id from
 * (1) URL query, then (2) localStorage (stashed client-side right
 * before the Cashfree redirect), then renders an error state.
 *
 * Putting this at /subscription/return-bounce rather than at
 * /subscription/return directly avoids the Next.js page+route
 * collision (both file types can't share a path).
 */

export const dynamic = "force-dynamic";

const TARGET = "/subscription/return";

function pickSubscriptionId(values: URLSearchParams | FormData): string | null {
  const candidates = [
    "subscription_id",
    "subscriptionId",
    "subs_id",
    "subId",
  ];
  for (const k of candidates) {
    const v = values.get(k);
    if (typeof v === "string" && v.length > 0 && !/^\{.*\}$/.test(v)) {
      return v;
    }
  }
  return null;
}

function buildRedirect(req: NextRequest, subId: string | null): NextResponse {
  const url = new URL(TARGET, req.url);
  if (subId) url.searchParams.set("subscription_id", subId);
  // 303 forces the browser to switch to GET on the redirect target,
  // regardless of the original request method.
  return NextResponse.redirect(url, { status: 303 });
}

export async function GET(req: NextRequest) {
  // GET hits the bounce route only if Cashfree (or a manual URL)
  // sends the user here with subscription_id in the query string.
  // Forward it.
  return buildRedirect(req, pickSubscriptionId(req.nextUrl.searchParams));
}

export async function POST(req: NextRequest) {
  let subId: string | null = null;
  try {
    // Cashfree usually sends application/x-www-form-urlencoded.
    // formData() also handles multipart/form-data and most JSON
    // bodies via type detection — safe to try unconditionally.
    const form = await req.formData();
    subId = pickSubscriptionId(form);
  } catch {
    // ignore — fall through with no id; the page can still read
    // from localStorage.
  }
  // Also accept ?subscription_id=... if Cashfree appends to the URL.
  if (!subId) {
    subId = pickSubscriptionId(req.nextUrl.searchParams);
  }
  return buildRedirect(req, subId);
}
