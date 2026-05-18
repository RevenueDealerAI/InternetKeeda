import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../lib/db';
import { requireAuth, errorResponse } from '../lib/auth';
import { PaymentSettings } from '../models/PaymentSettings';
import { z } from 'zod';

const stripeConfigSchema = z.object({
  publishableKey: z.string().optional(),
  secretKey: z.string().optional(),
  webhookSecret: z.string().optional()
});

const paypalConfigSchema = z.object({
  clientId: z.string().optional(),
  clientSecret: z.string().optional(),
  webhookId: z.string().optional()
});

const updatePaymentSettingsSchema = z.object({
  stripe: z.object({
    enabled: z.boolean().optional(),
    mode: z.enum(['test', 'live']).optional(),
    test: stripeConfigSchema.optional(),
    live: stripeConfigSchema.optional()
  }).optional(),
  paypal: z.object({
    enabled: z.boolean().optional(),
    mode: z.enum(['sandbox', 'live']).optional(),
    sandbox: paypalConfigSchema.optional(),
    live: paypalConfigSchema.optional()
  }).optional(),
  currency: z.string().optional(),
  environment: z.enum(['development', 'production']).optional()
});

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        
        const settings = await PaymentSettings.getSettings();
        
        const safeSettings = {
            _id: settings._id,
            stripe: {
                enabled: settings.stripe.enabled,
                mode: settings.stripe.mode,
                test: {
                    publishableKey: settings.stripe.test.publishableKey,
                    secretKey: settings.stripe.test.secretKey ? '••••••••' : undefined,
                    webhookSecret: settings.stripe.test.webhookSecret ? '••••••••' : undefined
                },
                live: {
                    publishableKey: settings.stripe.live.publishableKey,
                    secretKey: settings.stripe.live.secretKey ? '••••••••' : undefined,
                    webhookSecret: settings.stripe.live.webhookSecret ? '••••••••' : undefined
                }
            },
            paypal: {
                enabled: settings.paypal.enabled,
                mode: settings.paypal.mode,
                sandbox: {
                    clientId: settings.paypal.sandbox.clientId,
                    clientSecret: settings.paypal.sandbox.clientSecret ? '••••••••' : undefined,
                    webhookId: settings.paypal.sandbox.webhookId
                },
                live: {
                    clientId: settings.paypal.live.clientId,
                    clientSecret: settings.paypal.live.clientSecret ? '••••••••' : undefined,
                    webhookId: settings.paypal.live.webhookId
                }
            },
            currency: settings.currency,
            environment: settings.environment,
            lastUpdated: settings.lastUpdated,
            updatedBy: settings.updatedBy
        };
        
        return NextResponse.json({
            success: true,
            data: safeSettings
        });
    } catch (error: unknown) {
        console.error('Error fetching payment settings:', error);
        return NextResponse.json({ 
            success: false,
            error: 'Failed to fetch payment settings' 
        }, { status: 500 });
    }
}

export async function PATCH(req: NextRequest) {
    try {
        await connectDB();
        await requireAuth();
        
        const body = await req.json();
        const validatedData = updatePaymentSettingsSchema.parse(body);
        
        const settings = await PaymentSettings.getSettings();
        
        if (validatedData.stripe) {
            if (validatedData.stripe.enabled !== undefined) {
                settings.stripe.enabled = validatedData.stripe.enabled;
            }
            if (validatedData.stripe.mode) {
                settings.stripe.mode = validatedData.stripe.mode;
            }
            if (validatedData.stripe.test) {
                Object.assign(settings.stripe.test, validatedData.stripe.test);
            }
            if (validatedData.stripe.live) {
                Object.assign(settings.stripe.live, validatedData.stripe.live);
            }
        }
        
        if (validatedData.paypal) {
            if (validatedData.paypal.enabled !== undefined) {
                settings.paypal.enabled = validatedData.paypal.enabled;
            }
            if (validatedData.paypal.mode) {
                settings.paypal.mode = validatedData.paypal.mode;
            }
            if (validatedData.paypal.sandbox) {
                Object.assign(settings.paypal.sandbox, validatedData.paypal.sandbox);
            }
            if (validatedData.paypal.live) {
                Object.assign(settings.paypal.live, validatedData.paypal.live);
            }
        }
        
        if (validatedData.currency) {
            settings.currency = validatedData.currency;
        }
        
        if (validatedData.environment) {
            settings.environment = validatedData.environment;
        }
        
        settings.lastUpdated = new Date();
        settings.updatedBy = 'admin';
        
        await settings.save();
        
        const validation = settings.validateConfiguration();
        
        return NextResponse.json({
            success: true,
            message: 'Payment settings updated successfully',
            data: {
                _id: settings._id,
                validation
            }
        });
    } catch (error: unknown) {
        console.error('Error updating payment settings:', error);
        
        if (error instanceof z.ZodError) {
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            
            return NextResponse.json({ 
                success: false,
                error: 'Validation failed',
                details: formattedErrors
            }, { status: 400 });
        }
        
        return NextResponse.json({ 
            success: false,
            error: 'Failed to update payment settings' 
        }, { status: 500 });
    }
}

