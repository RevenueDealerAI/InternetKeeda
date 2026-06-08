/**
 * POST /api/store/checkout/paypal/capture
 *
 * Mirror of /api/payments/paypal/capture-boost-order, but routes to
 * markStorePaid so the store-purchase Payment row transitions to
 * 'success' AND a StorePurchase entitlement is minted. Called by
 * /store/payment/return when PayPal bounces the buyer back.
 *
 * Idempotent: capturing an already-captured order is a no-op because
 * markStorePaid uses a {status:'pending'} filter.
 */

import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { connectDB } from '@/app/api/lib/db';
import { errorResponse } from '@/app/api/lib/auth';
import { requireUser } from '@/lib/auth/user';
import { Payment } from '@/app/api/models/Payment';
import { captureOrder, PayPalError } from '@/lib/paypal';
import { markStorePaid } from '@/features/store/server/markPaid';
import { STORE_PRODUCT_TYPE } from '@/features/store/config';

const bodySchema = z.object({
  orderId: z.string().min(1, 'orderId is required'),
});

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const { orderId } = bodySchema.parse(await req.json());

    let payment = await Payment.findOne({ orderId });
    if (!payment) {
      return NextResponse.json({ error: 'Order not found' }, { status: 404 });
    }

    // Identity gate. Same shape as the /status endpoint:
    //   - Guest payment (userId starts with "guest_"): orderId is
    //     the bearer secret, no Clerk session needed. This is the
    //     ONLY way a guest can capture — they have no session to
    //     match against. PayPal already authenticated them via the
    //     hosted-checkout flow before returning.
    //   - Signed-in payment: require Clerk session matching the
    //     row, same as before.
    const isGuestPayment = payment.userId.startsWith('guest_');
    if (!isGuestPayment) {
      const auth = await requireUser();
      if (auth.kind !== 'ok') {
        return NextResponse.json(
          { error: 'unauthenticated' },
          { status: 401 }
        );
      }
      if (payment.userId !== auth.userId) {
        return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
      }
    }

    if (payment.provider !== 'paypal') {
      return NextResponse.json(
        { error: 'Not a PayPal order' },
        { status: 400 }
      );
    }
    if (payment.productType !== STORE_PRODUCT_TYPE) {
      return NextResponse.json(
        { error: 'Not a store order' },
        { status: 400 }
      );
    }

    // Already terminal — nothing to capture.
    if (payment.status !== 'pending') {
      return NextResponse.json({
        orderId: payment.orderId,
        status: payment.status,
        productType: payment.productType,
        paymentVerifiedVia: payment.paymentVerifiedVia,
      });
    }

    try {
      const captured = await captureOrder(orderId);
      const captureId =
        captured.purchase_units?.[0]?.payments?.captures?.[0]?.id;

      if (captured.status === 'COMPLETED') {
        const { applied } = await markStorePaid(orderId, {
          source: 'polling-fallback',
          paypalCaptureId: captureId,
        });
        if (applied && captureId) {
          await Payment.findOneAndUpdate(
            { orderId },
            {
              $set: {
                paypalCaptureId: captureId,
                'metadata.captureResponse':
                  captured as unknown as Record<string, unknown>,
              },
            }
          );
        }
        payment = (await Payment.findOne({ orderId })) ?? payment;
      } else {
        // Non-COMPLETED → flip the row to 'failed' so the return page
        // shows a clear terminal state instead of hanging on pending.
        await Payment.updateOne(
          { orderId, status: 'pending' },
          {
            $set: {
              status: 'failed',
              'metadata.captureResponse':
                captured as unknown as Record<string, unknown>,
            },
          }
        );
        payment = (await Payment.findOne({ orderId })) ?? payment;
      }
    } catch (err) {
      if (err instanceof PayPalError) {
        console.error('[store/paypal-capture] paypal error:', err);
        if (err.paypalCode === 'ORDER_ALREADY_CAPTURED') {
          payment = (await Payment.findOne({ orderId })) ?? payment;
        } else {
          return errorResponse(`PayPal capture failed: ${err.message}`, 502);
        }
      } else {
        throw err;
      }
    }

    return NextResponse.json({
      orderId: payment.orderId,
      status: payment.status,
      productType: payment.productType,
      amount: payment.amount,
      currency: payment.currency,
      paidAt: payment.paidAt,
      paymentVerifiedVia: payment.paymentVerifiedVia,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.errors },
        { status: 400 }
      );
    }
    console.error('[store/paypal-capture] error:', err);
    return errorResponse('Failed to capture PayPal store order', 500);
  }
}
