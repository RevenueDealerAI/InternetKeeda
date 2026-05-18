import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { errorResponse } from '../../lib/auth';
import { PaymentSettings } from '../../models/PaymentSettings';

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        
        const settings = await PaymentSettings.getSettings();
        
        const publicConfig = {
            stripe: {
                enabled: settings.stripe.enabled,
                publishableKey: settings.stripe.enabled ? 
                    (settings.stripe.mode === 'test' ? 
                        settings.stripe.test.publishableKey : 
                        settings.stripe.live.publishableKey
                    ) : null,
                mode: settings.stripe.mode
            },
            paypal: {
                enabled: settings.paypal.enabled,
                clientId: settings.paypal.enabled ?
                    (settings.paypal.mode === 'sandbox' ?
                        settings.paypal.sandbox.clientId :
                        settings.paypal.live.clientId
                    ) : null,
                mode: settings.paypal.mode
            },
            currency: settings.currency
        };
        
        return NextResponse.json({
            success: true,
            data: publicConfig
        });
    } catch (error: unknown) {
        console.error('Error fetching public payment config:', error);
        return NextResponse.json({ 
            success: false,
            error: 'Failed to fetch payment configuration' 
        }, { status: 500 });
    }
}

