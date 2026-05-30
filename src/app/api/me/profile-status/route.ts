import { NextRequest, NextResponse } from "next/server";
import { errorResponse, getAuth } from "@/app/api/lib/auth";

/**
 * GET /api/me/profile-status
 *
 * Tiny precondition endpoint the dashboard hits BEFORE opening
 * the Cashfree hosted checkout, so a phone-less user never gets
 * routed into the payment flow only to be told mid-checkout that
 * Cashfree needs a phone number for the UPI Autopay mandate.
 *
 * Mirrors the server-side precondition in /api/subscriptions/
 * create and /api/payments/boost/create — same Clerk field, same
 * "verified" filter — so a phone that passes here will also pass
 * the actual checkout call.
 */
export async function GET(_req: NextRequest) {
  try {
    const clerkUser = await getAuth();
    if (!clerkUser) {
      return NextResponse.json({ error: "unauthenticated" }, { status: 401 });
    }
    const verified = clerkUser.phoneNumbers?.find(
      (p) => p?.verification?.status === "verified",
    );
    return NextResponse.json({
      hasVerifiedPhone: !!verified?.phoneNumber,
      hasVerifiedEmail:
        !!clerkUser.emailAddresses?.find(
          (e) => e?.verification?.status === "verified",
        ),
    });
  } catch (err) {
    console.error("me/profile-status error:", err);
    return errorResponse("Failed to read profile status", 500);
  }
}
