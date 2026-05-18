import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { requireAuth, errorResponse } from '../../lib/auth';
import { NewsletterSubscription } from '../../models/NewsletterSubscription';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        await requireAuth();
        
        const { id } = await params;
        const subscription = await NewsletterSubscription.findByIdAndDelete(id);

        if (!subscription) {
            return NextResponse.json({ error: 'Newsletter subscription not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Newsletter subscription deleted successfully' });
    } catch (error: unknown) {
        console.error('Error deleting newsletter subscription:', error);
        return errorResponse('Failed to delete newsletter subscription', 500);
    }
}

