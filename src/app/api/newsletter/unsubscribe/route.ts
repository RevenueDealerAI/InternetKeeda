import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { errorResponse } from '../../lib/auth';
import { NewsletterSubscription } from '../../models/NewsletterSubscription';

export async function POST(req: NextRequest) {
    try {
        await connectDB();
        const body = await req.json();
        const { email } = body;

        if (!email) {
            return NextResponse.json({ error: 'Email is required' }, { status: 400 });
        }

        const subscription = await NewsletterSubscription.findOneAndUpdate(
            { email: email.toLowerCase().trim() },
            { 
                status: 'unsubscribed',
                unsubscribedAt: new Date()
            },
            { new: true }
        );

        if (!subscription) {
            return NextResponse.json({ error: 'Email not found in our subscription list' }, { status: 404 });
        }

        return NextResponse.json({
            success: true,
            message: 'You have been successfully unsubscribed from our newsletter.'
        });
    } catch (error: unknown) {
        console.error('Error unsubscribing from newsletter:', error);
        return errorResponse('Failed to unsubscribe from newsletter', 500);
    }
}

