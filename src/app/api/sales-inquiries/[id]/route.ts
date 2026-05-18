import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../lib/db';
import { requireAuth, errorResponse } from '../../lib/auth';
import { SalesInquiry } from '../../models/SalesInquiry';

export async function DELETE(
    req: NextRequest,
    { params }: { params: Promise<{ id: string }> }
) {
    try {
        await connectDB();
        await requireAuth();
        
        const { id } = await params;
        const inquiry = await SalesInquiry.findByIdAndDelete(id);

        if (!inquiry) {
            return NextResponse.json({ error: 'Sales inquiry not found' }, { status: 404 });
        }

        return NextResponse.json({ message: 'Sales inquiry deleted successfully' });
    } catch (error: unknown) {
        console.error('Error deleting sales inquiry:', error);
        return errorResponse('Failed to delete sales inquiry', 500);
    }
}

