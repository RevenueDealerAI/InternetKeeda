import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '../../../lib/db';
import { requireAuth, errorResponse } from '../../../lib/auth';
import { ToolSubmission } from '../../../models/ToolSubmission';

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

        if (!['pending', 'approved', 'rejected'].includes(status)) {
            return NextResponse.json({ error: 'Invalid status' }, { status: 400 });
        }

        const submission = await ToolSubmission.findByIdAndUpdate(
            id,
            { status },
            { new: true }
        );

        if (!submission) {
            return NextResponse.json({ error: 'Tool submission not found' }, { status: 404 });
        }

        return NextResponse.json(submission);
    } catch (error: unknown) {
        console.error('Error updating tool submission:', error);
        return errorResponse('Failed to update tool submission', 500);
    }
}

