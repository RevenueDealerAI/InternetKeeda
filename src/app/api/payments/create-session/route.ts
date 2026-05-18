import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { requireAuth, errorResponse } from '../../lib/auth';
import { AdvertisingPlan } from '../../models/AdvertisingPlan';
import { PaymentSettings } from '../../models/PaymentSettings';
import Stripe from 'stripe';
import { z } from 'zod';

const createSessionSchema = z.object({
  planId: z.string().min(1, "Plan ID is required"),
  paymentMethod: z.enum(['stripe', 'paypal']),
  successUrl: z.string().url("Valid success URL is required"),
  cancelUrl: z.string().url("Valid cancel URL is required")
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
    
    const body = await req.json();
    const validatedData = createSessionSchema.parse(body);
    const { planId, paymentMethod, successUrl, cancelUrl } = validatedData;

    // Get the advertising plan
    const plan = await AdvertisingPlan.findById(planId);
    if (!plan || !plan.isActive) {
      return NextResponse.json(
        { error: 'Advertising plan not found or inactive' },
        { status: 404 }
      );
    }

    // Get payment settings
    const paymentSettings = await getPaymentSettings();

    if (paymentMethod === 'stripe') {
      if (!plan.stripePriceId) {
        return NextResponse.json(
          { error: 'Stripe payment not available for this plan' },
          { status: 400 }
        );
      }

      // Check if Stripe is enabled and configured
      const stripeConfig = paymentSettings.getCurrentStripeConfig();
      if (!stripeConfig) {
        return NextResponse.json(
          { error: 'Stripe is not configured. Please contact administrator.' },
          { status: 400 }
        );
      }

      // Create Stripe checkout session with configured settings
      const stripe = await getConfiguredStripe();
      const session = await stripe.checkout.sessions.create({
        payment_method_types: ['card'],
        line_items: [
          {
            price: plan.stripePriceId,
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: successUrl,
        cancel_url: cancelUrl,
        metadata: {
          planId: plan._id.toString(),
          planName: plan.name,
          paymentMethod: 'stripe',
          userId: auth.userId
        },
      });

      return NextResponse.json({
        url: session.url,
        sessionId: session.id
      });
    } else if (paymentMethod === 'paypal') {
      if (!plan.paypalPlanId) {
        return NextResponse.json(
          { error: 'PayPal payment not available for this plan' },
          { status: 400 }
        );
      }

      // Check if PayPal is enabled and configured
      const paypalConfig = paymentSettings.getCurrentPayPalConfig();
      if (!paypalConfig) {
        return NextResponse.json(
          { error: 'PayPal is not configured. Please contact administrator.' },
          { status: 400 }
        );
      }

      // For PayPal, we'll create a simple redirect URL
      // In a real implementation, you'd integrate with PayPal SDK
      const paypalSession = {
        id: `paypal_${Date.now()}_${planId}`,
        url: `https://www.${paypalConfig.mode === 'sandbox' ? 'sandbox.' : ''}paypal.com/cgi-bin/webscr?cmd=_xclick&business=your-paypal-email&item_name=${encodeURIComponent(plan.name)}&amount=${plan.price}&currency_code=${plan.currency}&return=${encodeURIComponent(successUrl)}&cancel_return=${encodeURIComponent(cancelUrl)}`
      };

      return NextResponse.json({
        url: paypalSession.url,
        sessionId: paypalSession.id
      });
    }

    return NextResponse.json(
      { error: 'Invalid payment method' },
      { status: 400 }
    );
  } catch (error: unknown) {
    console.error('Error creating payment session:', error);
    
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
    
    return errorResponse('Failed to create payment session', 500);
  }
}





