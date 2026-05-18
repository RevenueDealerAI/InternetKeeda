import { NextRequest, NextResponse } from 'next/server';
import { errorResponse } from '../../lib/auth';

const SUBSCRIPTION_PLANS = {
  basic: {
    name: 'Basic Plan',
    description: 'Access to all basic features',
    price_monthly: process.env.STRIPE_BASIC_PRICE_MONTHLY,
    price_yearly: process.env.STRIPE_BASIC_PRICE_YEARLY
  },
  premium: {
    name: 'Premium Plan',
    description: 'Full access to all features',
    price_monthly: process.env.STRIPE_PREMIUM_PRICE_MONTHLY,
    price_yearly: process.env.STRIPE_PREMIUM_PRICE_YEARLY
  },
  enterprise: {
    name: 'Enterprise Plan',
    description: 'Custom solutions for large organizations',
    price_monthly: process.env.STRIPE_ENTERPRISE_PRICE_MONTHLY,
    price_yearly: process.env.STRIPE_ENTERPRISE_PRICE_YEARLY
  }
};

export async function GET(req: NextRequest) {
    try {
        return NextResponse.json(SUBSCRIPTION_PLANS);
    } catch (error: unknown) {
        console.error('Error fetching subscription plans:', error);
        return errorResponse('Failed to fetch subscription plans', 500);
    }
}

