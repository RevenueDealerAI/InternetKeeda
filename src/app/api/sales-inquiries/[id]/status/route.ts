import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { requireAuth, errorResponse } from '../../../lib/auth';
import { SalesInquiry } from '../../../models/SalesInquiry';

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

        if (!['new', 'contacted', 'closed'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const inquiry = await SalesInquiry.findByIdAndUpdate(
            id,
            { 
                status,
                updatedAt: new Date()
            },
            { new: true }
        );

        if (!inquiry) {
            return NextResponse.json({ error: 'Sales inquiry not found' }, { status: 404 });
        }

        return NextResponse.json(inquiry);
    } catch (error: unknown) {
        console.error('Error updating sales inquiry:', error);
        return errorResponse('Failed to update sales inquiry', 500);
    }
}

