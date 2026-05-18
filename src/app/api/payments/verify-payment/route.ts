import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { requireAuth, errorResponse, getAuth } from '../../lib/auth';
import { AdvertisingPurchase } from '../../models/AdvertisingPurchase';
import { AdvertisingPlan } from '../../models/AdvertisingPlan';
import { PaymentSettings } from '../../models/PaymentSettings';
import Stripe from 'stripe';
import { z } from 'zod';

const verifyPaymentSchema = z.object({
  sessionId: z.string().min(1, "Session ID is required"),
  paymentMethod: z.enum(['stripe', 'paypal'])
});

async function getConfiguredStripe() {
  const paymentSettings = await PaymentSettings.getSettings();
  const stripeConfig = paymentSettings.getCurrentStripeConfig();
  
  if (!stripeConfig || !stripeConfig.secretKey) {
    const envSecretKey = process.env.STRIPE_SECRET_KEY;
    if (!envSecretKey) {
      throw new Error('Stripe not configured. Please configure payment settings in admin panel.');
    }
    
    return new Stripe(envSecretKey, {
      apiVersion: '2023-10-16'
    });
  }
  
  return new Stripe(String(stripeConfig.secretKey), {
    apiVersion: '2023-10-16'
  });
}

async function getPaymentSettings() {
  return await PaymentSettings.getSettings();
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const auth = await requireAuth(req);
    const user = await getAuth();
    
    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      );
    }

    const body = await req.json();
    const validatedData = verifyPaymentSchema.parse(body);
    const { sessionId, paymentMethod } = validatedData;

    let purchaseData: Record<string, unknown> = {};

    if (paymentMethod === 'stripe') {
      // Retrieve the session from Stripe using configured instance
      const stripe = await getConfiguredStripe();
      const session = await stripe.checkout.sessions.retrieve(sessionId);
      
      if (session.payment_status !== 'paid') {
        return NextResponse.json(
          { error: 'Payment not completed' },
          { status: 400 }
        );
      }

      const planId = session.metadata?.planId;
      if (!planId) {
        return NextResponse.json(
          { error: 'Plan ID not found in session metadata' },
          { status: 400 }
        );
      }

      const plan = await AdvertisingPlan.findById(planId);
      if (!plan) {
        return NextResponse.json(
          { error: 'Advertising plan not found' },
          { status: 404 }
        );
      }

      // Calculate dates
      const startDate = new Date();
      const endDate = new Date();
      endDate.setDate(endDate.getDate() + plan.duration);

      purchaseData = {
        userId: auth.userId,
        userEmail: user.emailAddresses[0]?.emailAddress || '',
        planId: plan._id,
        planName: plan.name,
        amount: session.amount_total ? session.amount_total / 100 : plan.price,
        currency: session.currency?.toUpperCase() || plan.currency,
        paymentMethod: 'stripe',
        paymentId: session.id,
        status: 'active',
        startDate,
        endDate,
        placement: plan.placement,
        features: plan.features,
        analytics: {
          impressions: 0,
          clicks: 0,
          ctr: 0
        }
      };
    } else if (paymentMethod === 'paypal') {
      // For PayPal, you would verify the payment with PayPal API
      // This is a simplified version - implement PayPal verification as needed
      return NextResponse.json(
        { error: 'PayPal verification not yet implemented' },
        { status: 501 }
      );
    } else {
      return NextResponse.json(
        { error: 'Invalid payment method' },
        { status: 400 }
      );
    }

    // Check if purchase already exists
    const existingPurchase = await AdvertisingPurchase.findOne({
      paymentId: purchaseData.paymentId
    });

    if (existingPurchase) {
      return NextResponse.json(existingPurchase);
    }

    // Create purchase record
    const purchase = await AdvertisingPurchase.create(purchaseData);

    return NextResponse.json(purchase);
  } catch (error: unknown) {
    console.error('Error verifying payment:', error);
    
    if (error instanceof z.ZodError) {
      const formattedErrors = error.errors.map(err => ({
        field: err.path.join('.'),
        message: err.message
      }));
      
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: formattedErrors
        },
        { status: 400 }
      );
    }
    
    return errorResponse('Failed to verify payment', 500);
  }
}





