import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { requireAuth, errorResponse } from '../../lib/auth';
import { PaymentSettings } from '../../models/PaymentSettings';
import Stripe from 'stripe';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        await requireAuth();
        
        const body = await req.json();
        const { mode } = body;
        
        const settings = await PaymentSettings.getSettings();
        const stripeConfig = settings.getCurrentStripeConfig();
        
        if (!stripeConfig || settings.stripe.mode !== mode) {
            return NextResponse.json({
                success: false,
                error: 'Stripe configuration not found or mode mismatch'
            }, { status: 400 });
        }
        
        const stripe = new Stripe(String(stripeConfig.secretKey), {
            apiVersion: '2023-10-16'
        });
        
        const account = await stripe.accounts.retrieve();
        
        return NextResponse.json({
            success: true,
            message: 'Stripe connection successful',
            data: {
                accountId: account.id,
                country: account.country,
                currency: account.default_currency,
                mode: stripeConfig.mode
            }
        });
    } catch (error: unknown) {
        console.error('Error testing Stripe connection:', error);
        return NextResponse.json({
            success: false,
            error: error instanceof Error ? error.message : 'Failed to test Stripe connection'
        }, { status: 400 });
    }
}

