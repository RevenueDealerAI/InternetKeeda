import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { requireAuth, errorResponse } from '../../../lib/auth';
import { NewsletterSubscription } from '../../../models/NewsletterSubscription';

export async function PATCH(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        await requireAuth();
        
        const { id } = await params;
        const body = await req.json();
        const { status } = body;

        if (!['active', 'unsubscribed'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const updateData: Record<string, unknown> = { status };
        if (status === 'unsubscribed') {
            updateData.unsubscribedAt = new Date();
        } else {
            updateData.unsubscribedAt = undefined;
        }

        const subscription = await NewsletterSubscription.findByIdAndUpdate(
            id,
            updateData,
            { new: true }
        );

        if (!subscription) {
            return NextResponse.json({ error: 'Newsletter subscription not found' }, { status: 404 });
        }

        return NextResponse.json(subscription);
    } catch (error: unknown) {
        console.error('Error updating newsletter subscription:', error);
        return errorResponse('Failed to update newsletter subscription', 500);
    }
}

