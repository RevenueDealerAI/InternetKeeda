import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../lib/db';
import { requireAuth, errorResponse } from '../lib/auth';
import { NewsletterSubscription } from '../models/NewsletterSubscription';
import { z } from 'zod';

const subscriptionSchema = z.object({
  email: z.string().email("Please enter a valid email address"),
  source: z.enum(['footer', 'homepage', 'other']).optional().default('footer'),
});

export async function GET(req: NextRequest) {
    try {
        await connectDB();
        const subscriptions = await NewsletterSubscription.find().sort({ subscribedAt: -1 });
        return NextResponse.json(subscriptions);
    } catch (error: unknown) {
        console.error('Error fetching newsletter subscriptions:', error);
        return errorResponse('Failed to fetch newsletter subscriptions', 500);
    }
}

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        
        const headers = req.headers;
        const ipAddress = headers.get('x-forwarded-for') || 
                         headers.get('x-real-ip') || 
                         'unknown';
        const userAgent = headers.get('user-agent') || 'unknown';

        const body = await req.json();
        const validatedData = subscriptionSchema.parse(body);

        const existingSubscription = await NewsletterSubscription.findOne({ 
            email: validatedData.email 
        });

        if (existingSubscription) {
            if (existingSubscription.status === 'active') {
                return NextResponse.json({
                    success: false,
                    message: "You're already subscribed to our newsletter!",
                    data: existingSubscription
                }, { status: 409 });
            } else {
                existingSubscription.status = 'active';
                existingSubscription.subscribedAt = new Date();
                existingSubscription.unsubscribedAt = undefined;
                existingSubscription.source = validatedData.source;
                existingSubscription.ipAddress = Array.isArray(ipAddress) ? ipAddress[0] : ipAddress;
                existingSubscription.userAgent = userAgent;
                
                await existingSubscription.save();
                
                return NextResponse.json({
                    success: true,
                    message: "Welcome back! You've been resubscribed to our newsletter.",
                    data: existingSubscription
                });
            }
        }

        const subscriptionData = {
            email: validatedData.email,
            source: validatedData.source,
            status: 'active' as const,
            subscribedAt: new Date(),
            ipAddress: Array.isArray(ipAddress) ? ipAddress[0] : ipAddress,
            userAgent: userAgent,
        };

        const subscription = await NewsletterSubscription.create(subscriptionData);
        
        return NextResponse.json({
            success: true,
            message: "Thank you for subscribing! You'll receive our latest AI tools and news.",
            data: subscription
        }, { status: 201 });
    } catch (error: unknown) {
        console.error('Error creating newsletter subscription:', error);
        
        if (error instanceof z.ZodError) {
            const formattedErrors = error.errors.map(err => ({
                field: err.path.join('.'),
                message: err.message
            }));
            
            return NextResponse.json({ 
                success: false,
                error: 'Validation failed',
                details: formattedErrors,
                message: formattedErrors.map(e => e.message).join(', ')
            }, { status: 400 });
        }
        
        return NextResponse.json({ 
            success: false,
            error: 'Failed to subscribe to newsletter',
            message: 'An error occurred while processing your subscription'
        }, { status: 500 });
    }
}

