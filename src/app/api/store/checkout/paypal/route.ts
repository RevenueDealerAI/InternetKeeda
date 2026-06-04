/**
 * POST /api/store/checkout/paypal
 *
 * PayPal USD checkout for Keeda Labs digital downloads. Same shape
 * as /api/payments/paypal/create-boost-order — pre-create the Payment
 * row, call createOneTimeOrder, return the approveUrl.
 */

import { NextRequest, NextResponse } from 'next/server';
import mongoose from 'mongoose';
import { z } from 'zod';
import { connectDB } from '@/app/api/lib/db';
import { errorResponse } from '@/app/api/lib/auth';
import { requireUser } from '@/lib/auth/user';
import { Payment } from '@/app/api/models/Payment';
import { createOneTimeOrder, getPaypalMode, PayPalError } from '@/lib/paypal';
import { StoreProduct } from '@/features/store/models/StoreProduct';
import { STORE_PRODUCT_TYPE } from '@/features/store/config';
import { toMajor } from '@/features/store/lib/pricing';

const bodySchema = z.object({
  productId: z.string().min(1, 'productId is required'),
});

function siteOrigin(req: NextRequest): string {
  const env =
    process.env.NEXT_PUBLIC_SITE_URL ||
    process.env.FRONTEND_URL ||
    process.env.NEXT_PUBLIC_APP_URL;
  if (env) return env.replace(/\/$/, '');
  const url = new URL(req.url);
  return `${url.protocol}//${url.host}`;
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const auth = await requireUser();
    if (auth.kind !== 'ok') {
      return NextResponse.json({ error: 'unauthenticated' }, { status: 401 });
    }
    const { productId } = bodySchema.parse(await req.json());

    const product = await StoreProduct.findById(productId);
    if (!product || product.status !== 'published') {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }

    const dbId = new mongoose.Types.ObjectId();
    const placeholder = `paypal_pending_${dbId.toString()}_${Date.now()}`;

    const payment = await Payment.create({
      _id: dbId,
      userId: auth.userId,
      provider: 'paypal',
      orderId: placeholder,
      amount: product.priceUsdMinor,
      currency: 'USD',
      productType: STORE_PRODUCT_TYPE,
      boostDurationDays: 0,
      status: 'pending',
      paypalMode: getPaypalMode(),
      metadata: {
        storeProductId: String(product._id),
        storeProductTitle: product.title,
      },
    });

    const origin = siteOrigin(req);
    try {
      const created = await createOneTimeOrder({
        amountUsd: toMajor(product.priceUsdMinor),
        description: `Keeda Labs: ${product.title}`,
        customId: String(payment._id),
        referenceId: STORE_PRODUCT_TYPE,
        returnUrl: `${origin}/store/payment/return?provider=paypal&payment_db_id=${String(payment._id)}`,
        cancelUrl: `${origin}/store/payment/return?provider=paypal&cancelled=1&payment_db_id=${String(payment._id)}`,
      });

      payment.orderId = created.id;
      payment.paypalOrderId = created.id;
      payment.metadata = {
        ...(payment.metadata || {}),
        createResponse: created.raw as unknown as Record<string, unknown>,
      };
      await payment.save();

      return NextResponse.json({
        orderId: created.id,
        paymentDbId: String(payment._id),
        approveUrl: created.approveUrl,
        amount: product.priceUsdMinor,
        currency: 'USD',
        provider: 'paypal',
      });
    } catch (err) {
      payment.status = 'failed';
      payment.metadata = {
        ...(payment.metadata || {}),
        error: err instanceof Error ? err.message : String(err),
      };
      await payment.save();
      if (err instanceof PayPalError) {
        console.error('[store/paypal] paypal error:', err);
        return errorResponse(`PayPal order create failed: ${err.message}`, 502);
      }
      throw err;
    }
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: err.errors },
        { status: 400 }
      );
    }
    console.error('[store/paypal] error:', err);
    return errorResponse('Failed to create PayPal store order', 500);
  }
}
