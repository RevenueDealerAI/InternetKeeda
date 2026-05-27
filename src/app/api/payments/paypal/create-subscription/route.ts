import { NextResponse } from "next/server";

/**
 * POST /api/payments/paypal/create-subscription — STUB.
 *
 * Returns 501 Not Implemented while PayPal credentials and the
 * @paypal/checkout-server-sdk wiring are pending. The
 * PaymentMethodPicker has PayPal disabled today, so no client code
 * is supposed to hit this route in production; the stub exists so
 * the route shape is reserved and so any accidental call gets a
 * meaningful response instead of a 404.
 *
 * When implementing for real:
 *   - Add @paypal/checkout-server-sdk + PAYPAL_CLIENT_ID /
 *     PAYPAL_CLIENT_SECRET to env (sandbox + prod).
 *   - Use requireUser from src/lib/auth/user.ts to authenticate.
 *   - Mirror the Cashfree subscription model: create a Mongo
 *     Subscription row in `initialized` state, return a
 *     paypalSubscriptionId for the client to hand to the PayPal JS
 *     SDK, and reconcile via /api/webhooks/paypal.
 *   - Flip enabled: true in src/lib/payment/providers.ts so the
 *     picker surfaces PayPal as a selectable option.
 */
export async function POST() {
  return NextResponse.json(
    { error: "PayPal integration not yet wired" },
    { status: 501 },
  );
}
